const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const devService = {
  generateKey: async (keyData, token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developer/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(keyData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to generate API Key.');
    }
    return res.json();
  },

  getKeys: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developer/keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch API keys.');
    }
    return res.json();
  },

  revokeKey: async (keyId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developer/keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to revoke API key.');
    }
    return res.json();
  },

  createWebhook: async (webhookData, token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developer/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to register webhook.');
    }
    return res.json();
  },

  getWebhooks: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developer/webhooks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch webhooks.');
    }
    return res.json();
  },

  getApiLogs: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developer/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch developer logs.');
    }
    return res.json();
  }
};

export default devService;
