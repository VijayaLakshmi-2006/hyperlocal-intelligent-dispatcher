import Order from "../models/orderModel.js";
import Agent from "../models/agentModel.js";
import {
  getAgentSearchRadiusMeters,
  normalizeAddressLocation,
  toGeoPoint,
} from "../utils/location.js";
import { emitSocketEvent } from "../utils/socket.js";

const populateOrder = (query) =>
  query
    .populate("customer", "name email phone role")
    .populate("assignedAgent", "name email phone role");

const findClosestAvailableAgent = async (pickupLocation) => {
  const pickupGeoLocation = toGeoPoint(pickupLocation);

  if (!pickupGeoLocation) {
    return null;
  }

  return Agent.findOne({
    isAvailable: true,
    activeOrder: null,
    location: {
      $near: {
        $geometry: pickupGeoLocation,
        $maxDistance: getAgentSearchRadiusMeters(),
      },
    },
  }).populate("user", "name email phone role");
};

export const createOrder = async (req, res) => {
  try {
    const {
      pickupLocation,
      deliveryLocation,
      pickupAddress,
      deliveryAddress,
      packageDetails,
      price,
      paymentMethod,
      shopId,
    } = req.body;

    const normalizedPickup = normalizeAddressLocation(
      pickupLocation,
      pickupAddress
    );
    const normalizedDelivery = normalizeAddressLocation(
      deliveryLocation,
      deliveryAddress
    );

    if (normalizedPickup.error || normalizedDelivery.error) {
      return res.status(400).json({
        message: normalizedPickup.error || normalizedDelivery.error,
      });
    }

    const closestAgent = await findClosestAvailableAgent(normalizedPickup.value);

    const order = await Order.create({
      customer: req.user._id,
      assignedAgent: null, // Don't assign right away, wait for simulated assignment
      pickupAddress: normalizedPickup.value.address,
      deliveryAddress: normalizedDelivery.value.address,
      pickupLocation: normalizedPickup.value,
      deliveryLocation: normalizedDelivery.value,
      pickupGeoLocation: toGeoPoint(normalizedPickup.value),
      deliveryGeoLocation: toGeoPoint(normalizedDelivery.value),
      packageDetails,
      price,
      paymentMethod,
      shop: shopId || null,
      status: "PLACED",
    });

    const fullOrder = await populateOrder(Order.findById(order._id));

    emitSocketEvent("orderCreated", {
      order: fullOrder,
    }, ["admin:dashboard", `order:${order._id}`]);

    if (closestAgent) {
      closestAgent.isAvailable = false;
      closestAgent.activeOrder = order._id;
      await closestAgent.save();

      emitSocketEvent("orderAssigned", {
        order: fullOrder,
        agentId: closestAgent._id,
        agentUserId: closestAgent.user._id,
      }, ["admin:dashboard", `order:${order._id}`]);
      emitSocketEvent("agentAssigned", {
        order: fullOrder,
        agentId: closestAgent._id,
        agentUserId: closestAgent.user._id,
      }, ["admin:dashboard", `order:${order._id}`]);
    }

    res.status(201).json({
      message: closestAgent
        ? "Order Created And Assigned To Nearby Agent"
        : "Order Created Successfully, No Nearby Agent Available",
      order: fullOrder,
      assignment: closestAgent
        ? {
            agent: closestAgent,
            radiusMeters: getAgentSearchRadiusMeters(),
          }
        : {
            agent: null,
            radiusMeters: getAgentSearchRadiusMeters(),
          },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await populateOrder(
      Order.find({
        customer: req.user._id,
      }).sort({ priority: 1, createdAt: 1 })
    );

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const orders = await populateOrder(
      Order.find({
        status: "pending",
      }).sort({ createdAt: -1 })
    );

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//AGENT ACCEPT ORDER
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order Not Found",
      });
    }

    // already accepted
    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Order Already Accepted",
      });
    }

    // assign agent
    order.assignedAgent = req.user._id;

    order.status = "accepted";

    await order.save();

    const agent = await Agent.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          isAvailable: false,
          activeOrder: order._id,
        },
        $setOnInsert: {
          user: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const fullOrder = await populateOrder(Order.findById(order._id));

    emitSocketEvent("orderAccepted", {
      order: fullOrder,
      agentId: agent._id,
      agentUserId: req.user._id,
    }, ["admin:dashboard", `order:${order._id}`]);

    res.status(200).json({
      message: "Order Accepted Successfully",
      order: fullOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { status } = req.body;

    // valid statuses
    const validStatuses = ["picked_up", "out_for_delivery", "delivered"];

    // check valid status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid Status",
      });
    }

    // find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order Not Found",
      });
    }

    // only assigned agent can update
    if (!order.assignedAgent || order.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not Authorized To Update This Order",
      });
    }

    // update status
    order.status = status;
    // set delivery time
     if (status === "delivered") {
     order.deliveredAt = new Date();
    }
    await order.save();

    const agentUpdate =
      status === "delivered"
        ? {
            $set: {
              isAvailable: true,
              activeOrder: null,
            },
            $setOnInsert: {
              user: req.user._id,
            },
            $inc: {
              totalDeliveries: 1,
            },
          }
        : {
            $set: {
              activeOrder: order._id,
              isAvailable: false,
            },
            $setOnInsert: {
              user: req.user._id,
            },
          };

    await Agent.findOneAndUpdate({ user: req.user._id }, agentUpdate, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    const fullOrder = await populateOrder(Order.findById(order._id));

    const eventName = status === "delivered" ? "orderDelivered" : "orderStatusUpdate";
    emitSocketEvent(eventName, {
      order: fullOrder,
      status,
    }, ["admin:dashboard", `order:${order._id}`]);

    res.status(200).json({
      message: "Order Status Updated",
      order: fullOrder,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAgentOrders = async (req, res) => {
  try {
    const orders = await populateOrder(
      Order.find({
        assignedAgent: req.user._id,
      }).sort({ createdAt: -1 })
    );

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await populateOrder(Order.findById(orderId));

    if (!order) {
      return res.status(404).json({
        message: "Order Not Found",
      });
    }

    const isCustomer = order.customer?._id?.toString() === req.user._id.toString();
    const isAssignedAgent =
      order.assignedAgent?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isAssignedAgent && !isAdmin) {
      return res.status(403).json({
        message: "Not Authorized To Track This Order",
      });
    }

    const agent = order.assignedAgent
      ? await Agent.findOne({ user: order.assignedAgent._id }).populate(
          "user",
          "name email phone role"
        )
      : null;

    res.status(200).json({
      order,
      agent,
      socketRoom: `order:${order._id}`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// NEW ORDER LIFECYCLE CONTROLLERS
// ==========================================

export const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "CONFIRMED" },
      { new: true }
    ).populate("customer", "name email phone role");

    if (!order) return res.status(404).json({ message: "Order Not Found" });

    emitSocketEvent("orderStatusChanged", { order, status: "CONFIRMED" }, [
      "admin:dashboard",
      `order:${order._id}`,
    ]);

    res.status(200).json({ message: "Order Confirmed", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignAgentToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "AGENT_ASSIGNED",
        agentName: "Rahul Kumar",
        agentPhone: "9876543210",
        assignedAt: new Date(),
      },
      { new: true }
    ).populate("customer", "name email phone role");

    if (!order) return res.status(404).json({ message: "Order Not Found" });

    emitSocketEvent("orderStatusChanged", { order, status: "AGENT_ASSIGNED" }, [
      "admin:dashboard",
      `order:${order._id}`,
    ]);
    emitSocketEvent("agentAssigned", { order, agentName: order.agentName }, [
      `order:${order._id}`,
    ]);

    res.status(200).json({ message: "Agent Assigned", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const pickupOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "PICKED_UP", pickedUpAt: new Date() },
      { new: true }
    ).populate("customer", "name email phone role");

    if (!order) return res.status(404).json({ message: "Order Not Found" });

    emitSocketEvent("orderStatusChanged", { order, status: "PICKED_UP" }, [
      "admin:dashboard",
      `order:${order._id}`,
    ]);

    res.status(200).json({ message: "Order Picked Up", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const outForDeliveryOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "OUT_FOR_DELIVERY" },
      { new: true }
    ).populate("customer", "name email phone role");

    if (!order) return res.status(404).json({ message: "Order Not Found" });

    emitSocketEvent("orderStatusChanged", { order, status: "OUT_FOR_DELIVERY" }, [
      "admin:dashboard",
      `order:${order._id}`,
    ]);

    res.status(200).json({ message: "Out For Delivery", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "DELIVERED", deliveredAt: new Date() },
      { new: true }
    ).populate("customer", "name email phone role");

    if (!order) return res.status(404).json({ message: "Order Not Found" });

    emitSocketEvent("orderStatusChanged", { order, status: "DELIVERED" }, [
      "admin:dashboard",
      `order:${order._id}`,
    ]);
    emitSocketEvent("orderDelivered", { order }, [`order:${order._id}`]);

    res.status(200).json({ message: "Order Delivered", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
