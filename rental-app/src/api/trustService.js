const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const trustService = {
  getUserTrustInfo: async (userId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/trust/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch trust info.');
    }
    return res.json();
  },

  recalculateTrustScore: async (userId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/trust/recalculate/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to recalculate trust score.');
    }
    return res.json();
  },

  adminAdjustScore: async (userId, adjustment, reason, token) => {
    const res = await fetch(`${API_BASE_URL}/api/trust/admin/${userId}/adjust`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ adjustment, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to adjust trust score.');
    }
    return res.json();
  },

  getFraudAlerts: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/trust/admin/fraud-alerts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch fraud alerts.');
    }
    return res.json();
  }
};

export default trustService;
