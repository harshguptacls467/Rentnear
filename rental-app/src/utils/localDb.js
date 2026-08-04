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

// Log user activity local helper
export const logLocalUserActivity = (userId, activityType, productId, category) => {
  const key = 'rentnear_local_user_activity';
  const data = safeGetItem(key);
  let logs = [];
  try {
    logs = data ? JSON.parse(data) : [];
  } catch {
    logs = [];
  }

  logs.push({
    id: Math.random().toString(36).substring(2, 9),
    user_id: userId || 'guest',
    activity_type: activityType,
    product_id: productId,
    category: category,
    created_at: new Date().toISOString()
  });

  // Limit logs to last 100 to prevent localstorage bloat
  if (logs.length > 100) {
    logs = logs.slice(logs.length - 100);
  }
  safeSetItem(key, JSON.stringify(logs));
  
  // If activity is 'rent', update implicit preferences
  if (userId && activityType === 'rent' && productId) {
    const prefKey = `rentnear_local_user_preferences_${userId}`;
    const prefData = safeGetItem(prefKey);
    let prefs = { favorite_categories: [], preferred_price_min: 0, preferred_price_max: 300 };
    try {
      if (prefData) prefs = JSON.parse(prefData);
    } catch {}

    if (category && !prefs.favorite_categories.includes(category.toLowerCase())) {
      prefs.favorite_categories.push(category.toLowerCase());
    }
    const allProds = getLocalProducts();
    const prod = allProds.find(p => p.id === productId);
    if (prod) {
      const price = parseFloat(prod.price_per_day);
      prefs.preferred_price_min = Math.max(price * 0.5, 0);
      prefs.preferred_price_max = price * 2.0;
    }
    safeSetItem(prefKey, JSON.stringify(prefs));
  }
};

