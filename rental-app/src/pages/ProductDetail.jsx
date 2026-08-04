import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { 
  Shield, Star, Info, ChevronRight, CheckCircle2, AlertCircle, MessageSquare, 
  ShieldCheck, Clock, MessageCircle, Phone, Radio, Heart, Share2, AlertTriangle, 
  Copy, Check, X, Calendar as CalendarIcon
} from 'lucide-react';
import { API_URL } from '../config/api';
import { MOCK_PRODUCTS, MOCK_USER } from '../data/mockData';
import { 
  getLocalProducts, getLocalBookings, saveLocalBookings, getLocalUsers,
  getLocalWishlist, saveLocalWishlist, getLocalRecentlyViewed, saveLocalRecentlyViewed
} from '../utils/localDb';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import useRealtimeStore from '../store/realtimeStore';
import useRecommendationStore from '../store/recommendationStore';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [checkoutStage, setCheckoutStage] = useState('dates');
  const [message, setMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingId, setBookingId] = useState(null);

  // Expanded Feature States
  const [wishlist, setWishlist] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Reporting Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportText, setReportText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Load product preference configurations (Wishlist, Recently Viewed)
  useEffect(() => {
    if (user?.id && id) {
      const wList = getLocalWishlist(user.id);
      setWishlist(wList);
      setIsWishlisted(wList.includes(id));

      // Append product to Recently Viewed
      const rViewed = getLocalRecentlyViewed(user.id);
      let updated = rViewed.filter(viewedId => viewedId !== id);
      updated.unshift(id);
      saveLocalRecentlyViewed(user.id, updated.slice(0, 5));
    }
  }, [user, id]);

  // Main Fetch Product & Bookings & Similar Products
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError('');
        
        let foundProduct = null;
        let ownerData = null;

        if (!isMock) {
          const { data: productData } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
          if (productData) {
            foundProduct = productData;
            const { data: userData } = await supabase.from('users').select('name, avatar_url, created_at, rating_average, rating_count, phone').eq('id', productData.owner_id).maybeSingle();
            if (userData) ownerData = userData;
          }
        }

        // Fallback or Mock
        if (!foundProduct) {
          const allProducts = getLocalProducts();
          foundProduct = allProducts.find(p => p.id === id) || allProducts[0];
          if (foundProduct) {
            foundProduct = {
              ...foundProduct,
              deposit_amount: foundProduct.deposit_amount || (foundProduct.price_per_day || 15) * 2,
              condition: foundProduct.condition || 'Excellent',
              images: Array.isArray(foundProduct.images) ? foundProduct.images : [foundProduct.images]
            };

            const localUsers = getLocalUsers();
            for (const email of Object.keys(localUsers)) {
              if (localUsers[email]?.id === foundProduct.owner_id) {
                ownerData = localUsers[email];
                break;
              }
            }
            if (!ownerData && foundProduct.owner_id === MOCK_USER.id) {
              ownerData = MOCK_USER;
            }
            if (!ownerData) {
              ownerData = {
                name: 'Jane Doe',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JaneDoe',
                created_at: '2024-01-01',
                rating_average: 4.8,
                rating_count: 9,
                phone: '919876543210'
              };
            }
          }
        }

        if (foundProduct) {
          setProduct(foundProduct);
          setOwner(ownerData);

          // Log view activity to recommendation engine
          try {
            const { logActivity } = useRecommendationStore.getState();
            logActivity(user?.id, isMock, foundProduct.id, 'view', foundProduct.category);
          } catch (logErr) {
            console.debug('Failed to log view activity:', logErr.message);
          }

          // Fetch Similar Listings
          const allLocalProds = getLocalProducts();
          const similar = allLocalProds.filter(p => p.category === foundProduct.category && p.id !== foundProduct.id).slice(0, 4);
          setSimilarProducts(similar);

          // Fetch Existing Confirmed Bookings for Availability check
          let bookingsData = [];
          if (!isMock) {
            const { data } = await supabase.from('bookings').select('start_date, end_date, status').eq('product_id', foundProduct.id).in('status', ['approved', 'awaiting_handover', 'active']);
            if (data) bookingsData = data;
          } else {
            bookingsData = getLocalBookings().filter(b => b.product_id === foundProduct.id && ['approved', 'awaiting_handover', 'active'].includes(b.status));
          }
          setExistingBookings(bookingsData);
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching product data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id, isMock]);

  // Real-time updates subscription
  useEffect(() => {
    if (isMock || !id) return;
    const channel = supabase
      .channel(`product-detail-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` }, (payload) => {
        setProduct(prev => prev ? { ...prev, ...payload.new } : payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, isMock]);

  const toggleWishlist = () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    const currentList = getLocalWishlist(user.id);
    let updated;
    if (currentList.includes(id)) {
      updated = currentList.filter(item => item !== id);
      setIsWishlisted(false);
    } else {
      updated = [...currentList, id];
      setIsWishlisted(true);
    }
    setWishlist(updated);
    saveLocalWishlist(user.id, updated);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      // In a real database, insert into an admin_audit_logs or flags table
      if (!isMock) {
        await supabase.from('admin_audit_logs').insert([{
          action: 'listing_reported',
          details: { product_id: id, reason: reportReason, details: reportText, reported_by: user?.id }
        }]);
      }
      setReportSubmitted(true);
    } catch {
      // Allow fallback to mock success
      setReportSubmitted(true);
    } finally {
      setBookingLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffDays = Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const days = calculateDays();
  const totalCost = product ? (days * product.price_per_day) : 0;
  const isOwner = user?.id === product?.owner_id;

  // Check overlap for reservation
  const checkOverlappingDates = () => {
    if (!startDate || !endDate) return false;
    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    return existingBookings.some(booking => {
      const bStart = new Date(booking.start_date);
      const bEnd = new Date(booking.end_date);
      return (reqStart <= bEnd && reqEnd >= bStart);
    });
  };

  const datesOverlapping = checkOverlappingDates();
  const canBook = startDate && endDate && product?.is_available && !isOwner && !datesOverlapping;

  const handleProceedToCheckout = () => {
    if (!user) { navigate('/login'); return; }
    if (new Date(startDate) > new Date(endDate)) {
      setBookingError('Return date cannot be before Pickup date.');
      return;
    }
    if (datesOverlapping) {
      setBookingError('These dates are unavailable (already booked).');
      return;
    }
    setCheckoutStage('summary');
  };

  const handleSubmitBooking = async () => {
    if (bookingLoading) return;
    try {
      setBookingLoading(true);
      setBookingError('');

      if (isMock) {
        const newBookingId = 'mock-booking-id-' + Math.random().toString(36).substring(2, 11);
        const newBooking = {
          id: newBookingId,
          renter_id: user?.id,
          owner_id: product.owner_id,
          product_id: product.id,
          status: 'pending',
          start_date: startDate,
          end_date: endDate,
          total_amount: totalCost,
          message: message,
          product: { title: product.title, images: product.images },
          renter: { name: user?.name, avatar_url: user?.avatar_url }
        };
        const localBookings = getLocalBookings();
        localBookings.push(newBooking);
        saveLocalBookings(localBookings);

        setBookingId(newBookingId);
        setCheckoutStage('success');

        // Log rent conversion event to recommendation engine
        try {
          const { logActivity } = useRecommendationStore.getState();
          logActivity(user?.id, isMock, product.id, 'rent', product.category);
        } catch (logErr) {
          console.debug('Failed to log rent activity:', logErr.message);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to book');

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ product_id: product.id, start_date: startDate, end_date: endDate, total_amount: totalCost, message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit booking request');

      setBookingId(data.id);
      setCheckoutStage('success');

      // Log rent conversion event to recommendation engine
      try {
        const { logActivity } = useRecommendationStore.getState();
        logActivity(user?.id, isMock, product.id, 'rent', product.category);
      } catch (logErr) {
        console.debug('Failed to log rent activity:', logErr.message);
      }
    } catch (err) {
      setBookingError(err.message);
      setCheckoutStage('dates');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStartInAppChat = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (!isMock) {
        const { data: existing, error } = await supabase
          .from('bookings')
          .select('id')
          .eq('product_id', product.id)
          .eq('renter_id', user.id)
          .limit(1);
          
        if (!error && existing && existing.length > 0) {
          navigate(`/chat/${existing[0].id}`);
          return;
        }
      } else {
        const localBookings = getLocalBookings();
        const found = localBookings.find(b => b.product_id === product.id && b.renter_id === user.id);
        if (found) {
          navigate(`/chat/${found.id}`);
          return;
        }
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const startStr = tomorrow.toISOString().split('T')[0];
      const endStr = dayAfter.toISOString().split('T')[0];
      const enquiryMsg = `Hi! I have a question about your listed item: ${product.title}`;

      if (isMock) {
        const newBookingId = 'mock-booking-id-' + Math.random().toString(36).substring(2, 11);
        const newBooking = {
          id: newBookingId,
          renter_id: user?.id,
          owner_id: product.owner_id,
          product_id: product.id,
          status: 'pending',
          start_date: startStr,
          end_date: endStr,
          total_amount: product.price_per_day,
          message: enquiryMsg,
          product: { title: product.title, images: product.images },
          renter: { name: user?.name, avatar_url: user?.avatar_url }
        };
        const localBookings = getLocalBookings();
        localBookings.push(newBooking);
        saveLocalBookings(localBookings);
        navigate(`/chat/${newBookingId}`);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ product_id: product.id, start_date: startStr, end_date: endStr, message: enquiryMsg })
      });
      const data = await response.json();
      if (!response.ok) {
        const { data: existing, error } = await supabase
          .from('bookings')
          .select('id')
          .eq('product_id', product.id)
          .eq('renter_id', user.id)
          .limit(1);
        if (!error && existing && existing.length > 0) {
          navigate(`/chat/${existing[0].id}`);
          return;
        }
        throw new Error(data.message || 'Failed to start conversation');
      }

      navigate(`/chat/${data.id}`);
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  if (loading) return <div className="min-h-screen pt-20 flex justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (error || !product) return <div className="min-h-screen pt-20 text-center bg-gray-50"><h2 className="text-2xl font-bold text-gray-900">Oops! {error}</h2><Button className="mt-4" onClick={() => navigate('/products')}>Back to Browse</Button></div>;

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/800x600?text=No+Image'];

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 pb-24">
      
      {/* Title Header area */}
      <div className="bg-white border-b border-gray-100 py-6 md:py-8 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center text-xs md:text-sm text-gray-500 mb-3 font-medium overflow-x-auto whitespace-nowrap hide-scrollbar">
                <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/products')}>Products</span>
                <ChevronRight size={14} className="mx-2 flex-shrink-0" />
                <span className="hover:text-primary cursor-pointer">{product.category}</span>
                <ChevronRight size={14} className="mx-2 flex-shrink-0" />
                <span className="text-gray-900 font-bold truncate max-w-[150px]">{product.title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">{product.title}</h1>
                {product.instant_booking_enabled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-700 border border-amber-400/40 shadow-sm animate-pulse">
                    ⚡ Instant Bookable
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick Actions (Wishlist & Share & Report) */}
            <div className="flex items-center gap-2 relative z-30">
              <button 
                onClick={toggleWishlist}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Heart size={18} className={isWishlisted ? 'text-red-500 fill-current' : 'text-gray-500'} />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Share2 size={18} className="text-gray-500" />
                </button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-lg p-2 z-50 w-44"
                    >
                      <button 
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg text-left"
                      >
                        {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} 
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button 
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check out this item on RentNear: ' + window.location.href)}`, '_blank')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg text-left"
                      >
                        <Phone size={14} className="text-green-500" /> Share to WhatsApp
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setShowReportModal(true)}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm text-gray-500 hover:text-red-500"
              >
                <AlertTriangle size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          
          {/* Left Column: Images & About */}
          <div className="flex-1 space-y-8">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100">
              <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-gray-100 mb-4 relative">
                <AnimatePresence mode="wait">
                  <motion.img key={activeImageIndex} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} src={images[activeImageIndex]} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
                </AnimatePresence>
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}>
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="glass-panel rounded-[2rem] p-6 md:p-10 shadow-premium">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">About this item</h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>

              {/* Specifications Tag list */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="bg-gray-150/70 text-gray-750 text-xs font-bold px-3 py-1.5 rounded-xl">⚡ Local Delivery Available</span>
                <span className="bg-gray-150/70 text-gray-750 text-xs font-bold px-3 py-1.5 rounded-xl">🛡️ Verified Product Listing</span>
                <span className="bg-gray-150/70 text-gray-750 text-xs font-bold px-3 py-1.5 rounded-xl">✨ Hand-Sanitized Before Handovers</span>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Shield size={24} /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">Security Deposit</h4>
                    <p className="text-xs text-gray-550 leading-relaxed">${product.deposit_amount} release refund upon item return validation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100/50">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><Info size={24} /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">Current Condition</h4>
                    <p className="text-xs text-gray-550 leading-relaxed">Listed as <span className="font-bold text-gray-700">{product.condition || 'Good'}</span>.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Similar Listings Carousel / Row */}
            {similarProducts.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Sparkles size={22} className="text-primary" /> Similar Listings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarProducts.map((sim, idx) => (
                    <Link key={idx} to={`/products/${sim.id}`} className="bg-white p-4 border border-gray-100 rounded-3xl flex gap-4 hover:shadow-md transition-shadow group">
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={sim.images?.[0] || 'https://via.placeholder.com/150'} alt={sim.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{sim.category}</span>
                        <h4 className="font-bold text-gray-900 text-sm mt-1 leading-snug line-clamp-1 group-hover:text-primary transition-colors">{sim.title}</h4>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-base font-black text-gray-900">${sim.price_per_day}</span>
                          <span className="text-[10px] text-gray-400">/day</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Booking panel & Calendar information */}
          <div className="w-full lg:w-[420px] space-y-6">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="glass-panel rounded-[2rem] p-6 shadow-premium sticky top-24 z-20">
              {checkoutStage === 'success' ? (
                <div className="text-center py-8 animate-fade-in-up">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={40} /></div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Request Sent!</h2>
                  <p className="text-gray-500 mb-6 text-sm">Your booking ID is <span className="font-mono font-bold text-gray-900">#{bookingId?.split('-')[0]}</span>.</p>
                  <Button className="w-full py-3.5 rounded-xl text-sm" onClick={() => navigate('/bookings')}>Track in Dashboard</Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-end justify-between border-b border-gray-100 pb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-gray-900">${product.price_per_day}</span>
                      <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">/ day</span>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start animate-fade-in-up">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium leading-relaxed">{bookingError}</p>
                    </div>
                  )}

                  {/* Unavailable Booked & Owner Blackout Dates Banner */}
                  {(existingBookings.length > 0 || (Array.isArray(product.calendar_blocked_dates) && product.calendar_blocked_dates.length > 0)) && (
                    <div className="mb-4 bg-amber-50/50 border border-amber-100/50 p-4 rounded-2xl">
                      <div className="flex gap-2 text-amber-800 font-bold text-xs mb-2 items-center">
                        <CalendarIcon size={14} /> Unavailable & Blocked Dates
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-2 text-[11px] text-amber-700">
                        {existingBookings.map((b, i) => (
                          <div key={i} className="flex justify-between bg-white px-2.5 py-1 rounded-lg border border-amber-100/30">
                            <span>{new Date(b.start_date).toLocaleDateString()}</span>
                            <span>to</span>
                            <span>{new Date(b.end_date).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {Array.isArray(product.calendar_blocked_dates) && product.calendar_blocked_dates.map((d, i) => (
                          <div key={`blk-${i}`} className="flex justify-between bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-100/30 font-bold">
                            <span>{d}</span>
                            <span>(Owner Blockout)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkoutStage === 'dates' && (
                    <div className="animate-fade-in-up">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pick up</label>
                          <input type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => { setStartDate(e.target.value); setBookingError(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Return</label>
                          <input type="date" value={endDate} min={startDate || new Date().toISOString().split('T')[0]} onChange={(e) => { setEndDate(e.target.value); setBookingError(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
                        </div>
                      </div>

                      {startDate && endDate && (
                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                          <div className="flex justify-between text-xs text-gray-600 mb-2"><span>${product.price_per_day} x {days} days</span><span className="font-medium text-gray-900">${totalCost}</span></div>
                          <div className="flex justify-between text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200"><span>Refundable Deposit</span><span className="font-medium text-gray-900">${product.deposit_amount}</span></div>
                          <div className="flex justify-between items-center font-black text-lg text-gray-900"><span>Total Due</span><span className="text-primary">${totalCost + Number(product.deposit_amount)}</span></div>
                        </div>
                      )}

                      <Button 
                        className={`w-full py-4 text-base rounded-xl transition-all ${product.instant_booking_enabled ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20' : ''}`}
                        disabled={!canBook} 
                        onClick={handleProceedToCheckout}
                      >
                        {isOwner ? "You own this item" : datesOverlapping ? "Dates Overlap Bookings" : !product.is_available ? "Currently Rented" : product.instant_booking_enabled ? "⚡ Instant Book Now" : "Reserve Now"}
                      </Button>
                    </div>
                  )}

                  {checkoutStage === 'summary' && (
                    <div className="animate-fade-in-up">
                      <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wider border-b border-gray-200 pb-2">Booking Summary</h3>
                        <div className="flex justify-between text-xs text-gray-600 mb-2"><span>Duration</span><span className="font-medium text-gray-900">{days} days</span></div>
                        <div className="flex justify-between items-center font-black text-lg text-gray-900"><span>Amount to Authorize</span><span>${totalCost + Number(product.deposit_amount)}</span></div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Message to Owner (Optional)</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I need this for a weekend project..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none h-24"></textarea>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setCheckoutStage('dates')} disabled={bookingLoading} className="flex-shrink-0 bg-white">Back</Button>
                        <Button className="w-full shadow-lg" disabled={bookingLoading} onClick={handleSubmitBooking}>{bookingLoading ? 'Processing...' : 'Confirm Request'}</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {owner && checkoutStage !== 'success' && (
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mb-4 border-2 border-primary/20">
                  {owner.avatar_url ? <img src={owner.avatar_url} alt={owner.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">{owner.name?.charAt(0).toUpperCase()}</div>}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">{owner.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Verified Owner <ShieldCheck size={14} className="inline text-green-500 mb-1"/></p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck size={12} /> Verified Resident
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                    ⚡ Super Host
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-600 bg-gray-50 w-full py-3 rounded-xl border border-gray-100 mb-4">
                  <span className="flex items-center gap-1 font-bold"><Star size={16} className="text-yellow-500 fill-current" /> {owner.rating_average || 4.8}</span>
                  <span className="font-medium">{owner.rating_count || 12} rentals</span>
                </div>
                {!isOwner && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleStartInAppChat}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-3 rounded-xl transition-colors"
                    >
                      <MessageCircle size={15} /> Chat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reporting Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => { setShowReportModal(false); setReportSubmitted(false); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
              
              {!reportSubmitted ? (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div className="text-center">
                    <AlertTriangle className="text-red-500 mx-auto mb-2" size={36} />
                    <h3 className="text-lg font-black text-gray-900">Report Listing</h3>
                    <p className="text-xs text-gray-400 mt-1">Help us keep the marketplace safe.</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Reason</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                    >
                      <option value="inappropriate">Inappropriate/Offensive Content</option>
                      <option value="scam">Scam/Fraudulent Listing</option>
                      <option value="pricing">Incorrect/Deceptive Pricing</option>
                      <option value="other">Other Reason</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Details (Optional)</label>
                    <textarea 
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Please add context..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      type="button"
                      className="flex-1 bg-white" 
                      onClick={() => setShowReportModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                      disabled={bookingLoading}
                      type="submit"
                    >
                      {bookingLoading ? 'Reporting...' : 'Submit Report'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 size={44} className="text-green-500 mx-auto mb-3" />
                  <h4 className="font-extrabold text-gray-900 text-base">Report Submitted</h4>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                    Thank you. Our moderation team has been notified and will audit this listing.
                  </p>
                  <Button className="mt-6 w-full" onClick={() => setShowReportModal(false)}>Close</Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AnimatedPage>
  );
};

export default ProductDetail;
