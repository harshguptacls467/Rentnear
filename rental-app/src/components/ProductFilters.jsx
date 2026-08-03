import React from 'react';
import { SlidersHorizontal, X, Star, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'];
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair'];
const RATING_OPTIONS = [0, 4.0, 4.5, 4.8];

const ProductFilters = ({ 
  filters, 
  setFilters, 
  isOpenMobile, 
  onCloseMobile,
  onReset 
}) => {
  const handleChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const filterContent = (
    <div className="space-y-6">
      
      {/* Category Filter */}
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange('category', cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filters.category === cat 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Max Daily Rate Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Max Price / Day</label>
          <span className="text-xs font-black text-primary">${filters.maxPrice}</span>
        </div>
        <input
          type="range"
          min="10"
          max="300"
          step="5"
          value={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', Number(e.target.value))}
          className="w-full accent-primary bg-gray-100 rounded-lg appearance-none cursor-pointer h-2"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
          <span>$10</span>
          <span>$300+</span>
        </div>
      </div>

      {/* Distance Radius Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Distance Radius</label>
          <span className="text-xs font-black text-primary">{filters.maxDistance} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={filters.maxDistance}
          onChange={(e) => handleChange('maxDistance', Number(e.target.value))}
          className="w-full accent-primary bg-gray-100 rounded-lg appearance-none cursor-pointer h-2"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>

      {/* Item Condition */}
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Item Condition</label>
        <div className="grid grid-cols-3 gap-2">
          {CONDITIONS.map(cond => (
            <button
              key={cond}
              type="button"
              onClick={() => handleChange('condition', cond)}
              className={`py-2 px-3 text-center rounded-xl text-xs font-bold transition-all border ${
                filters.condition === cond 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Owner Rating */}
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Owner Rating</label>
        <div className="flex gap-2">
          {RATING_OPTIONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => handleChange('minRating', r)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                filters.minRating === r 
                  ? 'bg-amber-50 border-amber-300 text-amber-900' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 0 ? 'Any' : <><Star size={12} className="text-amber-500 fill-amber-500" /> {r}+</>}
            </button>
          ))}
        </div>
      </div>

      {/* Instant Booking Toggle */}
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500 fill-amber-500" /> Instant Book Only
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Skip owner 24-hr approval wait</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={filters.instantBookOnly}
            onChange={(e) => handleChange('instantBookOnly', e.target.checked)}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Clear Filters Action */}
      <button
        type="button"
        onClick={onReset}
        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-colors"
      >
        Reset All Filters
      </button>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Panel */}
      <div className="hidden lg:block w-72 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24 self-start">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-primary" /> Filters
          </h3>
        </div>
        {filterContent}
      </div>

      {/* Mobile Slide-Up Bottom Sheet Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-primary" /> Filter Options
                </h3>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              {filterContent}

              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full mt-6 py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-sm rounded-xl shadow-lg shadow-primary/20"
              >
                Apply Filters & Show Results
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductFilters;
