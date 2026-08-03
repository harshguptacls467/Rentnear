const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const rewardsService = {
  getDashboard: async (userId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/rewards/dashboard/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch rewards dashboard.');
    }
    return res.json();
  },

  getTransactions: async (userId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/rewards/transactions/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch transactions.');
    }
    return res.json();
  },

  getReferralsList: async (userId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/rewards/referrals/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch referrals.');
    }
    return res.json();
  }
};

export default rewardsService;
