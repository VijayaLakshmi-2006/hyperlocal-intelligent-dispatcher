// src/services/socketService.js
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5003'

let socket = null

export const initSocket = () => {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Join order tracking room
export const joinOrderRoom = (orderId) => {
  if (socket?.connected && orderId) {
    socket.emit('joinOrderRoom', orderId)
    socket.emit('joinOrder', orderId) // legacy compat
  }
}

// Leave order tracking room
export const leaveOrderRoom = (orderId) => {
  if (socket?.connected && orderId) {
    socket.emit('leaveOrderRoom', orderId)
    socket.emit('leaveOrder', orderId)
  }
}

// Join admin room
export const joinAdminRoom = () => {
  if (socket?.connected) {
    socket.emit('joinAdmin')
  }
}

export default { initSocket, getSocket, disconnectSocket, joinOrderRoom, leaveOrderRoom, joinAdminRoom }
