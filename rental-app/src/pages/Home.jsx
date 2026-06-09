import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { Search, PlusCircle, Calendar, ArrowRight, PackageOpen, LayoutDashboard, MapPin, Sparkles, User as UserIcon, ChevronRight } from 'lucide-react';
import { MOCK_USER, MOCK_PRODUCTS } from '../data/mockData';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// ==========================================
// REUSABLE UI COMPONENTS
// ==========================================

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#F8FAFC] p-8">
    <div className="max-w-7xl mx-auto space-y-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-64 bg-gray-200 rounded-3xl w-full"></div>
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl w-full"></div>)}
      </div>
      {/* Products Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-gray-200 rounded-2xl w-full"></div>)}
      </div>
    </div>
  </div>
);

const RoleToggle = ({ mode, setMode }) => (
  <div className="relative flex items-center bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-inner overflow-hidden">
    {/* Animated Active Background Pill */}
    <div 
      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-full shadow-lg transition-transform duration-500 ease-spring ${mode === 'owner' ? 'translate-x-full' : 'translate-x-0'}`}
    ></div>
    
    <button 
      onClick={() => setMode('renter')}
      className={`relative z-10 flex-1 px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 ${mode === 'renter' ? 'text-primary' : 'text-white hover:text-white/80'}`}
    >
      Renting
    </button>
    <button 
      onClick={() => setMode('owner')}
      className={`relative z-10 flex-1 px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 ${mode === 'owner' ? 'text-primary' : 'text-white hover:text-white/80'}`}
    >
      Listing
    </button>
  </div>
);

const DashboardHeader = ({ profile, mode, setMode }) => {
  const firstName = profile?.name?.split(' ')[0] || 'There';
  
  return (
    <div className="relative bg-navy rounded-[2.5rem] p-10 md:p-14 overflow-hidden shadow-2xl mb-12 animate-fade-in-up">
      {/* Premium Glassmorphism & Gradient Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob delay-300"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full border-2 border-white/20 p-1 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden shadow-inner">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-400">
                  <UserIcon size={32} />
                </div>
              )}
            </div>
          </div>
          
          {/* Greeting */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-primary-light animate-pulse" />
              <span className="text-primary-light text-sm font-bold tracking-wider uppercase">Welcome Back</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              Hi, {firstName}.
            </h1>
            <p className="text-gray-400 text-lg">
              {mode === 'renter' 
                ? 'Discover what your neighborhood has to offer today.' 
                : 'Manage your listings and track your earnings.'}
            </p>
          </div>
        </div>
        
        {/* Toggle */}
        <RoleToggle mode={mode} setMode={setMode} />
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, desc, icon: Icon, to, gradient }) => (
  <motion.div variants={fadeUp}>
    <TiltCard scaleOnHover={1.05}>
      <Link to={to} className={`group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden block h-full`}>
        {/* Hover Gradient Background injection */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
        
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={28} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{desc}</p>
        
        <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
          Get Started <ArrowRight size={16} />
        </div>
      </Link>
    </TiltCard>
  </motion.div>
);

const ProductCard = ({ product }) => (
  <motion.div variants={fadeUp}>
    <TiltCard scaleOnHover={1.03}>
      <Link to={`/products/${product.id}`} className={`group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 block h-full`}>
        
        {/* Image Container with Zoom */}
        <div className="h-56 relative overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <PackageOpen size={48} />
            </div>
          )}
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
          
          {/* Badges */}
          <div className="absolute top-4 left-4">
            {product.is_available !== false ? (
              <span className="bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Available
              </span>
            ) : (
              <span className="bg-white/90 backdrop-blur-md text-red-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                Rented
              </span>
            )}
          </div>
          
          <div className="absolute top-4 right-4 bg-navy/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white shadow-lg border border-white/10">
            <span className="text-lg font-bold">${product.price_per_day}</span>
            <span className="text-xs text-gray-400 font-normal"> /day</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center text-white/90 text-sm font-medium">
            <MapPin size={16} className="mr-1.5" />
            <span className="truncate drop-shadow-md">{product.location || 'Local Area'}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h4 className="font-bold text-gray-900 text-xl mb-2 truncate group-hover:text-primary transition-colors">{product.title}</h4>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{product.description || 'No description provided'}</p>
        </div>
      </Link>
    </TiltCard>
  </motion.div>
);


// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

const Home = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard view mode
  const [viewMode, setViewMode] = useState('renter');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 1. Fetch User Profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData && !profileError) {
          setProfile(profileData);
          setViewMode(profileData.role === 'owner' ? 'owner' : 'renter');
        } else {
          // Fallback to mock user
          setProfile(MOCK_USER);
          setViewMode(MOCK_USER.role === 'owner' ? 'owner' : 'renter');
        }

        // 2. Fetch Recent Products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .limit(4)
          .order('created_at', { ascending: false });
          
        if (productsData && !productsError && productsData.length > 0) {
          setRecentProducts(productsData);
        } else {
          // Fallback to mock products
          setRecentProducts(MOCK_PRODUCTS.slice(0, 4));
        }

      } catch (error) {
        console.error('Error fetching dashboard data — using mock data:', error);
        setProfile(MOCK_USER);
        setRecentProducts(MOCK_PRODUCTS.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    // If no user (not logged in), still show mock data for demo
    if (!user) {
      Promise.resolve().then(() => {
        setProfile(MOCK_USER);
        setRecentProducts(MOCK_PRODUCTS.slice(0, 4));
        setLoading(false);
      });
      return;
    }

    fetchDashboardData();
  }, [user]);

  if (loading) return <LoadingSkeleton />;

  return (
    <AnimatedPage className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden">
      
      {/* Background ambient mesh */}
      <div className="absolute top-0 left-1/4 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>

      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
      >
        
        {/* Header */}
        <motion.div variants={fadeUp}>
          <DashboardHeader profile={profile} mode={viewMode} setMode={setViewMode} />
        </motion.div>

        {/* Quick Actions Bento Grid */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 relative z-10">
          <QuickActionCard 
            title="Browse Nearby" 
            desc="Discover tools, electronics, and gear available to rent from your neighbors right now."
            icon={Search} 
            to="/products"
            gradient="from-blue-500 to-indigo-600"
          />
          <QuickActionCard 
            title="List an Item" 
            desc="Turn your idle items into a passive income stream. It takes 2 minutes to create a listing."
            icon={PlusCircle} 
            to="/list-product"
            gradient="from-primary to-teal-600"
          />
          <QuickActionCard 
            title="My Bookings" 
            desc="Manage your current rentals, upcoming reservations, and detailed history."
            icon={Calendar} 
            to="/bookings"
            gradient="from-purple-500 to-pink-500"
          />
        </motion.div>

        {/* Recent Listings Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-primary" size={28} />
              Fresh on RentNear
            </h2>
            <p className="text-gray-500 mt-2 text-lg">The latest items added by your community</p>
          </div>
          <Link to="/products" className="group flex items-center gap-2 text-primary font-bold mt-4 sm:mt-0 hover:text-primary-dark transition-colors bg-primary/10 px-6 py-3 rounded-full">
            View Directory <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Recent Listings Grid */}
        {recentProducts.length > 0 ? (
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recentProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
              />
            ))}
          </motion.div>
        ) : (
          // Premium Empty State
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-primary to-gray-200"></div>
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <PackageOpen size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No listings in your area yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
              Be the first pioneer in your neighborhood to list an item and start building the local circular economy.
            </p>
            <Link to="/list-product">
              <button className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(13,158,117,0.8)] transition-all duration-300">
                Create First Listing
              </button>
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
};

export default Home;
