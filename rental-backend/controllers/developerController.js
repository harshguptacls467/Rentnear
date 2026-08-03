const supabase = require('../config/supabase');
const crypto = require('crypto');

const developerController = {
  // POST /api/v1/developer/keys
  generateKey: async (req, res, next) => {
    try {
      const { name, scopes, expiresAt } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ success: false, error: { message: 'Key name is required.' } });
      }

      // Generate secure random string
      const rawKey = 'rn_live_' + crypto.randomBytes(24).toString('hex');
      const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
      const prefix = rawKey.substring(0, 8); // 'rn_live_'

      const { data: keyData, error } = await supabase
        .from('developer_keys')
        .insert([{
          user_id: userId,
          name,
          key_prefix: prefix,
          hashed_key: hashedKey,
          scopes: scopes || ['read:products'],
          expires_at: expiresAt || null
        }])
        .select()
        .single();

      if (error) throw error;

      // Return the RAW key only ONCE at creation
      res.status(201).json({
        success: true,
        key: {
          id: keyData.id,
          name: keyData.name,
          prefix: keyData.key_prefix,
          scopes: keyData.scopes,
          rawToken: rawKey, // CLIENT STORES THIS SECURELY
          created_at: keyData.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/developer/keys
  getKeys: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { data: keys, error } = await supabase
        .from('developer_keys')
        .select('id, name, key_prefix, scopes, status, expires_at, created_at')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      res.json({ success: true, keys: keys || [] });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/v1/developer/keys/:id
  revokeKey: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: key, error: fetchErr } = await supabase
        .from('developer_keys')
        .select('id, user_id')
        .eq('id', id)
        .single();

      if (fetchErr || !key) {
        return res.status(404).json({ success: false, error: { message: 'API key not found.' } });
      }

      if (key.user_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Not authorized to revoke this key.' } });
      }

      // Mark status as revoked
      const { error: updateErr } = await supabase
        .from('developer_keys')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (updateErr) throw updateErr;

      res.json({ success: true, message: 'API Key revoked successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/developer/webhooks
  createWebhookEndpoint: async (req, res, next) => {
    try {
      const { url, events } = req.body;
      const userId = req.user.id;

      if (!url) {
        return res.status(400).json({ success: false, error: { message: 'Webhook target URL is required.' } });
      }

      const secret = 'whsec_' + crypto.randomBytes(20).toString('hex');

      const { data: endpoint, error } = await supabase
        .from('webhook_endpoints')
        .insert([{
          user_id: userId,
          url,
          secret,
          events: events || ['booking.created']
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, endpoint });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/developer/webhooks
  getWebhookEndpoints: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { data: endpoints, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      res.json({ success: true, endpoints: endpoints || [] });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/developer/logs
  getApiLogs: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { data: logs, error } = await supabase
        .from('api_logs')
        .select(`
          *,
          key:developer_keys(name, key_prefix)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      res.json({ success: true, logs: logs || [] });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = developerController;
