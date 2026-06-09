import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { Search, PlusCircle, Calendar, ArrowRight, PackageOpen, LayoutDashboard, MapPin, Sparkles, User as UserIcon, ChevronRight, TrendingUp, ShieldCheck, Zap, Lightbulb } from 'lucide-react';
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
  <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
    <div className="max-w-7xl mx-auto space-y-12 animate-pulse">
      <div className="h-40 md:h-64 bg-gray-200 rounded-[2rem] w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl w-full"></div>)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-gray-200 rounded-2xl w-full"></div>)}
      </div>
    </div>
  </div>
);

const RoleToggle = ({ mode, setMode }) => (
  <div className="relative flex items-center bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-inner overflow-hidden mt-4 md:mt-0 w-full md:w-auto">
    <div 
      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-full shadow-lg transition-transform duration-500 ease-spring ${mode === 'owner' ? 'translate-x-full' : 'translate-x-0'}`}
    ></div>
    <button 
      onClick={() => setMode('renter')}
      className={`relative z-10 flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 ${mode === 'renter' ? 'text-primary' : 'text-white hover:text-white/80'}`}
    >
      Renting
    </button>
    <button 
      onClick={() => setMode('owner')}
      className={`relative z-10 flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 ${mode === 'owner' ? 'text-primary' : 'text-white hover:text-white/80'}`}
    >
      Listing
    </button>
  </div>
);

const DashboardHeader = ({ profile, mode, setMode }) => {
  const firstName = profile?.name?.split(' ')[0] || 'There';
  
  return (
    <div className="relative bg-navy rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-14 overflow-hidden shadow-2xl mb-8 md:mb-12 animate-fade-in-up">
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary rounded-full mix-blend-screen filter blur-[80px] md:blur-[120px] opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] md:blur-[100px] opacity-20 animate-blob delay-300"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/20 p-1 flex-shrink-0">
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
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-primary-light animate-pulse" />
              <span className="text-primary-light text-xs md:text-sm font-bold tracking-wider uppercase">Welcome Back</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              Hi, {firstName}.
            </h1>
            <p className="text-gray-400 text-sm md:text-lg">
              {mode === 'renter' 
                ? 'Discover what your neighborhood has to offer today.' 
                : 'Manage your listings and track your earnings.'}
            </p>
          </div>
        </div>
        
        <RoleToggle mode={mode} setMode={setMode} />
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, desc, icon: Icon, to, gradient }) => (
  <motion.div variants={fadeUp} className="h-full">
    <TiltCard scaleOnHover={1.03}>
      <Link to={to} className={`group relative bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden block h-full flex flex-col`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
        
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 shadow-lg bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={24} className="md:w-7 md:h-7" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-6 flex-1">{desc}</p>
        
        <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 mt-auto">
          Get Started <ArrowRight size={16} />
        </div>
      </Link>
    </TiltCard>
  </motion.div>
);

const ProductCard = ({ product }) => (
  <motion.div variants={fadeUp} className="h-full">
    <TiltCard scaleOnHover={1.03}>
      <Link to={`/products/${product.id}`} className={`group relative bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 block h-full flex flex-col`}>
        
        <div className="h-48 md:h-56 relative overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <PackageOpen size={48} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
          
          <div className="absolute top-4 left-4">
            {product.is_available !== false ? (
              <span className="bg-white/90 backdrop-blur-md text-primary text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse"></span> Available
              </span>
            ) : (
              <span className="bg-white/90 backdrop-blur-md text-red-500 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                Rented
              </span>
            )}
          </div>
          
          <div className="absolute top-4 right-4 bg-navy/90 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-white shadow-lg border border-white/10">
            <span className="text-base md:text-lg font-bold">${product.price_per_day}</span>
            <span className="text-[10px] md:text-xs text-gray-400 font-normal"> /day</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center text-white/90 text-xs md:text-sm font-medium">
            <MapPin size={14} className="mr-1.5 md:w-4 md:h-4" />
            <span className="truncate drop-shadow-md">{product.location || 'Local Area'}</span>
          </div>
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col">
          <h4 className="font-bold text-gray-900 text-lg md:text-xl mb-1 md:mb-2 truncate group-hover:text-primary transition-colors">{product.title}</h4>
          <p className="text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">{product.description || 'No description provided'}</p>
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
  const [viewMode, setViewMode] = useState('renter');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (profileData) {
          setProfile(profileData);
          setViewMode(profileData.role === 'owner' ? 'owner' : 'renter');
        } else {
          setProfile(MOCK_USER);
          setViewMode(MOCK_USER.role === 'owner' ? 'owner' : 'renter');
        }

        const { data: productsData } = await supabase.from('products').select('*').limit(4).order('created_at', { ascending: false });
        if (productsData && productsData.length > 0) setRecentProducts(productsData);
        else setRecentProducts(MOCK_PRODUCTS.slice(0, 4));

      } catch (error) {
        setProfile(MOCK_USER);
        setRecentProducts(MOCK_PRODUCTS.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

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
      <div className="absolute top-0 left-1/4 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        
        {/* Header */}
        <motion.div variants={fadeUp}>
          <DashboardHeader profile={profile} mode={viewMode} setMode={setViewMode} />
        </motion.div>

        {/* Dashboard Analytics & Stats */}
        {viewMode === 'owner' && (
          <motion.div variants={fadeUp} className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-4 md:mb-6">Performance Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: "Earnings this month", val: "$450.00", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
                { label: "Active Listings", val: "4 Items", icon: PackageOpen, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Pending Requests", val: "2 Alerts", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Profile Rating", val: "4.9/5.0", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-3 md:mb-4`}>
                    <stat.icon size={20} className={`${stat.color}`} />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-xl md:text-3xl font-black text-gray-900">{stat.val}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions Bento Grid */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-20 relative z-10">
          <QuickActionCard 
            title="Browse Nearby" 
            desc="Discover tools, electronics, and gear available to rent from your neighbors right now. Everything is KYC verified."
            icon={Search} 
            to="/products"
            gradient="from-blue-500 to-indigo-600"
          />
          <QuickActionCard 
            title="List an Item" 
            desc="Turn your idle items into a passive income stream. It takes 2 minutes to create a listing. Insurance included."
            icon={PlusCircle} 
            to="/list-product"
            gradient="from-primary to-teal-600"
          />
          <QuickActionCard 
            title="My Bookings" 
            desc="Manage your current rentals, upcoming reservations, and detailed history. Track everything in one place."
            icon={Calendar} 
            to="/bookings"
            gradient="from-purple-500 to-pink-500"
          />
        </motion.div>

        {/* Dynamic Helpful Tips Section */}
        <motion.div variants={fadeUp} className="bg-gradient-to-br from-navy to-navy-light rounded-[2rem] p-6 md:p-10 text-white mb-16 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-12 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={20} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold tracking-widest uppercase text-xs">RentNear Guide</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">Maximize your experience</h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                Did you know that listings with 3 or more high-quality photos get rented 4x more often? Make sure your descriptions are clear and you reply to booking requests within 12 hours to maintain a high trust score.
              </p>
              <Link to="/profile" className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-bold text-sm transition-colors border border-white/20">
                Complete your Profile
              </Link>
            </div>
            <div className="w-full md:w-1/3 grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-white">4x</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">More Bookings</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Secured Escrow</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Listings Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-10 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 md:gap-3">
              <LayoutDashboard className="text-primary" size={24} />
              Fresh on RentNear
            </h2>
            <p className="text-gray-500 mt-2 text-sm md:text-lg">The latest items added by your community</p>
          </div>
          <Link to="/products" className="group flex items-center justify-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors bg-primary/10 px-6 py-3 rounded-full w-full sm:w-auto text-sm md:text-base">
            View Directory <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Recent Listings Grid */}
        {recentProducts.length > 0 ? (
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 md:p-16 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-primary to-gray-200"></div>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <PackageOpen size={32} className="text-gray-400 md:w-10 md:h-10" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">No listings in your area yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm md:text-lg leading-relaxed">
              Be the first pioneer in your neighborhood to list an item and start building the local circular economy.
            </p>
            <Link to="/list-product">
              <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(13,158,117,0.8)] transition-all duration-300">
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
