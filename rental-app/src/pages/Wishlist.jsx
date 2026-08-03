import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, Trash2, ArrowUpDown, Grid, List, MapPin, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import TiltCard from '../components/TiltCard';
import useAuthStore from '../store/authStore';
import { wishlistService } from '../api/wishlistService';
import { getLocalWishlist, saveLocalWishlist, getLocalProducts } from '../utils/localDb';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Recently Saved' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const Wishlist = () => {
  const { user, token, isMock } = useAuthStore();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [layoutMode, setLayoutMode] = useState('grid');
  
  // Confirm Clear All Modal State
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Fetch Wishlist Items
  const fetchWishlist = useCallback(async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (token && !isMock) {
        const res = await wishlistService.getWishlist(token);
        if (res.success && Array.isArray(res.data)) {
          setWishlistItems(res.data);
          setLoading(false);
          return;
        }
      }

      // Fallback local storage lookup
      const savedIds = getLocalWishlist(user.id);
      const allProds = getLocalProducts();
      const matched = allProds.filter(p => savedIds.includes(p.id));
      setWishlistItems(matched);
    } catch (err) {
      setError(err.message || 'Failed to load saved items.');
      const savedIds = getLocalWishlist(user.id);
      const allProds = getLocalProducts();
      setWishlistItems(allProds.filter(p => savedIds.includes(p.id)));
    } finally {
      setLoading(false);
    }
  }, [user, token, isMock, navigate]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Filter & Sort Logic
  useEffect(() => {
    let result = [...wishlistItems];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));
    } else {
      // Newest
      result.sort((a, b) => new Date(b.created_at || b.saved_at) - new Date(a.created_at || a.saved_at));
    }

    setFilteredItems(result);
  }, [wishlistItems, searchQuery, sortBy]);

  // Remove Single Item Optimistically
  const handleRemoveItem = async (productId, e) => {
    if (e) e.preventDefault();
    const updated = wishlistItems.filter(item => item.id !== productId);
    setWishlistItems(updated);

    // Sync local DB
    if (user?.id) {
      saveLocalWishlist(user.id, updated.map(u => u.id));
    }

    if (token && !isMock) {
      try {
        await wishlistService.removeFromWishlist(token, productId);
      } catch (err) {
        console.error('Failed to sync remove from server:', err);
      }
    }
  };

  // Confirm Clear All Wishlist
  const handleConfirmClearAll = async () => {
    setClearing(true);
    setWishlistItems([]);

    if (user?.id) {
      saveLocalWishlist(user.id, []);
    }

    if (token && !isMock) {
      try {
        await wishlistService.clearWishlist(token);
      } catch (err) {
        console.error('Failed to sync clear wishlist from server:', err);
      }
    }

    setClearing(false);
    setShowClearModal(false);
  };

  const getItemImage = (item) => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (typeof item.images === 'string') return item.images;
    return 'https://via.placeholder.com/400x300?text=No+Image';
  };

  return (
    <AnimatedPage>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-navy to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <Heart size={36} className="text-red-400 fill-red-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  Saved Items <span className="text-xs font-black bg-white/20 text-white px-3 py-1 rounded-full">{wishlistItems.length} Saved</span>
                </h1>
                <p className="text-gray-300 text-sm mt-1">Your curated personal equipment rental collection.</p>
              </div>
            </div>

            {wishlistItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="px-5 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 rounded-2xl text-xs font-black transition-all flex items-center gap-2"
              >
                <Trash2 size={16} /> Clear All Saved
              </button>
            )}
          </div>

          {/* Controls Bar */}
          {wishlistItems.length > 0 && (
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* In-page Search */}
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inside saved items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Sort & Layout View Toggle */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-2xl flex-1 md:flex-none">
                  <ArrowUpDown size={14} className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-gray-50 p-1 border border-gray-200 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('grid')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${
                      layoutMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('list')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${
                      layoutMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm">
                  <Skeleton className="w-full aspect-[4/3] mb-4 rounded-2xl" />
                  <Skeleton variant="text" className="w-3/4 mb-3" />
                  <Skeleton variant="text" className="w-1/2 mb-4" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={searchQuery ? "No matching saved items" : "Your Saved Items list is empty"}
              message={searchQuery ? `No items matched "${searchQuery}". Try clearing search.` : "Keep track of gear you love by tapping the heart icon on any listing card."}
              actionLabel={searchQuery ? "Clear Search" : "Explore Rental Catalog"}
              onAction={() => {
                if (searchQuery) setSearchQuery('');
                else navigate('/products');
              }}
            />
          ) : (
            <div>
              {layoutMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {filteredItems.map(item => {
                      const image = getItemImage(item);
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="h-full"
                        >
                          <TiltCard scaleOnHover={1.03}>
                            <div className="group bg-white rounded-[2rem] p-4 border border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full relative">
                              <Link to={`/products/${item.id}`} className="absolute inset-0 z-0"></Link>

                              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 relative z-10">
                                <img src={image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveItem(item.id, e)}
                                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-500 p-2 rounded-full shadow-md z-30 transition-transform active:scale-95 hover:scale-110"
                                  title="Remove from saved wishlist"
                                >
                                  <Heart size={16} className="fill-red-500" />
                                </button>

                                {!item.is_available && (
                                  <div className="absolute top-3 left-3 bg-red-500/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                    Currently Rented
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col px-2 relative z-10">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">{item.category}</span>
                                <h3 className="font-extrabold text-gray-900 text-base leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>

                                <div className="flex items-center text-gray-400 text-xs mt-1 mb-4 gap-1.5">
                                  <MapPin size={13} className="flex-shrink-0" />
                                  <span className="truncate">{item.location || 'Local Area'}</span>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-gray-900">${item.price_per_day}</span>
                                    <span className="text-xs text-gray-500 font-bold uppercase">/day</span>
                                  </div>
                                  <Link
                                    to={`/products/${item.id}`}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all"
                                  >
                                    Rent Now
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </TiltCard>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredItems.map(item => {
                      const image = getItemImage(item);
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 relative group hover:shadow-md"
                        >
                          <Link to={`/products/${item.id}`} className="absolute inset-0 z-0"></Link>
                          <div className="w-full sm:w-48 aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 relative z-10">
                            <img src={image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between relative z-10 py-1">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</span>
                                  <h3 className="font-extrabold text-gray-900 text-lg">{item.title}</h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveItem(item.id, e)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                  <Heart size={18} className="fill-red-500" />
                                </button>
                              </div>
                              <p className="text-gray-500 text-xs line-clamp-2 mt-1">{item.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-gray-900">${item.price_per_day}</span>
                                <span className="text-xs text-gray-500 font-bold">/day</span>
                              </div>
                              <Link
                                to={`/products/${item.id}`}
                                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-sm"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Confirm Clear All Modal */}
          <AnimatePresence>
            {showClearModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowClearModal(false)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-center border border-gray-100"
                >
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Clear All Saved Items?</h3>
                  <p className="text-xs text-gray-500">This will remove all {wishlistItems.length} items from your personal saved collection.</p>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClearModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={clearing}
                      onClick={handleConfirmClearAll}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20"
                    >
                      {clearing ? 'Clearing...' : 'Yes, Clear All'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default Wishlist;
