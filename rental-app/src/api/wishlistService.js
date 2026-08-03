const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const wishlistService = {
  // Fetch user's wishlist
  getWishlist: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/wishlist${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch saved wishlist items.');
    }
    return res.json();
  },

  // Save product to wishlist
  addToWishlist: async (token, productId) => {
    const res = await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to save product to wishlist.');
    }
    return res.json();
  },

  // Remove product from wishlist
  removeFromWishlist: async (token, productId) => {
    const res = await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to remove product from wishlist.');
    }
    return res.json();
  },

  // Clear entire wishlist
  clearWishlist: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to clear wishlist.');
    }
    return res.json();
  }
};

export default wishlistService;
