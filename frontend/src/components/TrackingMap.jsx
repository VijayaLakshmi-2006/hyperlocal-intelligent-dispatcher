import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom Markers
const createCustomIcon = (emoji, bgColor) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 18px;">${emoji}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
})

const storeIcon    = createCustomIcon('🏪', '#3b82f6') // Blue
const customerIcon = createCustomIcon('📍', '#ef4444') // Red
const agentIcon = L.divIcon({
  className: 'agent-div-icon',
  html: `<div class="agent-marker-pulse" style="background-color: #10b981; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; font-size: 20px; z-index: 1000;">🛵</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
})

// Route polyline — replaces leaflet-routing-machine OSRM dependency entirely.
// Draws a dashed line from start → end with no external server calls.
function RoutePolyline({ pickup, delivery, agent }) {
  const agentHasLocation = agent?.latitude && agent?.longitude
  const startPoint = agentHasLocation ? [agent.latitude, agent.longitude] : null
  const pickupPoint  = pickup?.latitude  && pickup?.longitude  ? [pickup.latitude,  pickup.longitude]  : null
  const deliveryPoint = delivery?.latitude && delivery?.longitude ? [delivery.latitude, delivery.longitude] : null

  if (!deliveryPoint) return null

  // Build path segments
  const segments = []
  if (startPoint && pickupPoint)   segments.push([startPoint,   pickupPoint])   // agent → pickup
  if (pickupPoint && deliveryPoint) segments.push([pickupPoint,  deliveryPoint]) // pickup → delivery
  if (!pickupPoint && startPoint)   segments.push([startPoint,  deliveryPoint])  // agent → delivery (if picked up)

  if (segments.length === 0) {
    // Fallback: just draw pickup → delivery line
    if (pickupPoint) segments.push([pickupPoint, deliveryPoint])
  }

  return (
    <>
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          positions={seg}
          pathOptions={{
            color: i === 0 ? '#10b981' : '#2563EB',  // green for agent→pickup, blue for pickup→delivery
            weight: 5,
            opacity: 0.75,
            dashArray: i === 0 ? '8, 8' : null,      // dashed for agent leg
          }}
        />
      ))}
    </>
  )
}

// Map Bounds Updater
function MapBounds({ pickup, delivery, agent }) {
  const map = useMap()

  useEffect(() => {
    const points = []
    if (pickup?.latitude)   points.push([pickup.latitude,   pickup.longitude])
    if (delivery?.latitude) points.push([delivery.latitude, delivery.longitude])
    if (agent?.latitude)    points.push([agent.latitude,    agent.longitude])

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  }, [map, pickup, delivery, agent])

  return null
}

export default function TrackingMap({ pickup, delivery, agent }) {
  const defaultCenter = [17.4483, 78.3915]
  const center = pickup?.latitude ? [pickup.latitude, pickup.longitude] : defaultCenter

  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-full rounded-2xl overflow-hidden shadow-card relative border border-gray-100 z-0">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Controls */}
        <div className="leaflet-top leaflet-right mt-4 mr-4">
          <div className="leaflet-control leaflet-bar">
            <button
              className="w-10 h-10 bg-white hover:bg-gray-50 flex items-center justify-center text-primary-600 font-bold border-b border-gray-200"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const map = e.target.closest('.leaflet-container')._leaflet_map
                map.zoomIn()
              }}
            >+</button>
            <button
              className="w-10 h-10 bg-white hover:bg-gray-50 flex items-center justify-center text-primary-600 font-bold"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const map = e.target.closest('.leaflet-container')._leaflet_map
                map.zoomOut()
              }}
            >-</button>
          </div>
        </div>

        {pickup?.latitude && (
          <Marker position={[pickup.latitude, pickup.longitude]} icon={storeIcon}>
            <Popup>
              <div className="font-semibold text-gray-900">Pickup Location</div>
              <div className="text-sm text-gray-500 mt-1">{pickup.address}</div>
            </Popup>
          </Marker>
        )}

        {delivery?.latitude && (
          <Marker position={[delivery.latitude, delivery.longitude]} icon={customerIcon}>
            <Popup>
              <div className="font-semibold text-gray-900">Delivery Location</div>
              <div className="text-sm text-gray-500 mt-1">{delivery.address}</div>
            </Popup>
          </Marker>
        )}

        {agent?.latitude && (
          <Marker position={[agent.latitude, agent.longitude]} icon={agentIcon}>
            <Popup>
              <div className="font-semibold text-gray-900">Delivery Agent</div>
              <div className="text-sm text-green-600 font-medium mt-1">● Online &amp; Moving</div>
            </Popup>
          </Marker>
        )}

        {/* Self-contained polyline route — no OSRM or external routing servers */}
        <RoutePolyline pickup={pickup} delivery={delivery} agent={agent} />
        <MapBounds pickup={pickup} delivery={delivery} agent={agent} />
      </MapContainer>
    </div>
  )
}
