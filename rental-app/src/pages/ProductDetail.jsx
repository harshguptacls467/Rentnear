import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Shield, Star, Info, ChevronRight, CheckCircle2, AlertCircle, MessageSquare, ShieldCheck, Clock, MessageCircle, Phone } from 'lucide-react';
import { API_URL } from '../config/api';
import { MOCK_PRODUCTS, MOCK_USER } from '../data/mockData';
import { getLocalProducts, getLocalBookings, saveLocalBookings, getLocalUsers } from '../utils/localDb';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

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
  const [error] = useState('');

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [checkoutStage, setCheckoutStage] = useState('dates');
  const [message, setMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingId, setBookingId] = useState(null);

  const handleProceedToCheckout = () => {
    if (!user) { navigate('/login'); return; }
    if (new Date(startDate) > new Date(endDate)) {
      setBookingError('Return date cannot be before Pick up date.');
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
          product: {
            title: product.title,
            images: product.images,
          },
          renter: {
            name: user?.name,
            avatar_url: user?.avatar_url,
          }
        };
        const localBookings = getLocalBookings();
        localBookings.push(newBooking);
        saveLocalBookings(localBookings);

        setBookingId(newBookingId);
        setCheckoutStage('success');
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
    } catch (err) {
      setBookingError(err.message);
      setCheckoutStage('dates');
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        if (isMock) {
          throw new Error('mock');
        }
        const { data: productData, error: productError } = await supabase.from('products').select('*').eq('id', id).single();
        if (productError || !productData) throw productError || new Error('not found');
        setProduct(productData);
        const [ownerResponse] = await Promise.all([
          supabase.from('users').select('name, avatar_url, created_at, rating_average, rating_count, phone').eq('id', productData.owner_id).single(),
        ]);
        if (!ownerResponse.error) setOwner(ownerResponse.data);
      } catch (err) {
        const allProducts = getLocalProducts();
        const foundProduct = allProducts.find(p => p.id === id) || allProducts[0];
        setProduct({ ...foundProduct, deposit_amount: foundProduct.price_per_day * 2, condition: foundProduct.condition || 'Excellent' });
        
        const localUsers = getLocalUsers();
        let ownerData = null;
        for (const email of Object.keys(localUsers)) {
          if (localUsers[email].id === foundProduct.owner_id) {
            ownerData = localUsers[email];
            break;
          }
        }
        if (!ownerData && foundProduct.owner_id === MOCK_USER.id) {
          ownerData = MOCK_USER;
        }

        setOwner(ownerData ? {
          name: ownerData.name,
          avatar_url: ownerData.avatar_url,
          created_at: ownerData.created_at,
          rating_average: ownerData.rating_average || 4.8,
          rating_count: ownerData.rating_count || 12,
          phone: ownerData.phone || '919876543210'
        } : {
          name: 'Jane Doe',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JaneDoe',
          created_at: '2024-01-01',
          rating_average: 4.9,
          rating_count: 5,
          phone: '919876543210'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id, isMock]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffDays = Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const days = calculateDays();
  const totalCost = product ? (days * product.price_per_day) : 0;
  const isOwner = user?.id === product?.owner_id;
  const canBook = startDate && endDate && product?.is_available && !isOwner;

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

  const handleStartWhatsAppChat = () => {
    if (!owner?.phone) {
      alert("This owner does not have a registered phone number for WhatsApp.");
      return;
    }
    const cleanPhone = owner.phone.replace(/\D/g, '');
    const messageText = `Hi ${owner.name}! I am interested in renting your listed item: "${product.title}" on RentNear. Is it available?`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) return <div className="min-h-screen pt-20 flex justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (error || !product) return <div className="min-h-screen pt-20 text-center bg-gray-50"><h2 className="text-2xl font-bold text-gray-900">Oops! {error}</h2><Button className="mt-4" onClick={() => navigate('/products')}>Back to Browse</Button></div>;

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/800x600?text=No+Image'];

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 pb-24">
      
      {/* Title Header full width */}
      <div className="bg-white border-b border-gray-100 py-6 md:py-8 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-xs md:text-sm text-gray-500 mb-4 font-medium overflow-x-auto whitespace-nowrap hide-scrollbar">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/products')}>Products</span>
            <ChevronRight size={14} className="mx-2 flex-shrink-0" />
            <span className="hover:text-primary cursor-pointer">{product.category}</span>
            <ChevronRight size={14} className="mx-2 flex-shrink-0" />
            <span className="text-gray-900 font-bold truncate max-w-[200px] md:max-w-xs">{product.title}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-2">{product.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          
          {/* Left Column: Images & Details */}
          <div className="flex-1 space-y-8 md:space-y-12">
            
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100">
              <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-gray-100 mb-4 relative">
                <AnimatePresence mode="wait">
                  <motion.img key={activeImageIndex} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} src={images[activeImageIndex]} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
                </AnimatePresence>
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}>
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">About this item</h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{product.description || "The owner hasn't provided a detailed description yet."}</p>
              
              <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Shield size={24} /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">Security Deposit</h4>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed">${product.deposit_amount} will be held securely during the rental period and released immediately upon return.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100/50">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><Info size={24} /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">Current Condition</h4>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed">Listed as <span className="font-bold text-gray-700">{product.condition || 'Good'}</span>. Please verify condition with the owner during handover.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dummy Reviews Section */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                <MessageSquare className="text-primary" size={28} /> Renter Reviews
              </h2>
              <div className="space-y-6">
                {[
                  { name: "Jessica R.", text: "The item was exactly as described. The owner was super responsive and handover was smooth. Highly recommend!", rating: 5, time: "2 weeks ago" },
                  { name: "Michael T.", text: "Saved me from buying a brand new one for a single weekend project. Great condition.", rating: 5, time: "1 month ago" }
                ].map((review, idx) => (
                  <div key={idx} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}`} alt="avatar"/></div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                          <div className="flex gap-1 text-yellow-400"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{review.time}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Right Column: Booking Widget & Owner Info */}
          <div className="w-full lg:w-[420px] space-y-6">
            
            {/* Booking Card */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 sticky top-24 transition-all duration-300">
              
              {checkoutStage === 'success' ? (
                <div className="text-center py-8 animate-fade-in-up">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={48} /></div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">Request Sent!</h2>
                  <p className="text-gray-500 mb-6 text-sm">Your booking ID is <span className="font-mono font-bold text-gray-900">#{bookingId?.split('-')[0]}</span>.</p>
                  <p className="text-sm md:text-base text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 leading-relaxed">
                    The owner has been notified and will respond within 24 hours. You can track this in your dashboard.
                  </p>
                  <Button className="w-full py-4 rounded-xl" onClick={() => navigate('/bookings')}>View My Bookings</Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-end justify-between border-b border-gray-100 pb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-gray-900">${product.price_per_day}</span>
                      <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">/ day</span>
                    </div>
                    {!product.is_available && <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Unavailable</span>}
                  </div>

                  {bookingError && (
                    <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start animate-fade-in-up">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium leading-relaxed">{bookingError}</p>
                    </div>
                  )}

                  {checkoutStage === 'dates' && (
                    <div className="animate-fade-in-up">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pick up</label>
                          <input type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => { setStartDate(e.target.value); setBookingError(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Return</label>
                          <input type="date" value={endDate} min={startDate || new Date().toISOString().split('T')[0]} onChange={(e) => { setEndDate(e.target.value); setBookingError(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                        </div>
                      </div>

                      {startDate && endDate && (
                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 animate-fade-in-up">
                          <div className="flex justify-between text-sm text-gray-600 mb-3"><span>${product.price_per_day} x {days} days</span><span className="font-medium text-gray-900">${totalCost}</span></div>
                          <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200"><span>Refundable Deposit</span><span className="font-medium text-gray-900">${product.deposit_amount}</span></div>
                          <div className="flex justify-between items-center font-black text-xl text-gray-900"><span>Total Due</span><span className="text-primary">${totalCost + Number(product.deposit_amount)}</span></div>
                        </div>
                      )}

                      <Button className="w-full py-4 text-lg rounded-xl shadow-[0_8px_20px_rgba(13,158,117,0.25)] hover:shadow-[0_8px_25px_rgba(13,158,117,0.4)] transition-all" disabled={!canBook} onClick={handleProceedToCheckout}>
                        {isOwner ? "You own this item" : !product.is_available ? "Currently Rented" : "Reserve Now"}
                      </Button>
                      <p className="text-center text-xs text-gray-400 mt-4">You won't be charged yet.</p>
                    </div>
                  )}

                  {checkoutStage === 'summary' && (
                    <div className="animate-fade-in-up">
                      <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wider border-b border-gray-200 pb-2">Booking Summary</h3>
                        <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Dates</span><span className="font-medium text-gray-900">{new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</span></div>
                        <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200"><span>Duration</span><span className="font-medium text-gray-900">{days} days</span></div>
                        <div className="flex justify-between items-center font-black text-lg text-gray-900"><span>Amount to Authorize</span><span>${totalCost + Number(product.deposit_amount)}</span></div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Message to Owner (Optional)</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I need this for a weekend project..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24"></textarea>
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
                <h3 className="text-xl font-extrabold text-gray-900 mb-1">{owner.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Verified Owner <ShieldCheck size={14} className="inline text-green-500 mb-1"/></p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600 bg-gray-50 w-full py-3 rounded-xl border border-gray-100 mb-4">
                  <span className="flex items-center gap-1 font-bold"><Star size={16} className="text-yellow-500 fill-current" /> {owner.rating_average || 4.8}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="font-medium">{owner.rating_count || 12} rentals</span>
                </div>
                {!isOwner && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleStartInAppChat}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                      <MessageCircle size={16} />
                      Chat
                    </button>
                    <button
                      onClick={handleStartWhatsAppChat}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                      <Phone size={16} />
                      WhatsApp
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Safety Badges */}
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4 text-sm">RentNear Guarantee</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed"><strong>ID Verified:</strong> Both parties are KYC verified to ensure a safe exchange.</p>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed"><strong>Free Cancellation:</strong> Cancel up to 24 hours before pickup for a full refund.</p>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ProductDetail;
