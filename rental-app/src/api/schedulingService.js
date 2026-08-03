const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const schedulingService = {
  getAvailableSlots: async (productId, date, token) => {
    const res = await fetch(`${API_BASE_URL}/api/scheduling/slots/${productId}?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch available slots.');
    }
    return res.json();
  },

  getSchedule: async (bookingId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/scheduling/booking/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch schedule details.');
    }
    return res.json();
  },

  bookSchedule: async (scheduleData, token) => {
    const res = await fetch(`${API_BASE_URL}/api/scheduling/book`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scheduleData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to confirm schedule booking.');
    }
    return res.json();
  },

  updateStatus: async (scheduleId, status, token) => {
    const res = await fetch(`${API_BASE_URL}/api/scheduling/${scheduleId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update schedule status.');
    }
    return res.json();
  }
};

export default schedulingService;
