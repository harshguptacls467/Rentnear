import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Sparkles, History, ArrowRight, Grid, MapPin, 
  Leaf, ShieldCheck, Heart, Trash2, Calendar, Star, Compass, RefreshCcw, Tag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useSearchStore from '../store/searchStore';
import useAuthStore from '../store/authStore';
import Skeleton from './Skeleton';
import TiltCard from './TiltCard';
import { getLocalRecentlyViewed, getLocalProducts } from '../utils/localDb';

export const SearchOverlay = () => {
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();
  const {
    searchQuery, searchFilters, sortBy, searchResults, loading, error,
    overlayOpen, recentSearches, trendingSearches, aiSuggestions,
    setSearchQuery, setOverlayOpen, updateFilters, resetFilters,
    performSearch, addRecentSearch, clearRecentSearches, fetchTrendingSearches, logSearchClick
  } = useSearchStore();

  const overlayRef = useRef(null);
  const inputRef = useRef(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [gpsCoords, setGpsCoords] = useState(null);

  // Suggestions state: combine typed query matching prefix + AI suggestions + category triggers
  const [activeSuggestions, setActiveSuggestions] = useState([]);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => console.warn('Geolocation blocked for search distance ranking.')
      );
    }
  }, []);

  // Fetch initial preferences/trending on mount/open
  useEffect(() => {
    if (overlayOpen) {
      inputRef.current?.focus();
      fetchTrendingSearches(isMock);
      useSearchStore.getState().loadRecentSearches(user?.id);
      setActiveSuggestionIdx(-1);
    }
  }, [overlayOpen, isMock, user?.id, fetchTrendingSearches]);

  // Handle building dynamic suggestions matching prefix or AI associations
  useEffect(() => {
    if (!searchQuery.trim()) {
      setActiveSuggestions([]);
      return;
    }
    const clean = searchQuery.toLowerCase();
    
    // Core categories
    const categories = ['Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'];
    const matchingCategories = categories
      .filter(c => c.toLowerCase().startsWith(clean))
      .map(c => `In ${c}`);

    // Fetch AI Suggestions from store
    const aiList = aiSuggestions.map(s => s);

    // Combine category search triggers + query prefix + AI
    const combined = [...matchingCategories, ...aiList].slice(0, 7);
    setActiveSuggestions(combined);
  }, [searchQuery, aiSuggestions]);

  // Perform search automatically on query debounce
  useEffect(() => {
    if (!overlayOpen) return;
    const timer = setTimeout(() => {
      performSearch(isMock, gpsCoords);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilters, sortBy, overlayOpen, isMock, gpsCoords, performSearch]);

  // Keyboard navigation inside suggestions list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => 
        prev < activeSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => 
        prev > 0 ? prev - 1 : activeSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < activeSuggestions.length) {
        const selected = activeSuggestions[activeSuggestionIdx];
        handleSuggestionClick(selected);
      } else {
        // execute current text search
        addRecentSearch(searchQuery, user?.id);
        performSearch(isMock, gpsCoords);
      }
    } else if (e.key === 'Escape') {
      setOverlayOpen(false);
    }
  };

  const handleSuggestionClick = (selected) => {
    if (selected.startsWith('In ')) {
      const cat = selected.substring(3);
      updateFilters({ category: cat });
      setSearchQuery('');
    } else {
      setSearchQuery(selected);
    }
    addRecentSearch(selected, user?.id);
    setActiveSuggestionIdx(-1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSuggestionIdx(-1);
    inputRef.current?.focus();
  };

  // Close when clicking outside of the search container
  const handleOutsideClick = (e) => {
    if (overlayRef.current && !overlayRef.current.contains(e.target)) {
      setOverlayOpen(false);
    }
  };

  // Extract fallback recommended lists for empty state
  const getEmptyRecommendations = () => {
    const allProducts = getLocalProducts();
    
    // 1. Nearby items (if gps available)
    let nearby = [];
    if (gpsCoords) {
      nearby = allProducts
        .map(p => {
          const lat1 = gpsCoords.latitude;
          const lon1 = gpsCoords.longitude;
          const lat2 = p.latitude;
          const lon2 = p.longitude;
          if (!lat2 || !lon2) return { ...p, distance: 9999 };
          const R = 6371;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return { ...p, distance: R * c };
        })
        .sort((a,b) => a.distance - b.distance)
        .slice(0, 4);
    }

    // 2. Similar category items
    const searchedCategory = searchFilters.category !== 'All' ? searchFilters.category : 'Cameras';
    const similar = allProducts.filter(p => p.category === searchedCategory && p.is_available).slice(0, 4);

    // 3. Recently viewed
    const viewedIds = getLocalRecentlyViewed(user?.id);
    const recentlyViewed = allProducts.filter(p => viewedIds.includes(p.id)).slice(0, 4);

    // 4. Handpicked/Trending
    const trending = allProducts.filter(p => p.is_available).sort((a,b) => (b.popularity_score || 0) - (a.popularity_score || 0)).slice(0, 4);

    return { nearby, similar, recentlyViewed, trending };
  };

  const emptyRecs = getEmptyRecommendations();

  if (!overlayOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-md flex justify-center items-start overflow-y-auto p-4 md:p-6"
        onClick={handleOutsideClick}
      >
        <motion.div 
          ref={overlayRef}
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden mt-6 border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header Search Input Bar */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4 relative">
            <Search className="text-gray-400 flex-shrink-0" size={24} />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search gear, cameras, tools, locality, brand, or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-gray-900 text-lg md:text-xl font-bold outline-none placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search input"
              >
                <X size={16} />
              </button>
            )}
            <button 
              onClick={() => setOverlayOpen(false)}
              className="flex-shrink-0 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all"
              aria-label="Close search overlay"
            >
              Esc to Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Left Column: Recent, Trending, AI Suggestions */}
            <div className="p-6 space-y-6 lg:col-span-1 bg-gray-50/20">
              
              {/* Active / AI Suggestions list */}
              {activeSuggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-wider">
                    <Sparkles size={12} /> AI Suggestions
                  </div>
                  <div className="space-y-1">
                    {activeSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(item)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                          idx === activeSuggestionIdx 
                            ? 'bg-primary/10 text-primary border-l-4 border-primary pl-4' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item}</span>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent searches history */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <History size={12} /> Recent Searches
                  </div>
                  {recentSearches.length > 0 && (
                    <button 
                      onClick={() => clearRecentSearches(user?.id)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {recentSearches.length === 0 ? (
                  <p className="text-xs text-gray-400 italic px-1">No recent searches</p>
                ) : (
                  <div className="space-y-1.5">
                    {recentSearches.map((term, idx) => (
                      <div key={idx} className="flex items-center justify-between hover:bg-gray-100 p-2 rounded-lg group">
                        <button
                          onClick={() => {
                            setSearchQuery(term);
                            addRecentSearch(term, user?.id);
                          }}
                          className="text-xs font-bold text-gray-700 hover:text-primary text-left flex-1"
                        >
                          {term}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trending searches */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <Compass size={12} /> Trending Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(term);
                        addRecentSearch(term, user?.id);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-primary hover:text-white rounded-lg text-xs font-bold text-gray-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting & Filter Overrides */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Quick Sort
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'best_match', label: 'Best Match' },
                    { value: 'newest', label: 'Newest' },
                    { value: 'nearest', label: 'Nearest' },
                    { value: 'lowest_price', label: 'Low Price' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilters({ sort_by: opt.value })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        sortBy === opt.value
                          ? 'bg-navy text-white border-navy shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Columns: Search results & advanced filters */}
            <div className="p-6 lg:col-span-3 flex flex-col min-h-[50vh] overflow-y-auto">
              
              {/* Category selector chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-gray-100 scrollbar-none">
                {['All', 'Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateFilters({ category: cat })}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      searchFilters.category === cat
                        ? 'bg-primary text-white shadow-md font-black'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-amber-50 text-amber-700 text-xs font-bold p-3 rounded-2xl mb-4 border border-amber-100 flex items-center gap-2">
                  <RefreshCcw size={14} className="animate-spin" />
                  <span>{error}</span>
                </div>
              )}

              {/* Grid Output */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-white rounded-[2rem] p-3 border border-gray-100 shadow-sm">
                      <Skeleton className="w-full aspect-[4/3] rounded-xl mb-3" />
                      <Skeleton className="w-3/4 h-4 mb-2" />
                      <Skeleton className="w-1/2 h-4" />
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                
                /* Custom Robust Empty State: Recommended items panels */
                <div className="space-y-8 flex-1">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
                      <Search size={24} />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-base">No direct matches found</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                      We couldn't find items matching your search filter. Explore similar alternatives nearby.
                    </p>
                  </div>

                  {/* 1. Similar items */}
                  {emptyRecs.similar.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass size={14} className="text-primary" /> Similar Category Alternatives
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {emptyRecs.similar.map(item => (
                          <Link 
                            to={`/products/${item.id}`} 
                            key={item.id}
                            onClick={() => {
                              logSearchClick(item.id, isMock);
                              setOverlayOpen(false);
                            }}
                            className="bg-white border border-gray-100 rounded-2xl p-2.5 hover:shadow-md transition-shadow flex flex-col h-full group"
                          >
                            <img src={Array.isArray(item.images) ? item.images[0] : item.images} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-xl mb-2" />
                            <h5 className="font-bold text-xs text-gray-900 truncate group-hover:text-primary transition-colors">{item.title}</h5>
                            <span className="text-[10px] text-gray-500 font-extrabold mt-1">${item.price_per_day}/day</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Nearby Alternative Items */}
                  {gpsCoords && emptyRecs.nearby.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={14} className="text-amber-500" /> Nearby Items
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {emptyRecs.nearby.map(item => (
                          <Link 
                            to={`/products/${item.id}`} 
                            key={item.id}
                            onClick={() => {
                              logSearchClick(item.id, isMock);
                              setOverlayOpen(false);
                            }}
                            className="bg-white border border-gray-100 rounded-2xl p-2.5 hover:shadow-md transition-shadow flex flex-col h-full group"
                          >
                            <img src={Array.isArray(item.images) ? item.images[0] : item.images} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-xl mb-2" />
                            <h5 className="font-bold text-xs text-gray-900 truncate group-hover:text-primary transition-colors">{item.title}</h5>
                            <span className="text-[10px] text-primary font-bold mt-1 flex items-center gap-0.5"><MapPin size={10} /> {item.distance ? `${item.distance.toFixed(1)} km` : 'Local'}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Recently Viewed */}
                  {emptyRecs.recentlyViewed.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <History size={14} className="text-blue-500" /> Recently Viewed
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {emptyRecs.recentlyViewed.map(item => (
                          <Link 
                            to={`/products/${item.id}`} 
                            key={item.id}
                            onClick={() => {
                              logSearchClick(item.id, isMock);
                              setOverlayOpen(false);
                            }}
                            className="bg-white border border-gray-100 rounded-2xl p-2.5 hover:shadow-md transition-shadow flex flex-col h-full group"
                          >
                            <img src={Array.isArray(item.images) ? item.images[0] : item.images} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-xl mb-2" />
                            <h5 className="font-bold text-xs text-gray-900 truncate group-hover:text-primary transition-colors">{item.title}</h5>
                            <span className="text-[10px] text-gray-500 font-extrabold mt-1">${item.price_per_day}/day</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                
                /* Render Search Results Grid */
                <div className="space-y-6 flex-1">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Showing {searchResults.length} matches</span>
                    {searchQuery && (
                      <span className="text-primary">Matched for "{searchQuery}"</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {searchResults.map(product => {
                      const image = Array.isArray(product.images) && product.images.length > 0 
                        ? product.images[0] 
                        : (product.images || 'https://via.placeholder.com/400x300?text=No+Image');
                      const isOwnerVerified = product.owner?.kyc_verified === true;
                      
                      return (
                        <TiltCard scaleOnHover={1.02} key={product.id}>
                          <div className="group bg-white rounded-3xl p-3 border border-gray-150 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative">
                            <Link 
                              to={`/products/${product.id}`} 
                              onClick={() => {
                                logSearchClick(product.id, isMock);
                                setOverlayOpen(false);
                              }}
                              className="absolute inset-0 z-10"
                            />
                            
                            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3 relative">
                              <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              {product.delivery_available && (
                                <span className="absolute top-2 left-2 bg-navy text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
                                  📦 Delivery
                                </span>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col px-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{product.category}</span>
                                {product.brand && (
                                  <span className="text-[9px] font-extrabold text-navy px-1.5 py-0.5 bg-gray-100 rounded-md flex items-center gap-0.5">
                                    <Tag size={8} /> {product.brand}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-gray-900 text-sm mt-1 leading-tight group-hover:text-primary transition-colors line-clamp-2">{product.title}</h4>
                              
                              <div className="flex items-center text-gray-400 text-[10px] mt-1 mb-3 gap-1">
                                <MapPin size={10} className="flex-shrink-0" />
                                <span className="truncate">{product.location || 'Local Area'}</span>
                              </div>

                              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-base font-black text-slate-900">${product.price_per_day}</span>
                                  <span className="text-[10px] font-bold text-gray-400">/day</span>
                                </div>
                                
                                {product.owner && (
                                  <div className="flex items-center gap-1">
                                    <div className="text-right">
                                      <div className="flex items-center gap-0.5 justify-end">
                                        <Star size={10} className="text-amber-400 fill-current" />
                                        <span className="text-[10px] font-black text-gray-700">{product.owner.rating_average || '0.0'}</span>
                                      </div>
                                      <span className="text-[8px] text-gray-400 block">({product.owner.rating_count} reviews)</span>
                                    </div>
                                    {isOwnerVerified && <ShieldCheck size={14} className="text-primary flex-shrink-0" title="Verified Owner" />}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TiltCard>
                      );
                    })}
                  </div>
                </div>

              )}

            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SearchOverlay;
