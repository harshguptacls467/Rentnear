import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import useRealtimeStore from '../store/realtimeStore';
import useRealtimeProducts from '../hooks/useRealtimeProducts';
import { 
  Search, PlusCircle, Calendar, ArrowRight, PackageOpen, LayoutDashboard, 
  MapPin, Sparkles, User as UserIcon, ChevronRight, TrendingUp, ShieldCheck, 
  Zap, Lightbulb, Heart, Bookmark, History, Clock, CheckCircle2, MessageSquare, AlertCircle
} from 'lucide-react';
import { MOCK_USER, MOCK_PRODUCTS } from '../data/mockData';
import { 
  getLocalProducts, getLocalBookings, saveLocalBookings, 
  getLocalWishlist, getLocalSavedSearches 
} from '../utils/localDb';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';

const Home = () => {
  const { user, isMock } = useAuthStore();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('renter');

  // Dashboard specific data
  const [recentProducts, setRecentProducts] = useState([]);
  const [ownerListings, setOwnerListings] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [renterActive, setRenterActive] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Live product feed
  useRealtimeProducts(setRecentProducts, isMock);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setError('');

    try {
      if (isMock) {
        setProfile(user);
        setViewMode(user.role === 'owner' ? 'owner' : 'renter');
        setRecentProducts(getLocalProducts().slice(0, 4));
        setOwnerListings(getLocalProducts().filter(p => p.owner_id === user.id));
        setOwnerRequests(getLocalBookings().filter(b => b.owner_id === user.id && b.status === 'pending'));
        setRenterActive(getLocalBookings().filter(b => b.renter_id === user.id && ['approved', 'awaiting_handover', 'active'].includes(b.status)));
        setLoading(false);
        return;
      }

      // Parallel execution for ultra-fast load speed
      const [
        userRes,
        recentProdsRes,
        ownerProdsRes,
        ownerReqsRes,
        renterActiveRes
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('products').select('*').limit(4).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('owner_id', user.id),
        supabase.from('bookings').select('*, product:products(*)').eq('owner_id', user.id).eq('status', 'pending'),
        supabase.from('bookings').select('*, product:products(*)').eq('renter_id', user.id).in('status', ['approved', 'awaiting_handover', 'active'])
      ]);

      const profileData = userRes?.data || user;
      setProfile(profileData);
      setViewMode(profileData.role === 'owner' ? 'owner' : 'renter');

      const recentList = recentProdsRes?.data?.length ? recentProdsRes.data : getLocalProducts().slice(0, 4);
      setRecentProducts(recentList);

      setOwnerListings(ownerProdsRes?.data || getLocalProducts().filter(p => p.owner_id === user.id));
      setOwnerRequests(ownerReqsRes?.data || []);
      setRenterActive(renterActiveRes?.data || []);

      // Local wishlist & saved searches
      const wishIds = getLocalWishlist(user.id);
      const allLocalProds = getLocalProducts();
      setWishlistItems(allLocalProds.filter(p => wishIds.includes(p.id)).slice(0, 3));
      setSavedSearches(getLocalSavedSearches(user.id).slice(0, 4));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, isMock]);

  const handleApproveRequest = async (reqId) => {
    try {
      if (!isMock) {
        await supabase.from('bookings').update({ status: 'approved' }).eq('id', reqId);
      } else {
        const bookings = getLocalBookings();
        const updated = bookings.map(b => b.id === reqId ? { ...b, status: 'approved' } : b);
        saveLocalBookings(updated);
      }
      fetchDashboardData();
    } catch (e) {
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      if (!isMock) {
        await supabase.from('bookings').update({ status: 'rejected' }).eq('id', reqId);
      } else {
        const bookings = getLocalBookings();
        const updated = bookings.map(b => b.id === reqId ? { ...b, status: 'rejected' } : b);
        saveLocalBookings(updated);
      }
      fetchDashboardData();
    } catch (e) {
      alert('Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const firstName = profile?.name?.split(' ')[0] || 'Neighbor';

  return (
    <AnimatedPage className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden">
      {/* Decorative premium background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Hero Banner Area */}
        <div className="relative overflow-hidden bg-navy text-white rounded-[2.5rem] p-8 md:p-16 mb-12 shadow-premium border border-white/5">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/25 rounded-full filter blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full filter blur-[100px] mix-blend-screen pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-primary-light uppercase bg-primary/15 border border-primary/20">
                <Sparkles size={10} className="animate-spin-slow" /> Peer-to-Peer Rental Network
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white">
                Rent goods <br />
                <span className="text-primary-light bg-gradient-to-r from-primary-light to-emerald-400 bg-clip-text text-transparent">locally near you</span>
              </h1>
              <p className="text-sm md:text-base text-gray-455 max-w-md leading-relaxed">
                Save money, declutter your closets, and reduce carbon emissions. Access premium tools, camera gear, and camping supplies right in your neighborhood.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/products" className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:scale-[1.02]">
                  Explore Catalog
                </Link>
                <Link to="/list-product" className="px-6 py-3 bg-white/10 text-white rounded-2xl text-xs font-black border border-white/10 hover:bg-white/20 transition-all hover:scale-[1.02]">
                  List an Item
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block relative">
              {/* Premium Dashboard preview graphics panel */}
              <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 shadow-2xl relative z-10 max-w-sm mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black text-gray-400 tracking-wider">ECO SAVINGS INDEX</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Total Carbon Offset</span><span className="font-mono text-sm font-black text-primary-light">-240kg CO₂</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Circular Rentals</span><span className="font-mono text-sm font-black text-primary-light">342 Handovers</span></div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-primary w-4/5 rounded-full"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Switch Header & Toggle Block */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-navy leading-none">Hi, {firstName}.</h2>
            <p className="text-xs text-gray-400 mt-1">Manage your active accounts and dashboard panels below.</p>
          </div>
          
          <div className="relative flex items-center bg-gray-150/50 p-1.5 rounded-full border border-gray-200 w-full md:w-auto">
            <button 
              onClick={() => setViewMode('renter')}
              className={`flex-1 md:flex-none px-6 py-2 text-xs font-bold rounded-full transition-all duration-300 ${viewMode === 'renter' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy'}`}
            >
              Renter Dashboard
            </button>
            <button 
              onClick={() => setViewMode('owner')}
              className={`flex-1 md:flex-none px-6 py-2 text-xs font-bold rounded-full transition-all duration-300 ${viewMode === 'owner' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy'}`}
            >
              Owner Dashboard
            </button>
          </div>
        </div>

        {/* Bento Grid Containers based on Switch mode */}
        <AnimatePresence mode="wait">
          {viewMode === 'renter' ? (
            
            /* RENTER BENTO DASHBOARD PAGE */
            <motion.div 
              key="renter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
            >
              {/* Active Rentals Panel (Left Column span-2) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
                    <Clock className="text-primary" size={20} /> Active Rentals & Pickups
                  </h3>
                  
                  {renterActive.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-250 rounded-2xl">
                      <PackageOpen className="text-gray-300 mx-auto mb-2" size={32} />
                      <p className="text-sm font-bold text-gray-500">No active rentals right now</p>
                      <Link to="/products" className="text-xs text-primary font-bold hover:underline mt-2 inline-block">Browse Catalog</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {renterActive.map((rent) => (
                        <div key={rent.id} className="bg-gray-50 p-4 border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={rent.product?.images?.[0] || 'https://via.placeholder.com/150'} alt="product" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-navy text-sm leading-tight">{rent.product?.title}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Return Due: {new Date(rent.end_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto justify-end">
                            <Link to={`/chat/${rent.id}`} className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1">
                              <MessageSquare size={13} /> Chat
                            </Link>
                            <Link to="/bookings" className="px-3.5 py-2 bg-navy text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                              Track Details <ChevronRight size={13} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Popular searches Suggestions */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
                    <Search className="text-primary" size={20} /> Saved Searches & Tags
                  </h3>
                  {savedSearches.length === 0 ? (
                    <p className="text-xs text-gray-450 italic">No saved search keywords yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map((term, idx) => (
                        <button 
                          key={idx}
                          onClick={() => navigate(`/products?search=${encodeURIComponent(term)}`)}
                          className="px-4 py-2 bg-gray-50 border border-gray-200 hover:border-navy text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Bookmark size={11} /> {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Renter Right Column: Wishlist shortcuts */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
                    <Heart className="text-red-500 fill-current" size={20} /> Wishlist shortcuts
                  </h3>
                  {wishlistItems.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">Your wishlist is empty.</p>
                  ) : (
                    <div className="space-y-4">
                      {wishlistItems.map((item) => (
                        <Link key={item.id} to={`/products/${item.id}`} className="flex items-center gap-3 group border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="w-12 h-12 bg-gray-150 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={item.images?.[0] || 'https://via.placeholder.com/150'} alt="wishlist product" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-navy text-xs leading-tight truncate group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-[10px] text-gray-400 font-extrabold mt-1">${item.price_per_day}/day</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            
            /* OWNER BENTO DASHBOARD PAGE */
            <motion.div 
              key="owner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
            >
              {/* Owner Stats & Payout Chart (Left Column span-2) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Pending requests directly actioned on Home screen */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
                    <Zap className="text-amber-500 fill-current animate-pulse" size={20} /> Incoming Rent Requests
                  </h3>
                  {ownerRequests.length === 0 ? (
                    <p className="text-xs text-gray-450 italic py-4">No pending request tickets at this moment.</p>
                  ) : (
                    <div className="space-y-4">
                      {ownerRequests.map((req) => (
                        <div key={req.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h4 className="font-extrabold text-navy text-sm leading-tight">Request for {req.product?.title}</h4>
                            <p className="text-[10px] text-gray-400 font-bold mt-1">Requested by: {req.renter?.name || 'Neighbor'}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveRequest(req.id)}
                              className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl text-xs font-bold"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Earnings Progression Analytics */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-black text-navy">Payout Payout Analytics</h3>
                      <p className="text-xs text-gray-500">Your monthly platform paycheck trajectory</p>
                    </div>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Take-Home Rate: 90%
                    </span>
                  </div>

                  {/* SVG Chart Preview */}
                  <div className="h-32 w-full mt-4">
                    <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <linearGradient id="homeEarnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9e75" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0d9e75" stopOpacity="0.0" />
                      </linearGradient>
                      <path d="M 0 90 L 100 70 L 200 45 L 300 65 L 400 30 L 500 15 L 500 120 L 0 120 Z" fill="url(#homeEarnGrad)" />
                      <path d="M 0 90 L 100 70 L 200 45 L 300 65 L 400 30 L 500 15" fill="none" stroke="#0d9e75" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Owner Right Column: active Listings list */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black text-navy flex items-center gap-2">
                      <PackageOpen className="text-primary" size={20} /> Active Listings
                    </h3>
                    <Link to="/my-listings" className="text-xs text-primary font-bold hover:underline">Manage All</Link>
                  </div>
                  {ownerListings.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">No listings added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {ownerListings.slice(0, 3).map((list) => (
                        <div key={list.id} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="w-12 h-12 bg-gray-150 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={list.images?.[0] || 'https://via.placeholder.com/150'} alt="listing" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-navy text-xs leading-tight truncate">{list.title}</h4>
                            <p className="text-[10px] text-gray-450 mt-1 font-bold">
                              ${list.price_per_day}/day • <span className={list.is_available ? 'text-green-500' : 'text-amber-500'}>{list.is_available ? 'Available' : 'Rented'}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          )}
        </AnimatePresence>

        {/* Featured Categories Collections */}
        <div className="mb-12">
          <h3 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
            <LayoutDashboard className="text-primary" size={20} /> Featured Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Camera Gear", icon: "📸", category: "Electronics", color: "from-blue-500/10 to-indigo-500/10" },
              { title: "Camping & Outdoors", icon: "🏕️", category: "Outdoors", color: "from-green-500/10 to-emerald-500/10" },
              { title: "Power Tools", icon: "🔧", category: "Tools", color: "from-amber-500/10 to-orange-500/10" },
              { title: "Party Supplies", icon: "🥳", category: "Party", color: "from-pink-500/10 to-rose-500/10" }
            ].map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => navigate(`/products?category=${cat.category}`)}
                className={`bg-gradient-to-br ${cat.color} border border-gray-100 hover:border-primary/30 p-5 rounded-3xl text-left transition-all duration-300 hover:scale-[1.02] flex items-center gap-4 group`}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <div>
                  <h4 className="font-extrabold text-navy text-sm leading-tight">{cat.title}</h4>
                  <p className="text-[10px] text-gray-455 mt-1 font-bold">Browse Listings →</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Global Directory Overview header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-navy tracking-tight flex items-center gap-2">
              <LayoutDashboard className="text-primary" size={22} /> Fresh Listings Near Me
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Rent tools, camera kits, and camping products locally.</p>
          </div>
          <Link to="/products" className="group flex items-center justify-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors bg-primary/10 px-5 py-2.5 rounded-full text-xs">
            Explore Directory <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Card Row */}
        {recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProducts.slice(0, 4).map((product) => {
              const image = product.images?.[0] || 'https://via.placeholder.com/400';
              return (
                <div key={product.id} className="h-full">
                  <TiltCard scaleOnHover={1.02}>
                    <Link to={`/products/${product.id}`} className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm card-hover-lift block h-full flex flex-col">
                      <div className="h-44 relative bg-gray-100 overflow-hidden">
                        <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-navy/90 px-3 py-1.5 rounded-xl text-white shadow-sm backdrop-blur-sm border border-white/10">
                          <span className="text-sm font-black">${product.price_per_day}</span>
                          <span className="text-[9px] text-gray-400">/day</span>
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1.5">{product.category}</span>
                        <h4 className="font-extrabold text-navy text-sm mb-1 truncate group-hover:text-primary transition-colors">{product.title}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed flex-1">{product.description || 'No description provided'}</p>
                      </div>
                    </Link>
                  </TiltCard>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm">
            <PackageOpen size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">No active products added nearby.</p>
          </div>
        )}

      </div>
    </AnimatedPage>
  );
};

export default Home;
