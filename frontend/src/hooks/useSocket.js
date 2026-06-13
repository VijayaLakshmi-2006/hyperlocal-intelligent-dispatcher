// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react'
import { initSocket, getSocket, joinOrderRoom, leaveOrderRoom } from '../services/socketService'

/**
 * useSocket — manages a socket connection for a specific order room.
 * Provides connection status and the raw socket instance.
 */
export const useSocket = (orderId) => {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = initSocket()
    socketRef.current = socket

    const onConnect    = () => { setConnected(true);  if (orderId) joinOrderRoom(orderId) }
    const onDisconnect = () => setConnected(false)

    socket.on('connect',    onConnect)
    socket.on('disconnect', onDisconnect)

    if (socket.connected) {
      setConnected(true)
      if (orderId) joinOrderRoom(orderId)
    }

    return () => {
      socket.off('connect',    onConnect)
      socket.off('disconnect', onDisconnect)
      if (orderId) leaveOrderRoom(orderId)
    }
  }, [orderId])

  return { socket: socketRef.current, connected }
}
