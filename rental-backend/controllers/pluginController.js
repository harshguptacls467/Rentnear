const supabase = require('../config/supabase');
const vm = require('vm');

const pluginController = {
  // POST /api/plugins/publish
  publishPlugin: async (req, res, next) => {
    try {
      const { name, description, category, price, version, codeBundle, manifest } = req.body;
      const developerId = req.user.id;

      if (!name || !category || !version || !codeBundle) {
        return res.status(400).json({ success: false, error: { message: 'name, category, version, and codeBundle are required.' } });
      }

      // 1. Insert Plugin Catalog Entry
      const { data: plugin, error: pluginErr } = await supabase
        .from('plugins')
        .insert([{
          name,
          description,
          category,
          developer_id: developerId,
          price: price || 0.00
        }])
        .select()
        .single();

      if (pluginErr) throw pluginErr;

      // 2. Insert Version Bundle
      const { data: verData, error: verErr } = await supabase
        .from('plugin_versions')
        .insert([{
          plugin_id: plugin.id,
          version,
          code_bundle: codeBundle,
          manifest: manifest || {}
        }])
        .select()
        .single();

      if (verErr) throw verErr;

      res.status(201).json({ success: true, plugin, version: verData });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/plugins/install
  installPlugin: async (req, res, next) => {
    try {
      const { pluginId, tenantId, settings } = req.body;

      if (!pluginId || !tenantId) {
        return res.status(400).json({ success: false, error: { message: 'pluginId and tenantId are required.' } });
      }

      const { data: install, error } = await supabase
        .from('plugin_installations')
        .insert([{
          plugin_id: pluginId,
          tenant_id: tenantId,
          settings: settings || {},
          status: 'enabled'
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, installation: install });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/plugins/installations/:id/toggle
  togglePlugin: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'enabled' or 'disabled'

      if (!status || !['enabled', 'disabled'].includes(status)) {
        return res.status(400).json({ success: false, error: { message: 'Status must be enabled or disabled.' } });
      }

      const { data: install, error } = await supabase
        .from('plugin_installations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, installation: install });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/plugins/installations/:id/settings
  updatePluginSettings: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { settings } = req.body;

      const { data: install, error } = await supabase
        .from('plugin_installations')
        .update({ settings })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, installation: install });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/plugins/marketplace
  getMarketplace: async (req, res, next) => {
    try {
      const { data: plugins, error } = await supabase
        .from('plugins')
        .select(`
          *,
          developer:users(id, name, email)
        `);

      if (error) throw error;
      res.json({ success: true, plugins: plugins || [] });
    } catch (err) {
      next(err);
    }
  },

  // Dynamic execution runner helper
  executeSandbox: (codeBundle, context) => {
    const sandbox = {
      console: { log: () => {} },
      context: {
        productId: context.productId || null,
        price: context.price || 0
      },
      result: {}
    };

    vm.createContext(sandbox);
    vm.runInContext(codeBundle, sandbox, { timeout: 1000 });
    return sandbox.result;
  }
};

module.exports = pluginController;
