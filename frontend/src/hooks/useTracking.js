import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { config } from '../config'
import { haversineKm, estimateETA } from '../services/trackingApi'
import { initSocket, joinOrderRoom, leaveOrderRoom } from '../services/socketService'
import { useNotifications } from '../context/NotificationContext'
import { orderService } from '../services/serviceFactory'

const POLL_INTERVAL_MS = 10000

export const useTracking = (orderId) => {
  const [agentLocation, setAgentLocation] = useState(null)
  const [orderStatus,   setOrderStatus]   = useState(null)
  const [connected,     setConnected]     = useState(false)
  const [agentDetails,  setAgentDetails]  = useState(null)
  const socketRef                         = useRef(null)
  const demoIntervalRef                   = useRef(null)
  const refetchRef                        = useRef(null)  
  const { addNotification }               = useNotifications()

  // ── REST fetch (initial + poll fallback) ──────────────────────────
  const { data, isLoading, isError, refetch } = useQuery(
    ['tracking', orderId],
    () => {
      console.log('[Tracking] REST polling order:', orderId)
      return orderService.trackOrder(orderId)
    },
    {
      enabled:         !!orderId,
      refetchInterval: POLL_INTERVAL_MS,
      onSuccess: (res) => {
        const d = res.data
        console.log('[Tracking] REST response:', d)

        if (d.agent?.currentLocation?.latitude) {
          setAgentLocation(d.agent.currentLocation)
        }
        if (d.order?.status) {
          setOrderStatus(d.order.status)
        }
        if (d.order?.agentName) {
          setAgentDetails({
            name: d.order.agentName,
            phone: d.order.agentPhone,
          })
        }
      },
    }
  )

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  const order          = data?.data?.order   || null
  const agent          = data?.data?.agent   || null
  const pickupCoords   = order?.pickupLocation
  const deliveryCoords = order?.deliveryLocation

  // ── Socket Setup (runs once per orderId) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return
    if (!config.USE_BACKEND) return   

    const socket = initSocket()
    socketRef.current = socket

    const onConnect = () => {
      setConnected(true)
      joinOrderRoom(orderId)
    }

    const onDisconnect = () => {
      setConnected(false)
      refetchRef.current?.()
    }

    const onAgentLocation = (payload) => {
      const lat = payload?.latitude ?? payload?.location?.latitude ?? payload?.location?.lat
      const lng = payload?.longitude ?? payload?.location?.longitude ?? payload?.location?.lng
      if (lat && lng) {
        setAgentLocation({
          latitude:    lat,
          longitude:   lng,
          lastUpdated: payload.lastUpdated || new Date(),
        })
      }
    }

    const onStatusUpdate = (payload) => {
      if (payload?.status) {
        setOrderStatus(payload.status)
        const labels = {
          CONFIRMED:         '✅ Order Confirmed!',
          AGENT_ASSIGNED:    '🛵 Agent Assigned!',
          PICKED_UP:         '📦 Order Picked Up!',
          OUT_FOR_DELIVERY:  '🚀 Out For Delivery!',
          DELIVERED:         '🎉 Order Delivered!',
        }
        const msg = labels[payload.status]
        if (msg) {
          toast.success(msg, { duration: 5000 })
          addNotification({ title: msg, type: payload.status.toLowerCase() })
        }
        refetchRef.current?.()
      }
    }

    const onDelivered = (payload) => {
      setOrderStatus('DELIVERED')
      toast.success('🎉 Your order has been delivered!', { duration: 6000 })
      addNotification({ title: '🎉 Order Delivered!', type: 'delivered' })
      refetchRef.current?.()
    }

    const onAssigned = (payload) => {
      setOrderStatus('AGENT_ASSIGNED')
      if (payload?.agentName) {
         setAgentDetails({
           name: payload.agentName,
           phone: payload.agentPhone || '9876543210'
         })
      }
      toast.success('🛵 A delivery agent has been assigned!', { duration: 5000 })
      addNotification({ title: '🛵 Agent Assigned', type: 'assigned' })
      refetchRef.current?.()
    }

    socket.on('connect',              onConnect)
    socket.on('disconnect',           onDisconnect)
    socket.on('agentLocationUpdate',  onAgentLocation)
    socket.on('agentLocationUpdated', onAgentLocation)
    socket.on('orderStatusChanged',   onStatusUpdate)
    socket.on('orderDelivered',       onDelivered)
    socket.on('agentAssigned',        onAssigned)
    socket.on('orderCreated',         () => refetchRef.current?.())

    if (socket.connected) {
      setConnected(true)
      joinOrderRoom(orderId)
    }

    return () => {
      socket.off('connect',              onConnect)
      socket.off('disconnect',           onDisconnect)
      socket.off('agentLocationUpdate',  onAgentLocation)
      socket.off('agentLocationUpdated', onAgentLocation)
      socket.off('orderStatusChanged',   onStatusUpdate)
      socket.off('orderDelivered',       onDelivered)
      socket.off('agentAssigned',        onAssigned)
      socket.off('orderCreated')
      leaveOrderRoom(orderId)
    }
  }, [orderId])

  // ── Automated Backend Demo Simulator ─────────────────
  useEffect(() => {
    if (!orderId || !config.USE_BACKEND) return
    if (!orderStatus) return
    if (orderStatus === 'DELIVERED' || orderStatus === 'CANCELLED') return

    let timeoutId;

    if (orderStatus === 'PLACED') {
      timeoutId = setTimeout(() => {
        orderService.confirm(orderId).catch(console.error)
      }, 5000)
    } else if (orderStatus === 'CONFIRMED') {
      timeoutId = setTimeout(() => {
        orderService.assignAgent(orderId).catch(console.error)
      }, 5000)
    } else if (orderStatus === 'AGENT_ASSIGNED') {
      timeoutId = setTimeout(() => {
        orderService.pickup(orderId).catch(console.error)
      }, 5000)
    } else if (orderStatus === 'PICKED_UP') {
      timeoutId = setTimeout(() => {
        orderService.outForDelivery(orderId).catch(console.error)
      }, 5000)
    }

    if (orderStatus === 'OUT_FOR_DELIVERY' && deliveryCoords) {
      // Simulate agent moving from pickup to delivery
      if (!agentLocation && pickupCoords) {
         setAgentLocation(pickupCoords)
      }

      clearInterval(demoIntervalRef.current)
      demoIntervalRef.current = setInterval(() => {
        setAgentLocation(prev => {
          const current = prev || pickupCoords
          if (!current) return current

          const latDiff  = deliveryCoords.latitude  - current.latitude
          const lngDiff  = deliveryCoords.longitude - current.longitude
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
          
          if (distance < 0.0005) {
            clearInterval(demoIntervalRef.current)
            // Trigger deliver API
            orderService.deliver(orderId).catch(console.error)
            return { latitude: deliveryCoords.latitude, longitude: deliveryCoords.longitude }
          }
          
          return {
            latitude:    current.latitude  + (latDiff  * 0.05),
            longitude:   current.longitude + (lngDiff  * 0.05),
            lastUpdated: new Date(),
          }
        })
      }, 2000)
    }

    return () => {
      clearTimeout(timeoutId)
      clearInterval(demoIntervalRef.current)
    }
  }, [orderId, orderStatus, deliveryCoords, pickupCoords, agentLocation])

  const distanceKm = haversineKm(agentLocation, deliveryCoords)
  const etaMinutes = estimateETA(distanceKm)

  return {
    order,
    agentDetails: agentDetails || (order?.agentName ? { name: order.agentName, phone: order.agentPhone } : null),
    agentLocation,
    orderStatus: orderStatus || order?.status || 'PLACED',
    distanceKm,
    etaMinutes,
    connected,
    isLoading,
    isError,
    refetch,
  }
}
