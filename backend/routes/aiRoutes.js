import express from "express";
import {
  createCommerceOrder,
  getAIAnalytics,
  searchCommerce,
  buildAICart,
  addAICartToOrder,
  getSpendingInsights,
  getSmartReorder,
} from "../controllers/aiController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const aiRouter = express.Router();

// Existing routes
aiRouter.post("/search", protect, authorizeRoles("customer", "admin"), searchCommerce);
aiRouter.post("/order", protect, authorizeRoles("customer"), createCommerceOrder);
aiRouter.get("/analytics", protect, authorizeRoles("admin"), getAIAnalytics);

// New AI Cart Builder routes
aiRouter.post("/cart-builder", protect, authorizeRoles("customer", "admin"), buildAICart);
aiRouter.post("/add-cart", protect, authorizeRoles("customer", "admin"), addAICartToOrder);
aiRouter.get("/spending-insights", protect, authorizeRoles("customer"), getSpendingInsights);
aiRouter.get("/recommend-reorder", protect, authorizeRoles("customer"), getSmartReorder);

export default aiRouter;
