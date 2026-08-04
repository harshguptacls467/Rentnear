import { MOCK_PRODUCTS, MOCK_BOOKINGS, MOCK_REVIEWS } from '../data/mockData';

const memoryStorage = {};

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStorage[key] || null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStorage[key] = value;
  }
};

export const getLocalProducts = () => {
  const data = safeGetItem('rentnear_local_products');
  if (!data) {
    safeSetItem('rentnear_local_products', JSON.stringify(MOCK_PRODUCTS));
    return MOCK_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_PRODUCTS;
  }
};

export const saveLocalProducts = (products) => {
  safeSetItem('rentnear_local_products', JSON.stringify(products));
};

export const getLocalBookings = () => {
  const data = safeGetItem('rentnear_local_bookings');
  if (!data) {
    safeSetItem('rentnear_local_bookings', JSON.stringify(MOCK_BOOKINGS));
    return MOCK_BOOKINGS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_BOOKINGS;
  }
};

export const saveLocalBookings = (bookings) => {
  safeSetItem('rentnear_local_bookings', JSON.stringify(bookings));
};

export const getLocalUsers = () => {
  const data = safeGetItem('rentnear_local_users');
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

export const saveLocalUsers = (users) => {
  safeSetItem('rentnear_local_users', JSON.stringify(users));
};

export const getLocalReviews = () => {
  const data = safeGetItem('rentnear_local_reviews');
  if (!data) {
    safeSetItem('rentnear_local_reviews', JSON.stringify(MOCK_REVIEWS));
    return MOCK_REVIEWS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_REVIEWS;
  }
};

export const saveLocalReviews = (reviews) => {
  safeSetItem('rentnear_local_reviews', JSON.stringify(reviews));
};

// Wishlist Helpers
export const getLocalWishlist = (userId) => {
  const key = `rentnear_wishlist_${userId || 'anonymous'}`;
  const data = safeGetItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLocalWishlist = (userId, wishlist) => {
  const key = `rentnear_wishlist_${userId || 'anonymous'}`;
  safeSetItem(key, JSON.stringify(wishlist));
};

// Recently Viewed Helpers
export const getLocalRecentlyViewed = (userId) => {
  const key = `rentnear_recent_viewed_${userId || 'anonymous'}`;
  const data = safeGetItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLocalRecentlyViewed = (userId, items) => {
  const key = `rentnear_recent_viewed_${userId || 'anonymous'}`;
  safeSetItem(key, JSON.stringify(items));
};

// Saved Searches Helpers
export const getLocalSavedSearches = (userId) => {
  const key = `rentnear_saved_searches_${userId || 'anonymous'}`;
  const data = safeGetItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLocalSavedSearches = (userId, searches) => {
  const key = `rentnear_saved_searches_${userId || 'anonymous'}`;
  safeSetItem(key, JSON.stringify(searches));
};

// KYC Submissions Helpers
export const getLocalKycSubmissions = () => {
  const data = safeGetItem('rentnear_local_kyc_submissions');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveLocalKycSubmissions = (submissions) => {
  safeSetItem('rentnear_local_kyc_submissions', JSON.stringify(submissions));
};

// Geodistance helper for local offline search
const localHaversineKm = (lat1, lon1, lat2, lon2) => {
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

// Intelligent search offline implementation
export const localSearchProducts = (params = {}) => {
  const {
    q, search, category, brand, city, locality, tags,
    price_min, price_max, distance_max, rating_min, condition,
    delivery_available, deposit_min, deposit_max, owner_verified,
    sort_by = 'best_match', lat, lng, limit = 20, offset = 0
  } = params;

  const searchQuery = (q || search || '').trim().toLowerCase();
  const allProds = getLocalProducts();
  let results = allProds.filter(p => p.is_available !== false);

  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  const hasCoords = !isNaN(centerLat) && !isNaN(centerLng);

  // 1. Calculate Geodistance
  results = results.map(p => {
    const dist = hasCoords ? localHaversineKm(centerLat, centerLng, p.latitude, p.longitude) : null;
    return {
      ...p,
      distance_km: dist !== null ? parseFloat(dist.toFixed(2)) : null
    };
  });

  // 2. Filters
  if (category && category !== 'All') {
    results = results.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (brand) {
    results = results.filter(p => p.brand?.toLowerCase().includes(brand.toLowerCase()));
  }
  if (city) {
    results = results.filter(p => p.city?.toLowerCase() === city.toLowerCase());
  }
  if (locality) {
    results = results.filter(p => p.locality?.toLowerCase().includes(locality.toLowerCase()));
  }
  if (tags) {
    const tagList = (Array.isArray(tags) ? tags : [tags]).map(t => String(t).toLowerCase());
    results = results.filter(p => {
      const prodTags = (p.tags || []).map(t => String(t).toLowerCase());
      return tagList.some(t => prodTags.includes(t));
    });
  }
  if (price_min) {
    results = results.filter(p => parseFloat(p.price_per_day) >= parseFloat(price_min));
  }
  if (price_max) {
    results = results.filter(p => parseFloat(p.price_per_day) <= parseFloat(price_max));
  }
  if (deposit_min) {
    results = results.filter(p => parseFloat(p.deposit_amount || 0) >= parseFloat(deposit_min));
  }
  if (price_max) {
    results = results.filter(p => parseFloat(p.price_per_day) <= parseFloat(price_max));
  }
  if (deposit_max) {
    results = results.filter(p => parseFloat(p.deposit_amount || 0) <= parseFloat(deposit_max));
  }
  if (distance_max && hasCoords) {
    results = results.filter(p => p.distance_km !== null && p.distance_km <= parseFloat(distance_max));
  }
  if (rating_min) {
    results = results.filter(p => (p.owner_rating_average || p.owner?.rating_average || 0) >= parseFloat(rating_min));
  }
  if (condition && condition !== 'All') {
    results = results.filter(p => p.condition?.toLowerCase() === condition.toLowerCase());
  }
  if (delivery_available === 'true' || delivery_available === true) {
    results = results.filter(p => p.delivery_available === true);
  }
  if (owner_verified === 'true' || owner_verified === true) {
    results = results.filter(p => p.owner_kyc_verified === true || p.owner?.kyc_verified === true);
  }

  // 3. Multi-axis Smart Ranking Scoring
  results = results.map(item => {
    let score = 0;
    if (searchQuery) {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const brandName = (item.brand || '').toLowerCase();
      const tagsArr = Array.isArray(item.tags) ? item.tags : [];

      if (title === searchQuery) score += 200;
      else if (title.includes(searchQuery)) score += 80;

      if (brandName === searchQuery) score += 100;
      else if (brandName.includes(searchQuery)) score += 40;

      if (desc.includes(searchQuery)) score += 30;

      // Word by word matching
      const words = searchQuery.split(/\s+/).filter(w => w.length > 1);
      words.forEach(word => {
        if (title.includes(word)) score += 20;
        if (brandName.includes(word)) score += 15;
        if (desc.includes(word)) score += 5;
        if (tagsArr.some(t => String(t).toLowerCase().includes(word))) score += 25;
      });
    } else {
      score += 50;
    }

    if (item.is_available) score += 50;

    const trust = Number(item.owner_trust_score || item.owner?.trust_score || 100);
    score += (trust / 10);

    const ratingAvg = Number(item.owner_rating_average || item.owner?.rating_average || 0);
    score += (ratingAvg * 8);

    const popularity = Number(item.views_count || 0) + Number(item.popularity_score || 0);
    score += Math.min(popularity * 0.1, 20);

    if (item.distance_km !== null) {
      score -= Math.min(item.distance_km * 2, 50);
    }

    return { ...item, ranking_score: score };
  });

  // 4. Sorting
  if (sort_by === 'newest') {
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sort_by === 'nearest') {
    results.sort((a, b) => {
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
  } else if (sort_by === 'lowest_price') {
    results.sort((a, b) => parseFloat(a.price_per_day) - parseFloat(b.price_per_day));
  } else if (sort_by === 'highest_rated') {
    results.sort((a, b) => (b.owner_rating_average || b.owner?.rating_average || 0) - (a.owner_rating_average || a.owner?.rating_average || 0));
  } else {
    // best_match (default)
    results.sort((a, b) => b.ranking_score - a.ranking_score);
  }

  // 5. Pagination
  const limitNum = parseInt(limit, 10) || 20;
  const offsetNum = parseInt(offset, 10) || 0;
  const paginated = results.slice(offsetNum, offsetNum + limitNum);

  return {
    data: paginated,
    total_count: results.length,
    has_more: offsetNum + limitNum < results.length
  };
};
