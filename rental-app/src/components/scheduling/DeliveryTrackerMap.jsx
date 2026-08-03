import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons issues in build environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DeliveryTrackerMap = ({ routing }) => {
  if (!routing) return null;

  const { distance, etaMinutes, startCoordinates, endCoordinates } = routing;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
      {/* Route Info Badge */}
      <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
        <div>
          <div className="text-navy font-black text-sm uppercase tracking-wide">Live Route Details</div>
          <div className="text-xs text-gray-500 mt-0.5">Calculated routing between pickup location and destination.</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-primary">{distance} km</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ETA ~{etaMinutes} mins</div>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200 z-10 relative">
        <MapContainer center={startCoordinates} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={startCoordinates}>
            <Popup><strong>Pickup Point (Owner)</strong></Popup>
          </Marker>
          <Marker position={endCoordinates} icon={deliveryIcon}>
            <Popup><strong>Delivery Destination (Renter)</strong></Popup>
          </Marker>
          <Polyline positions={[startCoordinates, endCoordinates]} color="#4f46e5" dashArray="5, 10" />
        </MapContainer>
      </div>
    </div>
  );
};

export default DeliveryTrackerMap;
