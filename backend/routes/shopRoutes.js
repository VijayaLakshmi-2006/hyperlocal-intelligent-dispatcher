import express from "express";
import { createShop, getShops, seedDemoShops } from "../controllers/shopController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const shopRouter = express.Router();

shopRouter.get("/", protect, authorizeRoles("admin", "customer"), getShops);
shopRouter.post("/", protect, authorizeRoles("admin"), createShop);
shopRouter.post("/seed-demo", protect, authorizeRoles("admin"), seedDemoShops);

export default shopRouter;
