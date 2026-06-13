import express from "express";
import {
  getNearbyAgents,
  getOnlineAgents,
  updateAgentLocation,
} from "../controllers/agentController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const agentRouter = express.Router();

agentRouter.put("/location", protect, authorizeRoles("agent"), updateAgentLocation);
agentRouter.get("/nearby", protect, authorizeRoles("admin", "customer"), getNearbyAgents);
agentRouter.get("/online", protect, authorizeRoles("admin"), getOnlineAgents);

export default agentRouter;
