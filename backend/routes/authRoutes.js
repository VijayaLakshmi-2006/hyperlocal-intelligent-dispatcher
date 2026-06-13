import express from "express";
import { register, login, updateProfile, changePassword } from "../controllers/authController.js";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/profile", protect, asyncHandler(async (req, res) => {
  res.json(req.user);
}));
authRouter.put("/profile", protect, updateProfile);
authRouter.put("/profile/password", protect, changePassword);

export default authRouter;