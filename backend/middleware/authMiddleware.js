import jwt from "jsonwebtoken";

import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  try {
    let token;

    // check token exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // get user from DB
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "User no longer exists",
        });
      }

      next();
    } else {
      res.status(401).json({
        message: "No Token Found",
      });
    }
  } catch (error) {
    res.status(401).json({
      message: "Token Failed",
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // check role allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    next();
  };
};

export {protect, authorizeRoles};