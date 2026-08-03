const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const orgService = {
  createOrg: async (orgData, token) => {
    const res = await fetch(`${API_BASE_URL}/api/orgs/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orgData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create organization.');
    }
    return res.json();
  },

  getOrgMembers: async (orgId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/orgs/${orgId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch team members.');
    }
    return res.json();
  },

  inviteMember: async (orgId, inviteData, token) => {
    const res = await fetch(`${API_BASE_URL}/api/orgs/${orgId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inviteData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to invite team member.');
    }
    return res.json();
  },

  acceptInvitation: async (inviteToken, token) => {
    const res = await fetch(`${API_BASE_URL}/api/orgs/invites/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: inviteToken })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to accept organization invitation.');
    }
    return res.json();
  },

  bulkUploadInventory: async (orgId, products, token) => {
    const res = await fetch(`${API_BASE_URL}/api/orgs/${orgId}/inventory/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ products })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload inventory items.');
    }
    return res.json();
  },

  getOrgBilling: async (orgId, token) => {
    const res = await fetch(`${API_BASE_URL}/api/orgs/${orgId}/billing/invoices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch billing invoices.');
    }
    return res.json();
  }
};

export default orgService;
