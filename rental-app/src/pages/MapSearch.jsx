import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { LocateFixed, Map as MapIcon, Loader2, MessageCircle, Phone } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Teal Icon for Products
const productIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-teal.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically re-center the map
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

// Haversine formula to calculate distance between two lat/lng points in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

const MapSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [userLocation, setUserLocation] = useState(null); // [lat, lng]
  const [locationError, setLocationError] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [radius, setRadius] = useState(5); // Default 5km

  // 1. Get User Location
  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to New Delhi if they block location
          setUserLocation([28.6139, 77.2090]);
          setLocationError(true);
        }
      );
    } else {
      setUserLocation([28.6139, 77.2090]);
    }
  }, []);

  // Run once on mount
  useEffect(() => {
    Promise.resolve().then(() => {
      locateUser();
    });
  }, [locateUser]);

  // 2. Fetch Products with owner phone for WhatsApp
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, price_per_day, category, images, latitude, longitude, owner_id, owner:users!products_owner_id_fkey(name, phone)')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to fetch map products:", err);
      }
    };
    fetchProducts();
  }, []);

  // 3. Filter by Radius whenever location, radius, or products change
  useEffect(() => {
    if (!userLocation || products.length === 0) return;

    const filtered = products.filter(product => {
      const distance = calculateDistance(
        userLocation[0], userLocation[1], 
        product.latitude, product.longitude
      );
      return distance <= radius;
    });

    Promise.resolve().then(() => {
      setFilteredProducts(filtered);
    });
  }, [userLocation, radius, products]);

  // WhatsApp handler
  const handleWhatsApp = (product) => {
    const phone = product.owner?.phone;
    if (!phone) { alert('This owner has no phone number linked for WhatsApp.'); return; }
    const clean = phone.replace(/\D/g, '');
    const msg = `Hi! I'm interested in renting "${product.title}" on RentNear. Is it available?`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // In-app chat handler - navigate to product detail which handles chat creation
  const handleInAppChat = (product) => {
    if (!user) { navigate('/login'); return; }
    navigate(`/products/${product.id}`);
  };

  if (!userLocation) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Finding your location...</h2>
        <p className="text-gray-500 text-sm mt-2">Please allow location access if prompted.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative">
      
      {/* UI Overlay Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full shadow-lg border border-gray-100 flex items-center px-2 py-2 gap-2 w-[90%] max-w-md">
        <div className="bg-primary/10 text-primary p-2 rounded-full">
          <MapIcon size={20} />
        </div>
        <div className="flex-1 px-2">
          <select 
            className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            <option value={1}>Within 1 km</option>
            <option value={3}>Within 3 km</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={50}>Within 50 km</option>
            <option value={99999}>Show Everywhere</option>
          </select>
        </div>
        <button 
          onClick={locateUser}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors flex items-center justify-center"
          title="Recenter on me"
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {locationError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold text-center w-[90%] max-w-sm">
          Location access denied. Displaying default map.
        </div>
      )}

      {/* Map Container */}
      <MapContainer 
        center={userLocation} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap center={userLocation} />

        {/* User Location Indicator */}
        <Circle 
          center={userLocation} 
          radius={200} // fixed visual size
          pathOptions={{ color: '#0D9E75', fillColor: '#0D9E75', fillOpacity: 0.2 }} 
        />
        <Circle 
          center={userLocation} 
          radius={50} // tight center dot
          pathOptions={{ color: 'white', fillColor: '#0D9E75', fillOpacity: 1, weight: 2 }} 
        />

        {/* Product Radius Indicator */}
        {radius < 99999 && (
          <Circle 
            center={userLocation} 
            radius={radius * 1000} // convert km to meters for leaflet
            pathOptions={{ color: '#6B7280', weight: 1, fillOpacity: 0.05, dashArray: '5, 10' }} 
          />
        )}

        {/* Product Pins */}
        {filteredProducts.map(product => (
          <Marker 
            key={product.id} 
            position={[product.latitude, product.longitude]}
            icon={productIcon}
          >
            <Popup className="custom-popup">
              <div className="w-52">
                <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] font-bold text-primary uppercase mb-1">{product.category}</p>
                <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.title}</h3>
                {product.owner?.name && (
                  <p className="text-xs text-gray-500 mb-2">by {product.owner.name}</p>
                )}
                <p className="text-lg font-black text-gray-900 mb-3">₹{product.price_per_day}<span className="text-xs text-gray-500 font-medium">/day</span></p>
                <button 
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors mb-2"
                >
                  View Details
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleInAppChat(product)}
                    className="flex-1 flex items-center justify-center gap-1 bg-primary/10 text-primary py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    <MessageCircle size={13} />
                    Chat
                  </button>
                  <button 
                    onClick={() => handleWhatsApp(product)}
                    className="flex-1 flex items-center justify-center gap-1 bg-[#25D366]/10 text-[#25D366] py-2 rounded-lg text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
                  >
                    <Phone size={13} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapSearch;
