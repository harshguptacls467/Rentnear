const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const pricingService = {
  getRecommendation: async (productId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/recommendation/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch price recommendation.');
    }
    return res.json();
  },

  simulateRevenue: async (productId, simulatedPrice, token) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/simulate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, simulatedPrice })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to simulate pricing revenue.');
    }
    return res.json();
  },

  applyPrice: async (productId, newPrice, appliedAi, token) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, newPrice, appliedAi })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to apply price.');
    }
    return res.json();
  },

  getHistory: async (productId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/history/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch pricing history.');
    }
    return res.json();
  }
};

export default pricingService;
