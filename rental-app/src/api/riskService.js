const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const riskService = {
  recalculateUserRisk: async (userId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/risk/recalculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to recalculate user risk.');
    }
    return res.json();
  },

  getInvestigations: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/risk/investigations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch manual investigations queue.');
    }
    return res.json();
  },

  resolveInvestigation: async (investigationId, resolutionData, token) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/risk/investigations/${investigationId}/resolve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resolutionData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to resolve fraud investigation.');
    }
    return res.json();
  }
};

export default riskService;
