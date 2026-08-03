const supabase = require('../config/supabase');

const federationController = {
  // GET /api/v1/federation/search
  federatedSearch: async (req, res, next) => {
    try {
      const { query: searchQuery } = req.query;

      // 1. Fetch opted-in tenant IDs from federation_registries
      const { data: activeFed, error: registryErr } = await supabase
        .from('federation_registries')
        .select('tenant_id')
        .eq('opt_in_search', true);

      if (registryErr) throw registryErr;

      const optedTenantIds = (activeFed || []).map(r => r.tenant_id);

      if (optedTenantIds.length === 0) {
        return res.json({ success: true, products: [] });
      }

      // 2. Fetch products belonging to opted-in tenants matching query
      let query = supabase
        .from('products')
        .select('*, tenant:tenants(name, subdomain)')
        .in('tenant_id', optedTenantIds)
        .eq('is_available', true);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data: products, error: productErr } = await query;
      if (productErr) throw productErr;

      res.json({ success: true, products: products || [] });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/federation/settlements
  getFederationSettlements: async (req, res, next) => {
    try {
      const { data: settlements, error } = await supabase
        .from('settlements')
        .select(`
          *,
          from_tenant:tenants!from_tenant_id(name),
          to_tenant:tenants!to_tenant_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, settlements: settlements || [] });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/federation/settlements/reconcile
  reconcileWalletSettlement: async (req, res, next) => {
    try {
      const { settlementId } = req.body;
      if (!settlementId) {
        return res.status(400).json({ success: false, error: { message: 'settlementId is required.' } });
      }

      const { data: settlement, error: updateErr } = await supabase
        .from('settlements')
        .update({ status: 'cleared' })
        .eq('id', settlementId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      res.json({ success: true, message: 'Settlement cleared successfully.', settlement });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = federationController;
