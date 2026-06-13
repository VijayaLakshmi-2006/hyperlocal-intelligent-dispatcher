import Agent from "../models/agentModel.js";
import Order from "../models/orderModel.js";
import { getOnlineSinceDate } from "../utils/location.js";

export const getMapDashboard = async (req, res) => {
  try {
    const activeStatuses = ["pending", "accepted", "picked_up", "out_for_delivery"];

    const [orders, agents] = await Promise.all([
      Order.find({ status: { $in: activeStatuses } })
        .populate("customer", "name email phone")
        .populate("assignedAgent", "name email phone role")
        .sort({ createdAt: -1 }),
      Agent.find({
        "currentLocation.lastUpdated": { $gte: getOnlineSinceDate() },
      }).populate("user", "name email phone role"),
    ]);

    res.status(200).json({
      orders,
      agents,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
