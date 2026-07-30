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
