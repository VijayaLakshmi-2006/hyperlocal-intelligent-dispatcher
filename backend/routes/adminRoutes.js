import express from "express";
import { getMapDashboard } from "../controllers/adminController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/map-dashboard", protect, authorizeRoles("admin"), getMapDashboard);

export default adminRouter;
