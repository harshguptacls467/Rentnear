import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveFilterChips = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeChips = [];

  if (filters.category && filters.category !== 'All') {
    activeChips.push({ key: 'category', label: `Category: ${filters.category}` });
  }
  if (filters.searchQuery) {
    activeChips.push({ key: 'searchQuery', label: `Search: "${filters.searchQuery}"` });
  }
  if (filters.maxPrice < 300) {
    activeChips.push({ key: 'maxPrice', label: `Max Price: $${filters.maxPrice}` });
  }
  if (filters.maxDistance < 100) {
    activeChips.push({ key: 'maxDistance', label: `Max Distance: ${filters.maxDistance}km` });
  }
  if (filters.instantBookOnly) {
    activeChips.push({ key: 'instantBookOnly', label: '⚡ Instant Book Only' });
  }
  if (filters.condition && filters.condition !== 'All') {
    activeChips.push({ key: 'condition', label: `Condition: ${filters.condition}` });
  }
  if (filters.minRating > 0) {
    activeChips.push({ key: 'minRating', label: `Rating: ${filters.minRating}★ & above` });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">Active Filters:</span>
      
      <AnimatePresence>
        {activeChips.map(chip => (
          <motion.span
            key={chip.key}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-full shadow-sm"
          >
            {chip.label}
            <button
              type="button"
              onClick={() => onRemoveFilter(chip.key)}
              className="hover:bg-primary/20 p-0.5 rounded-full transition-colors"
              aria-label={`Remove ${chip.label}`}
            >
              <X size={12} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-extrabold rounded-full transition-all ml-1"
      >
        <RotateCcw size={12} /> Clear All
      </button>
    </div>
  );
};

export default ActiveFilterChips;
