import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Calendar, MapPin, Shield, Star, Info, ChevronRight } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [owner, setOwner] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);

        // 1. Fetch the product first (we need its owner_id and category)
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // 2. Fetch the Owner info AND Similar Products at the exact same time!
        // This is where Promise.all is extremely powerful.
        const [ownerResponse, similarResponse] = await Promise.all([
          // Promise A: Get the owner
          supabase
            .from('users')
            .select('name, avatar_url, created_at')
            .eq('id', productData.owner_id)
            .single(),
          
          // Promise B: Get other products in the same category
          supabase
            .from('products')
            .select('id, title, images, price_per_day')
            .eq('category', productData.category)
            .neq('id', id) // Exclude current product
            .limit(3)
        ]);

        if (ownerResponse.error) throw ownerResponse.error;
        
        setOwner(ownerResponse.data);
        if (!similarResponse.error) setSimilarProducts(similarResponse.data);

      } catch (err) {
        setError('Failed to load product details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // Calculate booking costs
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // Minimum 1 day
  };

  const days = calculateDays();
  const totalCost = product ? (days * product.price_per_day) : 0;
  
  // Logic checks
  const isOwner = user?.id === product?.owner_id;
  const canBook = startDate && endDate && product?.is_available && !isOwner;

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-20 text-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Oops! {error}</h2>
        <Button className="mt-4" onClick={() => navigate('/products')}>Back to Browse</Button>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/800x600?text=No+Image'];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6 font-medium">
          <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/products')}>Products</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="hover:text-primary cursor-pointer">{product.category}</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-gray-900 truncate max-w-xs">{product.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column: Images & Details */}
          <div className="flex-1 space-y-8">
            
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
              {/* Main Image */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4">
                <img 
                  src={images[activeImageIndex]} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Rules */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this item</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Security Deposit</h4>
                    <p className="text-sm text-gray-500">${product.deposit_amount} will be held during rental.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Condition</h4>
                    <p className="text-sm text-gray-500">{product.condition || 'Good'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Booking Widget & Owner Info */}
          <div className="w-full lg:w-[420px] space-y-6">
            
            {/* Booking Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24">
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {product.category}
                  </span>
                  {!product.is_available && (
                    <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Unavailable
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{product.title}</h1>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-gray-900">${product.price_per_day}</span>
                  <span className="text-gray-500 font-medium mb-1">/ day</span>
                </div>
              </div>

              <hr className="border-gray-100 my-6" />

              {/* Date Picker */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pick up</label>
                    <input 
                      type="date" 
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Return</label>
                    <input 
                      type="date" 
                      value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {startDate && endDate && (
                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 animate-fade-in-up">
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>${product.price_per_day} x {days} days</span>
                    <span>${totalCost}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 mb-4 pb-4 border-b border-gray-200">
                    <span>Refundable Deposit</span>
                    <span>${product.deposit_amount}</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-lg text-gray-900">
                    <span>Total Due Now</span>
                    <span>${totalCost + Number(product.deposit_amount)}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full py-4 text-lg rounded-xl shadow-[0_8px_20px_rgba(13,158,117,0.25)] hover:shadow-[0_8px_25px_rgba(13,158,117,0.4)] hover:-translate-y-1 transition-all"
                disabled={!canBook}
                onClick={() => alert('Booking flow coming soon!')}
              >
                {isOwner ? "You own this item" : !product.is_available ? "Currently Rented" : "Book Now"}
              </Button>
            </div>

            {/* Owner Card */}
            {owner && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 cursor-pointer hover:border-gray-300 transition-colors">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt={owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 text-xl font-bold">
                      {owner.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Listed By</p>
                  <h3 className="text-lg font-extrabold text-gray-900 leading-none mb-2">{owner.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center text-yellow-500 font-bold"><Star size={14} className="mr-1 fill-current" /> 4.9</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>Joined {new Date(owner.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
