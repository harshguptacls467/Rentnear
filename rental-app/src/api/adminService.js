import { API_URL } from '../config/api';

/**
 * Helper to get authorization headers
 */
const getHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const adminService = {
  /**
   * Fetches dashboard overview stats
   */
  getStats: async (token) => {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  /**
   * Fetches all users
   */
  getUsers: async (token) => {
    const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  /**
   * Fetches all products
   */
  getProducts: async (token) => {
    const res = await fetch(`${API_URL}/admin/products`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  /**
   * Fetches all disputes
   */
  getDisputes: async (token) => {
    const res = await fetch(`${API_URL}/admin/disputes`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch disputes');
    return res.json();
  },

  /**
   * Fetches all KYC submissions
   */
  getKycSubmissions: async (token) => {
    const res = await fetch(`${API_URL}/admin/kyc`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch KYC submissions');
    return res.json();
  },

  /**
   * Toggles ban status for a user
   */
  toggleUserBan: async (userId, currentStatus, token) => {
    const res = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ is_banned: !currentStatus })
    });
    if (!res.ok) throw new Error('Failed to update ban status');
    return res.json();
  },

  /**
   * Removes a product permanently
   */
  removeProduct: async (productId, token) => {
    const res = await fetch(`${API_URL}/admin/products/${productId}/remove`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    if (!res.ok) throw new Error('Failed to remove product');
    return res.json();
  },

  /**
   * Resolves a dispute
   */
  resolveDispute: async (disputeId, resolution, notes, amount, token) => {
    const res = await fetch(`${API_URL}/admin/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ 
        resolution,
        admin_notes: notes,
        resolution_amount: amount ? parseFloat(amount) : 0
      })
    });
    if (!res.ok) throw new Error('Failed to resolve dispute');
    return res.json();
  },

  /**
   * Resolves a KYC submission
   */
  resolveKyc: async (kycId, status, notes, token) => {
    const res = await fetch(`${API_URL}/admin/kyc/${kycId}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status, admin_notes: notes })
    });
    if (!res.ok) throw new Error('Failed to resolve KYC');
    return res.json();
  }
};
