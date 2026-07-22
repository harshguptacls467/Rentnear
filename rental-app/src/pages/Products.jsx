import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, MapPin, Inbox, ShieldCheck, Leaf, Sparkles, Radio } from 'lucide-react';
import Input from '../components/Input';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { MOCK_PRODUCTS } from '../data/mockData';
import { getLocalProducts } from '../utils/localDb';
import useAuthStore from '../store/authStore';
import useRealtimeStore from '../store/realtimeStore';
import useRealtimeProducts from '../hooks/useRealtimeProducts';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const CATEGORIES = ['All', 'Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const Products = () => {
  const { isMock } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        if (isMock) {
          throw new Error('mock');
        }
        let query = supabase.from('products').select('*');
        if (category !== 'All') query = query.eq('category', category);
        if (debouncedQuery.trim() !== '') query = query.ilike('title', `%${debouncedQuery}%`);
        
        if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'price_asc') query = query.order('price_per_day', { ascending: true });
        else if (sortBy === 'price_desc') query = query.order('price_per_day', { ascending: false });

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        if (data && data.length > 0) setProducts(data);
        else throw new Error('empty');
      } catch {
        let mock = [...getLocalProducts()];
        if (category !== 'All') mock = mock.filter(p => p.category === category);
        if (debouncedQuery.trim()) {
          const q = debouncedQuery.toLowerCase();
          mock = mock.filter(p => p.title.toLowerCase().includes(q));
        }
        if (sortBy === 'newest') {
          mock.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'price_asc') {
          mock.sort((a, b) => a.price_per_day - b.price_per_day);
        } else if (sortBy === 'price_desc') {
          mock.sort((a, b) => b.price_per_day - a.price_per_day);
        }
        setProducts(mock);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedQuery, category, sortBy, isMock]);

  // Live product subscription — filters applied client-side
  useRealtimeProducts(
    setProducts,
    isMock,
    { category, searchQuery: debouncedQuery },
    sortBy
  );

  const productsFeedStatus = useRealtimeStore(s => s.productsFeedStatus);
  const newProductIds = useRealtimeStore(s => s.newProductIds);

  const getProductImage = (product) => {
    if (!product) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (Array.isArray(product.images)) {
      return product.images[0] || 'https://via.placeholder.com/400x300?text=No+Image';
    }
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) return parsed[0] || 'https://via.placeholder.com/400x300?text=No+Image';
      } catch (e) {
        if (product.images.startsWith('http')) return product.images;
        if (product.images.includes(',')) {
          return product.images.split(',')[0].trim();
        }
        return product.images;
      }
    }
    return 'https://via.placeholder.com/400x300?text=No+Image';
  };



  return (
    <AnimatedPage className="min-h-screen bg-gray-50 pb-20">
      
      {/* Rich Hero Banner */}
      <div className="bg-navy rounded-b-[2.5rem] pt-12 pb-16 px-4 md:pt-20 md:pb-24 relative overflow-hidden mb-8 md:mb-12 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <Sparkles size={16} className="text-primary-light" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Neighborhood Directory</span>
            {productsFeedStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-green-400 border-l border-white/20 pl-2">
                <Radio size={9} className="animate-pulse" /> LIVE
              </span>
            )}
          </motion.div>
          
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            Find exactly what you <br className="hidden md:block" />
            <span className="text-primary-light">need, right now.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-gray-400 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed px-4">
            Browse thousands of high-quality items listed by verified neighbors. Stop buying things you use once a year and start renting safely.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search & Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-3xl p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 mb-8 md:mb-10 relative z-20 -mt-20 md:-mt-28">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search size={20} className="text-gray-400" />
              </div>
              <Input 
                placeholder="Search for tools, cameras, camping gear..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-gray-50 border-gray-200 h-14 text-base md:text-lg rounded-2xl w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="h-14 bg-gray-50 border border-gray-200 rounded-2xl flex items-center px-2">
                 <Select 
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-none bg-transparent shadow-none w-full focus:ring-0 text-sm md:text-base font-bold text-gray-700 h-full py-0"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
                    category === cat 
                      ? 'bg-navy text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold mb-8 text-sm md:text-base border border-red-100">{error}</div>}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm">
                <Skeleton className="w-full aspect-[4/3] mb-4 rounded-xl" />
                <Skeleton variant="text" className="w-3/4 mb-3" />
                <Skeleton variant="text" className="w-1/2 mb-4" />
                <div className="flex justify-between items-end mt-6">
                  <Skeleton variant="text" className="w-1/3 h-6" />
                  <Skeleton variant="text" className="w-1/3 h-8" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState 
            icon={Inbox}
            title="No products found"
            message="We couldn't find any items matching your current filters or search query. Try adjusting your search!"
            actionLabel="Clear all filters"
            onAction={() => { setCategory('All'); setSearchQuery(''); }}
          />
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => {
              const image = getProductImage(product);
              const productIsNew = newProductIds.has(product.id);
              return (
                <motion.div variants={fadeUp} key={product.id} className="h-full">
                  <TiltCard scaleOnHover={1.03}>
                    <Link to={`/products/${product.id}`} className={`group bg-white rounded-[2rem] p-4 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col h-full ${
                      productIsNew ? 'border-primary/40 ring-2 ring-primary/10' : 'border-gray-100 hover:border-primary/20'
                    }`}>
                      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 relative">
                        <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        {productIsNew && (
                          <div className="absolute top-3 left-3 bg-primary text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span> NEW
                          </div>
                        )}
                        {!product.is_available && (
                          <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                            Rented
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col px-2">
                        <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest mb-2">{product.category}</span>
                        <h3 className="font-extrabold text-gray-900 text-lg md:text-xl leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                        
                        <div className="flex items-center text-gray-400 text-xs mt-1 mb-4">
                          <MapPin size={14} className="mr-1.5" />
                          <span className="truncate">{product.location || 'Local Area'}</span>
                        </div>

                        <div className="mt-auto flex items-end justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-900">${product.price_per_day}</span>
                            <span className="text-xs text-gray-500 font-bold uppercase">/day</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Rich SEO Content Section at bottom */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-20 md:mt-32 bg-white rounded-[2.5rem] p-8 md:p-16 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">Why buy when you can <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-500">rent nearby?</span></h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
                The average power drill is used for just 13 minutes in its entire lifetime. Buying items for single-use projects is expensive and harmful to the environment.
              </p>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
                RentNear connects you with people in your neighborhood who already own the gear you need. By renting locally, you save money, reduce manufacturing waste, and build community trust.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><ShieldCheck size={24} /></div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Fully Insured & Verified</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">Every user undergoes mandatory Government ID KYC. Every rental is backed by a secure deposit hold.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"><Leaf size={24} /></div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Sustainable Choice</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">Join the circular economy. Renting prevents millions of tons of perfectly good tools and electronics from ending up in landfills.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </AnimatedPage>
  );
};

export default Products;
