import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { localGetPersonalizedFeed, logLocalUserActivity } from '../utils/localDb';

const useRecommendationStore = create((set, get) => ({
  feed: {
    recommendedForYou: [],
    trendingNearYou: [],
    similarToRecentlyViewed: [],
    becauseYouRented: [],
    bestRatedNearby: [],
    newListingsAroundYou: [],
    weekendPicks: [],
    budgetFriendly: [],
    premiumCollection: []
  },
  loading: false,
  error: null,

  // Fetch feed with support for online/offline and lat/lng
  fetchRecommendationFeed: async (userId, isMock, lat, lng) => {
    set({ loading: true, error: null });

    if (isMock) {
      try {
        const localFeed = localGetPersonalizedFeed(userId, lat, lng);
        set({ feed: localFeed, loading: false });
      } catch (err) {
        set({ error: err.message, loading: false });
      }
      return;
    }

    try {
      // Get the current token from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const queryParams = new URLSearchParams();
      if (lat) queryParams.append('lat', lat);
      if (lng) queryParams.append('lng', lng);

      const url = `/api/v1/recommendations/feed?${queryParams.toString()}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.feed) {
        set({ feed: resJson.feed, loading: false });
      } else {
        throw new Error('Invalid feed response format');
      }
    } catch (err) {
      console.warn('[Recommendation Store] Online fetch failed, falling back to local simulation:', err.message);
      try {
        // Double fallback: use offline local recommendation calculations so user never sees white screen/crash!
        const fallbackFeed = localGetPersonalizedFeed(userId, lat, lng);
        set({ feed: fallbackFeed, loading: false });
      } catch (fallbackErr) {
        set({ error: fallbackErr.message, loading: false });
      }
    }
  },

  // Track click or conversion events
  logActivity: async (userId, isMock, productId, activityType, category) => {
    // Log to local storage unconditionally so we have a persistent history
    try {
      logLocalUserActivity(userId, activityType, productId, category);
    } catch (e) {
      console.warn('Logging local user activity failed:', e);
    }

    if (isMock) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/v1/recommendations/activity', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: productId,
          activity_type: activityType,
          category
        })
      });
    } catch (err) {
      console.debug('Logging online user activity failed:', err.message);
    }
  }
}));

export default useRecommendationStore;
