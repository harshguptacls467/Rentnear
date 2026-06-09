import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Shield, Star, Info, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config/api';
import { MOCK_PRODUCTS, MOCK_USER } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState('');

  // UI States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Checkout States
  const [checkoutStage, setCheckoutStage] = useState('dates'); // 'dates' | 'summary' | 'success'
  const [message, setMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingId, setBookingId] = useState(null);

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Validate Dates
    if (new Date(startDate) > new Date(endDate)) {
      setBookingError('Return date cannot be before Pick up date.');
      return;
    }

    // Optimistic UI checks before hitting the server
    if (user.kyc_status !== 'verified') {
      // Assuming you want to enforce this:
      // setBookingError('You must verify your identity before booking.');
      // return;
    }
    setCheckoutStage('summary');
  };

  const handleSubmitBooking = async () => {
    if (bookingLoading) return; // Prevent double clicks
    
    try {
      setBookingLoading(true);
      setBookingError('');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to book');
      }

      // Optimistic UI vs Waiting for Server Confirmation:
      // In "My Listings" we used Optimistic UI (toggling UI instantly, then syncing to server) because the stakes are low.
      // For Bookings, money and calendar blocks are involved. We MUST wait for Server Confirmation to ensure no double-booking 
      // (e.g. someone else booked the exact same dates 1 second ago).

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalCost,
          message: message // Passing message to backend
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit booking request');
      }

      setBookingId(data.id);
      setCheckoutStage('success');

    } catch (err) {
      setBookingError(err.message);
      setCheckoutStage('dates'); // Kick them back to adjust dates if conflict
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError || !productData) throw productError || new Error('not found');
        setProduct(productData);

        const [ownerResponse] = await Promise.all([
          supabase.from('users').select('name, avatar_url, created_at, rating_average, rating_count').eq('id', productData.owner_id).single(),
        ]);

        if (!ownerResponse.error) setOwner(ownerResponse.data);

      } catch (err) {
        // Fallback: find product in mock data by id
        const mockProduct = MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];
        setProduct({
          ...mockProduct,
          deposit_amount: mockProduct.price_per_day * 2,
          condition: 'Excellent',
        });
        setOwner({
          name: MOCK_USER.name,
          avatar_url: MOCK_USER.avatar_url,
          created_at: MOCK_USER.created_at,
        });
        console.warn('Using mock product data:', err?.message);
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
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
              {/* Main Image */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 relative">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={images[activeImageIndex]} 
                    alt={product.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
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
            </motion.div>

            {/* Description & Rules */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
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
            </motion.div>

          </div>

          {/* Right Column: Booking Widget & Owner Info */}
          <div className="w-full lg:w-[420px] space-y-6">
            
            {/* Booking Card */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-primary/5 border border-white sticky top-24 transition-all duration-300">
              
              {checkoutStage === 'success' ? (
                // SUCCESS STATE
                <div className="text-center py-8 animate-fade-in-up">
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Request Sent!</h2>
                  <p className="text-gray-500 mb-6">Your booking ID is <span className="font-mono font-bold text-gray-900">#{bookingId?.split('-')[0]}</span>.</p>
                  <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    The owner has been notified and will respond within 24 hours. You can track this in your dashboard.
                  </p>
                  <Button className="w-full mt-6" onClick={() => navigate('/bookings')}>View My Bookings</Button>
                </div>
              ) : (
                <>
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

                  {bookingError && (
                    <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start animate-fade-in-up">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">{bookingError}</p>
                    </div>
                  )}

                  {checkoutStage === 'dates' && (
                    // DATES STATE
                    <div className="animate-fade-in-up">
                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pick up</label>
                            <input 
                              type="date" 
                              value={startDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                setStartDate(e.target.value);
                                setBookingError('');
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Return</label>
                            <input 
                              type="date" 
                              value={endDate}
                              min={startDate || new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                setEndDate(e.target.value);
                                setBookingError('');
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Receipt */}
                      {startDate && endDate && (
                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
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
                        onClick={handleProceedToCheckout}
                      >
                        {isOwner ? "You own this item" : !product.is_available ? "Currently Rented" : "Book Now"}
                      </Button>
                    </div>
                  )}

                  {checkoutStage === 'summary' && (
                    // SUMMARY & MESSAGE STATE
                    <div className="animate-fade-in-up">
                      
                      <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Booking Summary</h3>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Dates</span>
                          <span className="font-medium text-gray-900">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                          <span>Duration</span>
                          <span className="font-medium text-gray-900">{days} days</span>
                        </div>
                        <div className="flex justify-between items-center font-black text-lg text-gray-900">
                          <span>Total Amount</span>
                          <span>${totalCost + Number(product.deposit_amount)}</span>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Message to Owner (Optional)</label>
                        <textarea 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Introduce yourself and share why you're renting..."
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24"
                        ></textarea>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="secondary" 
                          onClick={() => setCheckoutStage('dates')}
                          disabled={bookingLoading}
                          className="flex-shrink-0"
                        >
                          Back
                        </Button>
                        <Button 
                          className="w-full shadow-lg"
                          disabled={bookingLoading}
                          onClick={handleSubmitBooking}
                        >
                          {bookingLoading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Owner Card */}
            {owner && checkoutStage !== 'success' && (
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
                    <span className="flex items-center text-yellow-500 font-bold"><Star size={14} className="mr-1 fill-current" /> {owner.rating_average > 0 ? owner.rating_average : 'New'}</span>
                    <span className="text-xs text-gray-400">({owner.rating_count || 0} reviews)</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>Joined {new Date(owner.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ProductDetail;
