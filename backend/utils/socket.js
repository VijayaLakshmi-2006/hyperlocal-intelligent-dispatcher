import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join order room for tracking
    socket.on("joinOrderRoom", (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`Socket ${socket.id} joined room: order:${orderId}`);
      }
    });

    // Leave order room
    socket.on("leaveOrderRoom", (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`Socket ${socket.id} left room: order:${orderId}`);
      }
    });

    // Legacy event names (kept for backward compatibility)
    socket.on("joinOrder", (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on("leaveOrder", (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
    });

    // Join admin dashboard
    socket.on("joinAdmin", () => {
      socket.join("admin:dashboard");
      console.log(`Socket ${socket.id} joined admin dashboard`);
    });

    socket.on("leaveAdmin", () => {
      socket.leave("admin:dashboard");
      console.log(`Socket ${socket.id} left admin dashboard`);
    });

    // Agent updates location via socket (alternative to REST)
    socket.on("updateAgentLocation", (data) => {
      if (data.agentId && data.location) {
        // BUG FIX #1: Normalize payload to flat lat/lng keys that frontend listener expects
        const lat = data.location.latitude ?? data.location.lat
        const lng = data.location.longitude ?? data.location.lng
        if (!lat || !lng) {
          console.warn('[Socket] updateAgentLocation: missing lat/lng in', data.location)
          return
        }
        const normalizedPayload = {
          agentId:     data.agentId,
          latitude:    lat,
          longitude:   lng,
          lastUpdated: new Date(),
        }
        console.log('[Socket] Relaying agentLocationUpdate:', normalizedPayload)
        // Emit to all if no orderId, otherwise target order room
        if (data.orderId) {
          io.to(`order:${data.orderId}`).emit('agentLocationUpdate',  normalizedPayload)
          io.to(`order:${data.orderId}`).emit('agentLocationUpdated', normalizedPayload)
        } else {
          io.emit('agentLocationUpdate',  normalizedPayload)
          io.emit('agentLocationUpdated', normalizedPayload)
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => io;

export const emitSocketEvent = (eventName, payload, rooms = []) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }

  if (!rooms.length) {
    io.emit(eventName, payload);
    return;
  }

  rooms.forEach((room) => {
    io.to(room).emit(eventName, payload);
  });
};
