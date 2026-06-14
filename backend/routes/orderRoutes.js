import express from "express";
import {createOrder,getMyOrders} from "../controllers/orderController.js";
import {protect,authorizeRoles} from "../middleware/authMiddleware.js";
import {getPendingOrders,acceptOrder,updateOrderStatus,getAgentOrders,trackOrder} from "../controllers/orderController.js";

const orderRouter = express.Router();

// create order
orderRouter.post("/create",protect,authorizeRoles("customer"),createOrder);

// get my orders
orderRouter.get("/my-orders",protect,authorizeRoles("customer"),getMyOrders);

// agent sees pending orders
orderRouter.get("/pending",protect,authorizeRoles("agent"),getPendingOrders);

// agent accepts order
orderRouter.put("/accept/:orderId",protect,authorizeRoles("agent"),acceptOrder);

// agent updates order status
orderRouter.put("/update-status/:orderId",protect,authorizeRoles("agent"),updateOrderStatus);

// agent assigned orders
orderRouter.get("/agent-orders",protect,authorizeRoles("agent"),getAgentOrders);

// customer, assigned agent, or admin tracks a delivery
orderRouter.get("/track/:orderId",protect,authorizeRoles("customer","agent","admin"),trackOrder);

// New Order Lifecycle Routes
import {
  confirmOrder,
  assignAgentToOrder,
  pickupOrder,
  outForDeliveryOrder,
  deliverOrder,
  cancelOrder
} from "../controllers/orderController.js";

orderRouter.patch("/:orderId/confirm", protect, confirmOrder);
orderRouter.patch("/:orderId/assign-agent", protect, assignAgentToOrder);
orderRouter.patch("/:orderId/pickup", protect, pickupOrder);
orderRouter.patch("/:orderId/out-for-delivery", protect, outForDeliveryOrder);
orderRouter.patch("/:orderId/deliver", protect, deliverOrder);
orderRouter.patch("/:orderId/cancel", protect, authorizeRoles("customer"), cancelOrder);

export default orderRouter;
