import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Search, MapPin, Inbox, ShieldCheck, Leaf, Sparkles, Radio, Heart, Grid, List, 
  SlidersHorizontal, Bookmark, History, X, Star, Trash2, ArrowUpDown, ChevronDown
} from 'lucide-react';
import Input from '../components/Input';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { getLocalProducts, getLocalWishlist, saveLocalWishlist, getLocalSavedSearches, saveLocalSavedSearches } from '../utils/localDb';
import useAuthStore from '../store/authStore';
import useRealtimeStore from '../store/realtimeStore';
import useRealtimeProducts from '../hooks/useRealtimeProducts';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';

const CATEGORIES = ['All', 'Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'];
const POPULAR_SEARCHES = ['Sony A7', 'Mountain Bike', 'DeWalt Drill', 'JBL Speaker', 'PS5 Consoles'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const Products = () => {
  const { user, isMock } = useAuthStore();
  const navigate = useNavigate();
  
  // Products states
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Layout & Pagination
  const [layoutMode, setLayoutMode] = useState('grid');
  const [pageSize, setPageSize] = useState(8);
  const [hasMore, setHasMore] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Advanced filters
  const [maxPrice, setMaxPrice] = useState(300);
  const [maxDistance, setMaxDistance] = useState(100);
  const [showFilters, setShowFilters] = useState(false);

  // User geolocation coordinates
  const [userCoords, setUserCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Wishlist & Search history preferences
  const [wishlist, setWishlist] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Handle click outside search suggestions
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Request user geolocation for distance query
  const enableLocationSearch = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      }
    );
  };

  // Load preferences from local storage
  useEffect(() => {
    if (user?.id) {
      setWishlist(getLocalWishlist(user.id));
      setSavedSearches(getLocalSavedSearches(user.id));
      const history = localStorage.getItem(`recent_searches_${user.id}`);
      setRecentSearches(history ? JSON.parse(history) : []);
    }
  }, [user]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main fetch products hook/logic
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let rawData = [];
      if (!isMock) {
        let query = supabase.from('products').select('*');
        const { data, error: dbError } = await query;
        if (!dbError && data) {
          rawData = data;
        } else {
          rawData = getLocalProducts();
        }
      } else {
        rawData = getLocalProducts();
      }

      setAllProducts(rawData);
    } catch (err) {
      setError(err.message || 'Failed to load directory items.');
      setAllProducts(getLocalProducts());
    } finally {
      setLoading(false);
    }
  }, [isMock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Real-time product feed handler
  useRealtimeProducts(
    (newProds) => {
      if (newProds && newProds.length > 0) {
        setAllProducts(newProds);
      }
    },
    isMock
  );

  const newProductIds = useRealtimeStore(s => s.newProductIds);

  // Haversine Distance Calculator (km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filtering & Sorting Logic
  useEffect(() => {
    let result = [...allProducts];

    // Filter by Category
    if (category !== 'All') {
      result = result.filter(p => p.category === category);
    }

    // Filter by Search Query
    if (debouncedQuery.trim() !== '') {
      const query = debouncedQuery.toLowerCase();
      result = result.filter(
        p =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Filter by Price Limit
    result = result.filter(p => Number(p.price_per_day) <= maxPrice);

    // Filter by GPS Distance
    if (userCoords) {
      result = result.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = getDistance(
          userCoords.latitude,
          userCoords.longitude,
          p.latitude,
          p.longitude
        );
        p.distance = distance; // cache for view rendering
        return distance <= maxDistance;
      });
    }

    // Sorting options
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));
    }

    setFilteredProducts(result);
    setPageSize(8); // Reset pagination on filter update
  }, [allProducts, category, debouncedQuery, maxPrice, maxDistance, sortBy, userCoords]);

  // Pagination Slice
  useEffect(() => {
    const sliced = filteredProducts.slice(0, pageSize);
    setVisibleProducts(sliced);
    setHasMore(sliced.length < filteredProducts.length);
  }, [filteredProducts, pageSize]);

  // Load More function (Infinite scrolling simulation)
  const handleLoadMore = () => {
    setPageSize(prev => prev + 4);
  };

  // Toggle Wishlist Status
  const toggleWishlist = (productId, e) => {
    e.preventDefault();
    if (!user?.id) {
      navigate('/login');
      return;
    }
    const currentList = getLocalWishlist(user.id);
    let updated;
    if (currentList.includes(productId)) {
      updated = currentList.filter(id => id !== productId);
    } else {
      updated = [...currentList, productId];
    }
    setWishlist(updated);
    saveLocalWishlist(user.id, updated);
  };

  // Save current query search terms
  const handleSaveSearch = () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    if (!debouncedQuery.trim()) return;
    const currentSaved = getLocalSavedSearches(user.id);
    if (!currentSaved.includes(debouncedQuery)) {
      const updated = [...currentSaved, debouncedQuery];
      setSavedSearches(updated);
      saveLocalSavedSearches(user.id, updated);
    }
  };

  const deleteSavedSearch = (term) => {
    const updated = savedSearches.filter(s => s !== term);
    setSavedSearches(updated);
    saveLocalSavedSearches(user?.id, updated);
  };

  // Add search logs to history
  const handleSearchSubmit = (term) => {
    setSearchQuery(term);
    setShowSuggestions(false);

    if (user?.id && term.trim()) {
      let history = [...recentSearches];
      history = history.filter(h => h !== term);
      history.unshift(term);
      history = history.slice(0, 5); // Cap history to 5 elements
      setRecentSearches(history);
      localStorage.setItem(`recent_searches_${user.id}`, JSON.stringify(history));
    }
  };

  const getProductImage = (product) => {
    if (!product) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) return parsed[0];
      } catch (e) {
        return product.images;
      }
    }
    return 'https://via.placeholder.com/400x300?text=No+Image';
  };

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 pb-20">
      
      {/* Rich Page Header */}
      <div className="bg-navy rounded-b-[2.5rem] pt-12 pb-16 px-4 md:pt-20 md:pb-24 relative overflow-hidden mb-8 md:mb-12 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <Sparkles size={16} className="text-primary-light" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Neighborhood Directory</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            Find exactly what you <br />
            <span className="text-primary-light">need, right now.</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-xl mx-auto leading-relaxed px-4">
            Rent premium gear from verified neighbors securely. Support the circular economy.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search, History & Advanced Filters Bento Container */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 mb-8 relative z-20 -mt-20 md:-mt-28">
          <div className="flex flex-col lg:flex-row gap-4" ref={searchContainerRef}>
            
            {/* Smart Search Query Input & Suggestions */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search size={20} className="text-gray-400" />
              </div>
              <input 
                type="text"
                placeholder="Search for tools, cameras, camping gear..." 
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                className="pl-12 pr-4 bg-gray-50 border border-gray-200 h-14 text-base rounded-2xl w-full outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
              
              {/* Saved Searches Hook Action */}
              {debouncedQuery.trim() && (
                <button 
                  onClick={handleSaveSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-100"
                >
                  <Bookmark size={12} /> Save Search
                </button>
              )}

              {/* Suggestions Panel */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[105%] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 z-50 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Search History */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider">
                          <History size={12} /> Recent Searches
                        </div>
                        {recentSearches.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No search logs yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {recentSearches.map((term, idx) => (
                              <div key={idx} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg group">
                                <button 
                                  onClick={() => handleSearchSubmit(term)}
                                  className="text-sm text-gray-600 hover:text-primary font-bold text-left flex-1"
                                >
                                  {term}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Popular tags */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider">
                          <Sparkles size={12} /> Popular Searches
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_SEARCHES.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSearchSubmit(tag)}
                              className="px-3.5 py-1.5 bg-gray-50 hover:bg-primary hover:text-white rounded-lg text-xs font-bold text-gray-600 transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Action & Sort Toggles */}
            <div className="flex gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-14 px-6 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                  showFilters 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                }`}
              >
                <SlidersHorizontal size={18} /> Filters
              </button>
              
              <div className="h-14 bg-gray-50 border border-gray-200 rounded-2xl flex items-center px-2 flex-1 md:flex-none">
                 <Select 
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-none bg-transparent shadow-none w-full focus:ring-0 text-sm font-bold text-gray-700 h-full py-0"
                />
              </div>

              {/* Grid/List layout button */}
              <button 
                onClick={() => setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid')}
                className="h-14 w-14 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500"
              >
                {layoutMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>

          </div>

          {/* Active Saved Searches Row */}
          {savedSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs border-t border-gray-50 pt-4">
              <span className="font-bold text-gray-400 mr-2 flex items-center gap-1"><Bookmark size={10}/> Saved Searches:</span>
              {savedSearches.map((term, idx) => (
                <span key={idx} className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold flex items-center gap-2">
                  <span className="cursor-pointer" onClick={() => handleSearchSubmit(term)}>{term}</span>
                  <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => deleteSavedSearch(term)} />
                </span>
              ))}
            </div>
          )}

          {/* Advanced Sliders Drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6 pt-6 border-t border-gray-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Price Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-gray-500 uppercase tracking-wider">
                      <span>Max Rental Price</span>
                      <span className="text-primary font-black">${maxPrice}/day</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="500" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-gray-100 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Distance Slider (Requires coordinates) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-gray-500 uppercase tracking-wider">
                      <span>Distance Range</span>
                      <span className="text-primary font-black">{maxDistance} km</span>
                    </div>
                    {userCoords ? (
                      <input 
                        type="range" 
                        min="5" 
                        max="200" 
                        value={maxDistance} 
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        className="w-full accent-primary h-2 bg-gray-100 rounded-lg cursor-pointer"
                      />
                    ) : (
                      <button 
                        onClick={enableLocationSearch}
                        disabled={gpsLoading}
                        className="w-full py-2 bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                      >
                        {gpsLoading ? 'Detecting...' : '🛰️ Enable GPS Distance Filter'}
                      </button>
                    )}
                  </div>

                  {/* Quick Filters Reset */}
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setMaxPrice(300);
                        setMaxDistance(100);
                        setUserCoords(null);
                      }}
                      className="w-full h-11 bg-gray-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 size={14} /> Clear Advanced Filters
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories Horizontal Scrolling bar */}
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

        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold mb-8 text-sm md:text-base border border-red-100">{error}</div>}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
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
        ) : visibleProducts.length === 0 ? (
          <EmptyState 
            icon={Inbox}
            title="No products found"
            message="We couldn't find any items matching your current filters or search query."
            actionLabel="Clear all filters"
            onAction={() => { setCategory('All'); setSearchQuery(''); setMaxPrice(300); setUserCoords(null); }}
          />
        ) : (
          <div className="space-y-12">
            
            {/* GRID LAYOUT VIEW */}
            {layoutMode === 'grid' ? (
              <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleProducts.map(product => {
                  const image = getProductImage(product);
                  const productIsNew = newProductIds.has(product.id);
                  const isWishlisted = wishlist.includes(product.id);
                  return (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      key={product.id} 
                      className="h-full"
                    >
                      <TiltCard scaleOnHover={1.03}>
                        <div className={`group bg-white rounded-[2rem] p-4 border shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full relative ${
                          productIsNew ? 'border-primary/40 ring-2 ring-primary/10' : 'border-gray-100 hover:border-primary/20'
                        }`}>
                          <Link to={`/products/${product.id}`} className="absolute inset-0 z-0"></Link>
                          
                          {/* Image Box */}
                          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 relative z-10">
                            <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                            
                            {/* Heart Button */}
                            <button 
                              onClick={(e) => toggleWishlist(product.id, e)}
                              className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md z-30 transition-transform active:scale-95"
                            >
                              <Heart size={16} className={isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'} />
                            </button>

                            {productIsNew && (
                              <div className="absolute top-3 left-3 bg-primary text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span> NEW
                              </div>
                            )}
                            
                            {!product.is_available && (
                              <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                                Rented
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col px-2 relative z-10">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{product.category}</span>
                            <h3 className="font-extrabold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                            
                            <div className="flex items-center text-gray-400 text-xs mt-1 mb-4 gap-1.5">
                              <MapPin size={13} className="flex-shrink-0" />
                              <span className="truncate">{product.location || 'Local Area'}</span>
                              {product.distance !== undefined && (
                                <span className="text-primary font-bold">({product.distance.toFixed(1)} km away)</span>
                              )}
                            </div>

                            <div className="mt-auto flex items-end justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900">${product.price_per_day}</span>
                                <span className="text-xs text-gray-500 font-bold uppercase">/day</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              
              /* LIST LAYOUT VIEW */
              <motion.div initial="hidden" animate="visible" className="space-y-4">
                {visibleProducts.map(product => {
                  const image = getProductImage(product);
                  const isWishlisted = wishlist.includes(product.id);
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      key={product.id}
                      className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md hover:border-primary/20 transition-all relative group"
                    >
                      <Link to={`/products/${product.id}`} className="absolute inset-0 z-0"></Link>
                      
                      <div className="w-full md:w-56 aspect-[4/3] md:aspect-square bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 relative z-10">
                        <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        
                        <button 
                          onClick={(e) => toggleWishlist(product.id, e)}
                          className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md z-30"
                        >
                          <Heart size={16} className={isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'} />
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-2 relative z-10">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{product.category}</span>
                              <h3 className="font-extrabold text-gray-900 text-xl leading-snug mt-1 group-hover:text-primary transition-colors">{product.title}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-gray-900">${product.price_per_day}</span>
                              <span className="text-xs text-gray-500 font-bold block">/day</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-3 line-clamp-2 md:line-clamp-3 leading-relaxed">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                          <div className="flex items-center text-gray-400 text-xs gap-1.5">
                            <MapPin size={14} />
                            <span className="truncate">{product.location || 'Local Area'}</span>
                            {product.distance !== undefined && (
                              <span className="text-primary font-bold">({product.distance.toFixed(1)} km away)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Pagination Load More trigger */}
            {hasMore && (
              <div className="flex justify-center pt-8">
                <button 
                  onClick={handleLoadMore}
                  className="px-8 py-3.5 bg-white border border-gray-200 hover:border-primary text-gray-700 hover:text-primary font-bold rounded-2xl shadow-sm text-sm transition-all flex items-center gap-2"
                >
                  Load More Listings <ChevronDown size={16} />
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </AnimatedPage>
  );
};

export default Products;
