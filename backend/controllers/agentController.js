import Agent from "../models/agentModel.js";
import {
  getAgentSearchRadiusMeters,
  getOnlineSinceDate,
  haversineDistanceMeters,
  isValidCoordinate,
} from "../utils/location.js";
import { emitSocketEvent } from "../utils/socket.js";

const formatAgent = (agent, referenceLocation) => {
  const location = {
    latitude: agent.currentLocation?.latitude,
    longitude: agent.currentLocation?.longitude,
    lastUpdated: agent.currentLocation?.lastUpdated,
  };

  return {
    id: agent._id,
    user: agent.user,
    isAvailable: agent.isAvailable,
    activeOrder: agent.activeOrder,
    vehicleType: agent.vehicleType,
    isVerified: agent.isVerified,
    currentLocation: location,
    distanceMeters:
      referenceLocation && isValidCoordinate(location.latitude, location.longitude)
        ? Math.round(haversineDistanceMeters(referenceLocation, location))
        : undefined,
  };
};

export const ensureAgentProfile = async (userId) => {
  let agent = await Agent.findOne({ user: userId });

  if (!agent) {
    agent = await Agent.create({
      user: userId,
    });
  }

  return agent;
};

export const updateAgentLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    const now = new Date();
    const agent = await Agent.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          currentLocation: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            lastUpdated: now,
          },
          location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
        },
        $setOnInsert: {
          user: req.user._id,
          isAvailable: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name email phone role");

    const payload = {
      agentId: agent._id,
      userId: agent.user?._id || req.user._id,
      orderId: agent.activeOrder,
      latitude: Number(latitude),
      longitude: Number(longitude),
      lastUpdated: now,
    };

    const rooms = ["admin:dashboard"];
    if (agent.activeOrder) {
      rooms.push(`order:${agent.activeOrder}`);
    }

    emitSocketEvent("agentLocationUpdate", payload, rooms);
    emitSocketEvent("agentLocationUpdated", payload, rooms);

    res.status(200).json({
      message: "Agent location updated",
      agent: formatAgent(agent),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getNearbyAgents = async (req, res) => {
  try {
    const body = req.body || {};
    const latitude = req.query.latitude ?? body.latitude;
    const longitude = req.query.longitude ?? body.longitude;
    const radius = Number(req.query.radius || body.radius || getAgentSearchRadiusMeters());

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    const referenceLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    const agents = await Agent.find({
      isAvailable: true,
      activeOrder: null,
      "currentLocation.lastUpdated": { $gte: getOnlineSinceDate() },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [referenceLocation.longitude, referenceLocation.latitude],
          },
          $maxDistance: radius,
        },
      },
    }).populate("user", "name email phone role");

    res.status(200).json({
      count: agents.length,
      radiusMeters: radius,
      agents: agents.map((agent) => formatAgent(agent, referenceLocation)),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getOnlineAgents = async (req, res) => {
  try {
    const agents = await Agent.find({
      "currentLocation.lastUpdated": { $gte: getOnlineSinceDate() },
    }).populate("user", "name email phone role");

    res.status(200).json({
      count: agents.length,
      agents: agents.map((agent) => formatAgent(agent)),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
