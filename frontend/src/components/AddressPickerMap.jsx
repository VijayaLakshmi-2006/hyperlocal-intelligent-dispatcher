import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { config } from '../config';

const pickerIcon = L.divIcon({
  className: 'picker-div-icon',
  html: `<div style="background-color: #ef4444; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px;">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36] // Anchor at bottom to point exactly at the location
});

function MapEventsHandler({ setPosition, onPositionSelect }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onPositionSelect) {
        onPositionSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
  return null;
}

function MapFlyTo({ position }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.flyTo([position.lat, position.lng], 16, { animate: true });
    }
  }, [position, map]);
  return null;
}

export default function AddressPickerMap({ defaultPosition, onPositionSelect }) {
  const [position, setPosition] = useState(null);
  const isInitialMount = useRef(true);

  // Set default position on mount if provided
  useEffect(() => {
    const lat = defaultPosition?.latitude || config.DEFAULT_LOCATION.latitude;
    const lng = defaultPosition?.longitude || config.DEFAULT_LOCATION.longitude;
    
    setPosition(prev => {
      if (prev && prev.lat === lat && prev.lng === lng) return prev;
      return { lat, lng };
    });
  }, [defaultPosition?.latitude, defaultPosition?.longitude]);

  // Callback when position changes is handled directly by MapEventsHandler now

  const mapCenter = position || { lat: config.DEFAULT_LOCATION.latitude, lng: config.DEFAULT_LOCATION.longitude };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 z-0 relative">
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold text-gray-800 shadow-sm border border-gray-200">
        Click on the map to set delivery location
      </div>
      <MapContainer 
        center={[mapCenter.lat, mapCenter.lng]} 
        zoom={14} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler setPosition={setPosition} onPositionSelect={onPositionSelect} />
        <MapFlyTo position={position} />
        {position && (
          <Marker position={position} icon={pickerIcon} />
        )}
      </MapContainer>
    </div>
  );
}
