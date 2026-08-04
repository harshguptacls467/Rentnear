import { create } from 'zustand';
import { localSearchProducts } from '../utils/localDb';

export const useSearchStore = create((set, get) => ({
  searchQuery: '',
  searchFilters: {
    category: 'All',
    brand: '',
    city: '',
    locality: '',
    price_min: '',
    price_max: '300',
    distance_max: '100',
    rating_min: '0',
    condition: 'All',
    delivery_available: false,
    deposit_min: '',
    deposit_max: '300',
    owner_verified: false,
  },
  sortBy: 'best_match',
  searchResults: [],
  totalCount: 0,
  hasMore: false,
  nextCursor: null,
  recentSearches: [],
  trendingSearches: [],
  aiSuggestions: [],
  loading: false,
  error: '',
  overlayOpen: false,
  searchLogId: null, // to track CTR precisely

  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setOverlayOpen: (open) => set({ overlayOpen: open }),
  
  updateFilters: (fields) => set((state) => ({
    searchFilters: { ...state.searchFilters, ...fields }
  })),

  resetFilters: () => set({
    searchFilters: {
      category: 'All',
      brand: '',
      city: '',
      locality: '',
      price_min: '',
      price_max: '300',
      distance_max: '100',
      rating_min: '0',
      condition: 'All',
      delivery_available: false,
      deposit_min: '',
      deposit_max: '300',
      owner_verified: false,
    },
    sortBy: 'best_match'
  }),

  setSortBy: (sortBy) => set({ sortBy }),

  // Fetch recent searches from localStorage on initialization
  loadRecentSearches: (userId) => {
    const key = `rentnear_recent_searches_${userId || 'anonymous'}`;
    try {
      const data = localStorage.getItem(key);
      set({ recentSearches: data ? JSON.parse(data) : [] });
    } catch {
      set({ recentSearches: [] });
    }
  },

  addRecentSearch: (query, userId) => {
    const clean = (query || '').trim();
    if (!clean) return;
    const current = [...get().recentSearches];
    const filtered = current.filter((s) => s.toLowerCase() !== clean.toLowerCase());
    filtered.unshift(clean);
    const updated = filtered.slice(0, 5); // cap at 5
    set({ recentSearches: updated });
    
    const key = `rentnear_recent_searches_${userId || 'anonymous'}`;
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e.message);
    }
  },

  clearRecentSearches: (userId) => {
    set({ recentSearches: [] });
    const key = `rentnear_recent_searches_${userId || 'anonymous'}`;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage remove failed:', e.message);
    }
  },

  // Fetch trending searches from API or local fallback
  fetchTrendingSearches: async (isMock) => {
    if (isMock) {
      set({ trendingSearches: ['Sony A7', 'Mountain Bike', 'DeWalt Drill', 'JBL Speaker', 'PS5 Consoles'] });
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/products/search/trending`);
      const d = await res.json();
      if (d.success && d.trending) {
        set({ trendingSearches: d.trending });
      }
    } catch {
      set({ trendingSearches: ['Sony A7', 'Mountain Bike', 'DeWalt Drill', 'JBL Speaker', 'PS5 Consoles'] });
    }
  },

  // Perform Intelligent Search API
  performSearch: async (isMock, userCoords = null, loadMore = false) => {
    set({ loading: true, error: '' });
    const state = get();
    const queryStr = state.searchQuery;
    const filters = state.searchFilters;
    const sortBy = state.sortBy;
    const currentCursor = loadMore ? state.nextCursor : null;

    // 1. Offline fallback check
    if (isMock) {
      // Build offline query params
      const searchParams = {
        q: queryStr,
        category: filters.category,
        brand: filters.brand,
        city: filters.city,
        locality: filters.locality,
        price_min: filters.price_min,
        price_max: filters.price_max,
        distance_max: filters.distance_max,
        rating_min: filters.rating_min,
        condition: filters.condition,
        delivery_available: filters.delivery_available,
        deposit_min: filters.deposit_min,
        deposit_max: filters.deposit_max,
        owner_verified: filters.owner_verified,
        sort_by: sortBy,
        lat: userCoords?.latitude,
        lng: userCoords?.longitude,
        limit: 12,
        offset: loadMore ? state.searchResults.length : 0
      };

      const result = localSearchProducts(searchParams);
      
      // Calculate basic offline AI suggestions prefix rules
      let suggestions = [];
      const cleanQ = queryStr.toLowerCase();
      if (cleanQ.includes('drill') || cleanQ.includes('tool')) {
        suggestions = ['Hammer Drill', 'Impact Drill', 'Cordless Drill'];
      } else if (cleanQ.includes('camera') || cleanQ.includes('lens')) {
        suggestions = ['Tripod', 'Memory Card', 'Lighting Kit', 'Gimbal'];
      }

      set({
        searchResults: loadMore ? [...state.searchResults, ...result.data] : result.data,
        totalCount: result.total_count,
        hasMore: result.has_more,
        nextCursor: null,
        aiSuggestions: suggestions,
        searchLogId: null,
        loading: false
      });
      return;
    }

    // 2. Online search API call
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/products/search`);
      url.searchParams.append('q', queryStr);
      url.searchParams.append('category', filters.category);
      url.searchParams.append('brand', filters.brand);
      url.searchParams.append('city', filters.city);
      url.searchParams.append('locality', filters.locality);
      url.searchParams.append('price_min', filters.price_min);
      url.searchParams.append('price_max', filters.price_max);
      url.searchParams.append('distance_max', filters.distance_max);
      url.searchParams.append('rating_min', filters.rating_min);
      url.searchParams.append('condition', filters.condition);
      url.searchParams.append('delivery_available', String(filters.delivery_available));
      url.searchParams.append('deposit_min', filters.deposit_min);
      url.searchParams.append('deposit_max', filters.deposit_max);
      url.searchParams.append('owner_verified', String(filters.owner_verified));
      url.searchParams.append('sort_by', sortBy);
      url.searchParams.append('limit', '12');

      if (userCoords?.latitude) url.searchParams.append('lat', String(userCoords.latitude));
      if (userCoords?.longitude) url.searchParams.append('lng', String(userCoords.longitude));
      if (currentCursor) url.searchParams.append('cursor', currentCursor);

      const res = await fetch(url.toString());
      const d = await res.json();

      if (d.success) {
        set({
          searchResults: loadMore ? [...state.searchResults, ...d.data] : d.data,
          totalCount: d.metadata.total_count,
          hasMore: d.metadata.has_more,
          nextCursor: d.metadata.next_cursor,
          aiSuggestions: d.metadata.ai_suggestions || [],
          searchLogId: d.metadata.search_log_id || null,
          loading: false
        });
      } else {
        throw new Error(d.error?.message || 'Search API returned failure status.');
      }
    } catch (err) {
      console.error('[Search Store Error]:', err.message);
      // Failover to local mock DB automatically if API breaks (zero-trust resilience)
      const searchParams = {
        q: queryStr,
        category: filters.category,
        sort_by: sortBy,
        lat: userCoords?.latitude,
        lng: userCoords?.longitude,
      };
      const result = localSearchProducts(searchParams);
      set({
        searchResults: loadMore ? [...state.searchResults, ...result.data] : result.data,
        totalCount: result.total_count,
        hasMore: false,
        nextCursor: null,
        error: 'Showing local catalog search (network error resolved).',
        loading: false
      });
    }
  },

  // CTR Logging click events
  logSearchClick: async (productId, isMock) => {
    const logId = get().searchLogId;
    const query = get().searchQuery;
    if (isMock) return; // skip for offline/mock sessions

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/analytics/search/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_log_id: logId,
          event_type: 'click',
          product_id: productId,
          query: query
        })
      });
    } catch (err) {
      console.warn('Logging CTR click event failed:', err.message);
    }
  },

  // Conversion Logging (triggered on booking checkout success)
  logSearchConversion: async (isMock) => {
    const logId = get().searchLogId;
    const query = get().searchQuery;
    if (isMock) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/analytics/search/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_log_id: logId,
          event_type: 'conversion',
          query: query
        })
      });
    } catch (err) {
      console.warn('Logging CTR conversion event failed:', err.message);
    }
  }
}));

export default useSearchStore;
