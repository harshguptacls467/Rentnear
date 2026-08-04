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
import useDebounce from '../hooks/useDebounce';
import ProductFilters from '../components/ProductFilters';
import ActiveFilterChips from '../components/ActiveFilterChips';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';
import useSearchStore from '../store/searchStore';

const CATEGORIES = ['All', 'Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'];
const POPULAR_SEARCHES = ['Sony A7', 'Mountain Bike', 'DeWalt Drill', 'JBL Speaker', 'PS5 Consoles'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Highest Rated Owners' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'nearest', label: 'Nearest to Me' },
];

const Products = () => {
  const { user, isMock } = useAuthStore();
  const navigate = useNavigate();
  const { setOverlayOpen } = useSearchStore();
  
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

  // Consolidated Search & Filter State
  const [filters, setFilters] = useState({
    category: 'All',
    searchQuery: '',
    maxPrice: 300,
    maxDistance: 100,
    instantBookOnly: false,
    condition: 'All',
    minRating: 0
  });

  const [sortBy, setSortBy] = useState('newest');
  const [isOpenMobileFilters, setIsOpenMobileFilters] = useState(false);

  // Debounced Search Query (300ms)
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

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
  const handleRealtimeUpdate = useCallback((newProds) => {
    if (newProds && newProds.length > 0) {
      setAllProducts(newProds);
    }
  }, []);

  useRealtimeProducts(handleRealtimeUpdate, isMock);

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

  // Filtering & Multi-Axis Sorting Logic
  useEffect(() => {
    let result = [...allProducts];

    // Filter by Category
    if (filters.category !== 'All') {
      result = result.filter(p => p.category === filters.category);
    }

    // Filter by Instant Booking
    if (filters.instantBookOnly) {
      result = result.filter(p => p.instant_booking_enabled === true);
    }

    // Filter by Condition
    if (filters.condition !== 'All') {
      result = result.filter(p => p.condition?.toLowerCase() === filters.condition.toLowerCase());
    }

    // Filter by Owner Rating
    if (filters.minRating > 0) {
      result = result.filter(p => (p.owner?.rating_average || 0) >= filters.minRating);
    }

    // Filter by Search Query
    if (debouncedSearchQuery.trim() !== '') {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.owner?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by Price Limit
    result = result.filter(p => Number(p.price_per_day) <= filters.maxPrice);

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
        p.distance = distance;
        return distance <= filters.maxDistance;
      });
    }

    // Multi-Axis Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));
    } else if (sortBy === 'rating_desc') {
      result.sort((a, b) => (b.owner?.rating_average || 0) - (a.owner?.rating_average || 0));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.owner?.rating_count || 0) - (a.owner?.rating_count || 0));
    } else if (sortBy === 'nearest' && userCoords) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      // 'newest' default
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredProducts(result);
    setPageSize(8); // Reset pagination on filter update
  }, [allProducts, filters, debouncedSearchQuery, sortBy, userCoords]);

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
    if (!debouncedSearchQuery.trim()) return;
    const currentSaved = getLocalSavedSearches(user.id);
    if (!currentSaved.includes(debouncedSearchQuery)) {
      const updated = [...currentSaved, debouncedSearchQuery];
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
    setFilters(f => ({ ...f, searchQuery: term }));
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
            
            {/* Click-to-open global intelligent search overlay */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search size={20} className="text-gray-400" />
              </div>
              <button
                onClick={() => setOverlayOpen(true)}
                className="w-full text-left pl-12 pr-4 bg-gray-50 border border-gray-200 h-14 text-base rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-400 flex items-center justify-between"
              >
                <span>Search gear, cameras, tools, or owner name...</span>
                <span className="text-[10px] font-black bg-gray-200/60 px-2 py-1 rounded text-gray-500 mr-2 uppercase tracking-widest hidden sm:inline-block">Press / Key</span>
              </button>
            </div>



            {/* Filter Action & Sort Toggles */}
            <div className="flex gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setIsOpenMobileFilters(true)}
                className="lg:hidden h-14 px-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-900 font-bold text-xs flex items-center gap-2 transition-all relative"
              >
                <SlidersHorizontal size={18} /> Filters
                {(filters.category !== 'All' || filters.instantBookOnly || filters.maxPrice < 300 || filters.condition !== 'All' || filters.minRating > 0) && (
                  <span className="w-2 h-2 rounded-full bg-primary absolute top-3 right-3 animate-ping" />
                )}
              </button>
              
              <button 
                onClick={() => setFilters(f => ({ ...f, instantBookOnly: !f.instantBookOnly }))}
                className={`h-14 px-5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all ${
                  filters.instantBookOnly 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400'
                }`}
              >
                ⚡ Instant Bookable
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

          {/* Active Filter Chips Bar */}
          <ActiveFilterChips 
            filters={filters}
            onRemoveFilter={(key) => {
              if (key === 'category') setFilters(f => ({ ...f, category: 'All' }));
              if (key === 'searchQuery') setFilters(f => ({ ...f, searchQuery: '' }));
              if (key === 'maxPrice') setFilters(f => ({ ...f, maxPrice: 300 }));
              if (key === 'maxDistance') setFilters(f => ({ ...f, maxDistance: 100 }));
              if (key === 'instantBookOnly') setFilters(f => ({ ...f, instantBookOnly: false }));
              if (key === 'condition') setFilters(f => ({ ...f, condition: 'All' }));
              if (key === 'minRating') setFilters(f => ({ ...f, minRating: 0 }));
            }}
            onClearAll={() => setFilters({
              category: 'All',
              searchQuery: '',
              maxPrice: 300,
              maxDistance: 100,
              instantBookOnly: false,
              condition: 'All',
              minRating: 0
            })}
          />

          {/* Main Workspace Layout with Desktop Filters Sidebar */}
          <div className="flex gap-8 mt-6 items-start">
            
            <ProductFilters 
              filters={filters}
              setFilters={setFilters}
              isOpenMobile={isOpenMobileFilters}
              onCloseMobile={() => setIsOpenMobileFilters(false)}
              onReset={() => setFilters({
                category: 'All',
                searchQuery: '',
                maxPrice: 300,
                maxDistance: 100,
                instantBookOnly: false,
                condition: 'All',
                minRating: 0
              })}
            />            <div className="flex-1 w-full min-w-0">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold mb-8 text-sm border border-red-100">{error}</div>}

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  onAction={() => setFilters({
                    category: 'All',
                    searchQuery: '',
                    maxPrice: 300,
                    maxDistance: 100,
                    instantBookOnly: false,
                    condition: 'All',
                    minRating: 0
                  })}
                />
              ) : (
                <div className="space-y-8">
                  
                  {/* GRID LAYOUT VIEW */}
                  {layoutMode === 'grid' ? (
                    <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">{product.category}</span>
                                  <h3 className="font-extrabold text-gray-900 text-base leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                                  
                                  <div className="flex items-center text-gray-400 text-xs mt-1 mb-4 gap-1.5">
                                    <MapPin size={13} className="flex-shrink-0" />
                                    <span className="truncate">{product.location || 'Local Area'}</span>
                                    {product.distance !== undefined && (
                                      <span className="text-primary font-bold">({product.distance.toFixed(1)} km)</span>
                                    )}
                                  </div>

                                  <div className="mt-auto flex items-end justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-black text-gray-900">${product.price_per_day}</span>
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
                          <motion.div key={product.id} layout className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 relative group">
                            <Link to={`/products/${product.id}`} className="absolute inset-0 z-0"></Link>
                            <div className="w-full sm:w-48 aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 relative z-10">
                              <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between relative z-10 py-1">
                              <div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{product.category}</span>
                                <h3 className="font-extrabold text-gray-900 text-lg">{product.title}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2 mt-1">{product.description}</p>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-black text-gray-900">${product.price_per_day}</span>
                                  <span className="text-xs text-gray-500 font-bold">/day</span>
                                </div>
                                <button onClick={(e) => toggleWishlist(product.id, e)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400">
                                  <Heart size={16} className={isWishlisted ? 'text-red-500 fill-current' : ''} />
                                </button>
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

          </div>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default Products;
