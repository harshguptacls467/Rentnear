const supabase = require('../config/supabase');

const tenantController = {
  // GET /api/tenant/resolve
  resolveTenant: async (req, res, next) => {
    try {
      const { host } = req.query;
      if (!host) {
        return res.status(400).json({ success: false, error: { message: 'Host query is required.' } });
      }

      // Check subdomain partition
      const parts = host.split('.');
      const subdomain = parts[0];

      let query = supabase.from('tenants').select('*');
      if (parts.length > 2) {
        query = query.eq('subdomain', subdomain);
      } else {
        query = query.eq('custom_domain', host);
      }

      const { data: tenant, error } = await query.maybeSingle();

      if (error) throw error;

      // Fallback fallback defaults if no tenant records match
      const resultTenant = tenant || {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Default RentNear',
        subdomain: 'default',
        branding: { primary_color: '#4f46e5', logo_url: '' },
        ai_prompt_override: 'You are the default helpful RentNear Assistant.'
      };

      res.json({ success: true, tenant: resultTenant });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/tenant/create (Super Admin only)
  createTenant: async (req, res, next) => {
    try {
      const { name, subdomain, customDomain, branding, aiPromptOverride } = req.body;

      if (!name || !subdomain) {
        return res.status(400).json({ success: false, error: { message: 'name and subdomain are required.' } });
      }

      const { data: tenant, error } = await supabase
        .from('tenants')
        .insert([{
          name,
          subdomain,
          custom_domain: customDomain || null,
          branding: branding || { primary_color: '#4f46e5', logo_url: '' },
          ai_prompt_override: aiPromptOverride || null
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, tenant });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/tenant/list (Super Admin only)
  getTenants: async (req, res, next) => {
    try {
      const { data: list, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, tenants: list || [] });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = tenantController;