// Get local offline recommendations feed
export const localGetPersonalizedFeed = (userId, lat, lng) => {
  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  const hasCoords = !isNaN(centerLat) && !isNaN(centerLng);

  const allProds = getLocalProducts();
  // Filter active products
  let activeProducts = allProds.filter(p => p.is_available !== false);

  // Calculate geodistances locally
  activeProducts = activeProducts.map(p => {
    let dist = null;
    if (hasCoords && p.latitude && p.longitude) {
      dist = localHaversineKm(centerLat, centerLng, parseFloat(p.latitude), parseFloat(p.longitude));
    }
    return {
      ...p,
      distance_km: dist !== null ? parseFloat(dist.toFixed(2)) : null
    };
  });

  // Load local activity preferences
  let viewedCategories = new Set();
  let lastViewedProductIds = new Set();
  let lastBookingCategory = null;
  let preferredPriceMin = 0;
  let preferredPriceMax = 300;
  let isColdStart = true;

  if (userId) {
    const actKey = 'rentnear_local_user_activity';
    const actData = safeGetItem(actKey);
    try {
      const logs = actData ? JSON.parse(actData) : [];
      const userLogs = logs.filter(log => log.user_id === userId);
      
      if (userLogs.length > 0) {
        isColdStart = false;
        let sumPrices = 0;
        let countPrices = 0;

        userLogs.forEach(log => {
          if (log.category) viewedCategories.add(log.category.toLowerCase());
          if (log.product_id) lastViewedProductIds.add(log.product_id);
          if (log.activity_type === 'rent' && log.category) {
            lastBookingCategory = log.category.toLowerCase();
          }
        });

        // Find average prices
        const matched = activeProducts.filter(p => lastViewedProductIds.has(p.id));
        matched.forEach(p => {
          sumPrices += parseFloat(p.price_per_day) || 0;
          countPrices++;
        });

        if (countPrices > 0) {
          const avg = sumPrices / countPrices;
          preferredPriceMin = Math.max(avg * 0.6, 0);
          preferredPriceMax = avg * 1.5;
        }
      }
    } catch {}

    const prefKey = `rentnear_local_user_preferences_${userId}`;
    const prefData = safeGetItem(prefKey);
    try {
      if (prefData) {
        const prefs = JSON.parse(prefData);
        isColdStart = false;
        if (Array.isArray(prefs.favorite_categories)) {
          prefs.favorite_categories.forEach(c => viewedCategories.add(c.toLowerCase()));
        }
        if (prefs.preferred_price_min !== undefined) preferredPriceMin = parseFloat(prefs.preferred_price_min);
        if (prefs.preferred_price_max !== undefined) preferredPriceMax = parseFloat(prefs.preferred_price_max);
      }
    } catch {}
  }

  // Score products
  const scoredProducts = activeProducts.map(p => {
    let score = 0;
    const categoryClean = (p.category || '').toLowerCase();

    if (!isColdStart) {
      if (viewedCategories.has(categoryClean)) score += 60;
      const price = parseFloat(p.price_per_day) || 0;
      if (price >= preferredPriceMin && price <= preferredPriceMax) {
        score += 30;
      } else if (price >= preferredPriceMin * 0.8 && price <= preferredPriceMax * 1.2) {
        score += 10;
      } else {
        score -= 10;
      }
    } else {
      score += 20;
    }

    if (p.distance_km !== null) {
      if (p.distance_km <= 5) score += 50;
      else if (p.distance_km <= 15) score += 30;
      else if (p.distance_km <= 50) score += 10;
      else if (p.distance_km > 100) score -= 20;
    }

    const ratingAvg = Number(p.owner_rating_average || p.owner?.rating_average || 0);
    const ratingCount = Number(p.owner_rating_count || p.owner?.rating_count || 0);
    score += (ratingAvg * 8);
    score += Math.min(ratingCount * 0.5, 15);

    const views = Number(p.views_count || 0);
    const popularity = Number(p.popularity_score || 0);
    score += Math.min(views * 0.1, 20);
    score += Math.min(popularity * 0.2, 20);

    const trust = Number(p.owner_trust_score || p.owner?.trust_score || 100);
    score += (trust / 10);
    if (p.owner?.kyc_verified || p.kyc_verified) score += 15;

    const ageInDays = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(20 - ageInDays, 0);

    return {
      ...p,
      recommendation_score: parseFloat(score.toFixed(2))
    };
  });

  const sortByScoreDesc = (a, b) => b.recommendation_score - a.recommendation_score;

  // Build recommendation sections
  const recommendedForYou = [...scoredProducts].sort(sortByScoreDesc).slice(0, 8);

  const trendingNearYou = [...scoredProducts]
    .filter(p => p.distance_km === null || p.distance_km <= 50)
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 8);

  let similarToRecentlyViewed = [];
  if (viewedCategories.size > 0) {
    similarToRecentlyViewed = [...scoredProducts]
      .filter(p => viewedCategories.has((p.category || '').toLowerCase()) && !lastViewedProductIds.has(p.id))
      .sort(sortByScoreDesc)
      .slice(0, 8);
  } else {
    similarToRecentlyViewed = [...scoredProducts].filter(p => p.category === 'Cameras').slice(0, 8);
  }

  let companionCategory = 'Sports';
  if (lastBookingCategory) {
    if (lastBookingCategory.includes('camera')) companionCategory = 'Electronics';
    else if (lastBookingCategory.includes('bike')) companionCategory = 'Sports';
    else if (lastBookingCategory.includes('tool')) companionCategory = 'Other';
  }
  const becauseYouRented = [...scoredProducts]
    .filter(p => (p.category || '').toLowerCase() === companionCategory.toLowerCase())
    .sort(sortByScoreDesc)
    .slice(0, 8);

  const bestRatedNearby = [...scoredProducts]
    .filter(p => p.distance_km === null || p.distance_km <= 50)
    .sort((a, b) => {
      const rA = a.owner_rating_average || a.owner?.rating_average || 0;
      const rB = b.owner_rating_average || b.owner?.rating_average || 0;
      return rB - rA;
    })
    .slice(0, 8);

  const newListingsAroundYou = [...scoredProducts]
    .filter(p => p.distance_km === null || p.distance_km <= 100)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  const weekendPicks = [...scoredProducts]
    .filter(p => ['speakers', 'sports', 'gaming', 'outdoors', 'bikes'].includes((p.category || '').toLowerCase()))
    .sort((a, b) => (b.owner_rating_average || b.owner?.rating_average || 0) - (a.owner_rating_average || a.owner?.rating_average || 0))
    .slice(0, 8);

  const budgetFriendly = [...scoredProducts]
    .filter(p => parseFloat(p.price_per_day) <= 20)
    .sort(sortByScoreDesc)
    .slice(0, 8);

  const premiumCollection = [...scoredProducts]
    .filter(p => parseFloat(p.price_per_day) >= 40 && (p.owner_rating_average || p.owner?.rating_average || 0) >= 4.5)
    .sort(sortByScoreDesc)
    .slice(0, 8);

  return {
    recommendedForYou,
    trendingNearYou,
    similarToRecentlyViewed,
    becauseYouRented,
    bestRatedNearby,
    newListingsAroundYou,
    weekendPicks,
    budgetFriendly,
    premiumCollection
  };
};

