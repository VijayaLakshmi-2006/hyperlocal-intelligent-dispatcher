import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";

import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";

import {protect,authorizeRoles} from "./middleware/authMiddleware.js";

import orderRouter from "./routes/orderRoutes.js";
import agentRouter from "./routes/agentRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import shopRouter from "./routes/shopRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";

import {notFound,errorHandler} from "./middleware/errorMiddleware.js";
import { initSocket } from "./utils/socket.js";

const app = express();
const server = http.createServer(app);


dotenv.config();

connectDB();

// middlewares
app.use(cors());
app.use(express.json());

app.use("/api/auth",authRouter);

app.use("/api/orders", orderRouter);
app.use("/api/agents", agentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ai", aiRouter);
app.use("/api/shops", shopRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || process.env.SOCKET_PORT || 5002;

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
