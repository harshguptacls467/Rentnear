const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const notificationService = {
  // Fetch user notifications
  getNotifications: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/notifications${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch notifications.');
    }
    return res.json();
  },

  // Mark single notification as read
  markAsRead: async (token, notificationId) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to mark notification as read.');
    }
    return res.json();
  },

  // Mark all notifications as read
  markAllAsRead: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to mark all notifications as read.');
    }
    return res.json();
  },

  // Delete single notification
  deleteNotification: async (token, notificationId) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to delete notification.');
    }
    return res.json();
  },

  // Clear all notifications
  clearAll: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/clear-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to clear notifications.');
    }
    return res.json();
  },

  // Get user notification preferences
  getPreferences: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch preferences.');
    }
    return res.json();
  },

  // Update notification preferences
  updatePreferences: async (token, preferencesData) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferencesData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update preferences.');
    }
    return res.json();
  }
};

export default notificationService;
