const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const analyticsService = {
  getOwnerDashboard: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/analytics/owner/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch owner analytics.');
    }
    return res.json();
  }
};

export default analyticsService;
