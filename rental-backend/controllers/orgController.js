const supabase = require('../config/supabase');
const crypto = require('crypto');

const orgController = {
  // POST /api/orgs/create
  createOrg: async (req, res, next) => {
    try {
      const { name, taxId } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ success: false, error: { message: 'Organization name is required.' } });
      }

      // 1. Insert Organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert([{ name, tax_id: taxId || null }])
        .select()
        .single();

      if (orgErr) throw orgErr;

      // 2. Add creator user as 'owner'
      const { error: memberErr } = await supabase
        .from('organization_memberships')
        .insert([{
          organization_id: org.id,
          user_id: userId,
          role: 'owner'
        }]);

      if (memberErr) throw memberErr;

      res.status(201).json({ success: true, organization: org });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/orgs/:id/members
  getOrgMembers: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { data: members, error } = await supabase
        .from('organization_memberships')
        .select('id, role, user:users(id, name, email, avatar_url)')
        .eq('organization_id', id);

      if (error) throw error;
      res.json({ success: true, members: members || [] });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/orgs/:id/invite
  inviteMember: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ success: false, error: { message: 'Email and role are required.' } });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 Hours

      const { data: invite, error } = await supabase
        .from('organization_invitations')
        .insert([{
          organization_id: id,
          email,
          role,
          token,
          expires_at: expiresAt
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, inviteLink: `/workspace/accept?token=${token}` });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/orgs/invites/accept
  acceptInvitation: async (req, res, next) => {
    try {
      const { token } = req.body;
      const userId = req.user.id;

      if (!token) {
        return res.status(400).json({ success: false, error: { message: 'Token is required.' } });
      }

      // Find token
      const { data: invite, error: inviteErr } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('token', token)
        .eq('accepted', false)
        .single();

      if (inviteErr || !invite || new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: { message: 'Invalid or expired invitation token.' } });
      }

      // Add to memberships
      const { error: memberErr } = await supabase
        .from('organization_memberships')
        .insert([{
          organization_id: invite.organization_id,
          user_id: userId,
          role: invite.role
        }]);

      if (memberErr) throw memberErr;

      // Mark invitation as accepted
      await supabase
        .from('organization_invitations')
        .update({ accepted: true })
        .eq('id', invite.id);

      res.json({ success: true, message: 'Joined organization successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/orgs/:id/inventory/bulk-upload
  bulkUploadInventory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { products } = req.body; // JSON array of products

      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ success: false, error: { message: 'products JSON array is required.' } });
      }

      const productsWithOrg = products.map(p => ({
        ...p,
        organization_id: id,
        owner_id: req.user.id, // Linked owner fallback
        is_available: true
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsWithOrg)
        .select();

      if (error) throw error;
      res.status(201).json({ success: true, products: data });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/orgs/:id/billing/invoices
  getOrgBilling: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .eq('organization_id', id);

      if (error) throw error;
      res.json({ success: true, billing: bookings || [] });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = orgController;
