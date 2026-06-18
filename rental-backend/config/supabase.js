require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Backend MUST use SERVICE_ROLE_KEY — it bypasses Row Level Security safely on the server.
// NEVER use the anon key on the backend; it would be blocked by RLS policies.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[SECURITY WARNING] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. All API calls will fail.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

module.exports = supabase;
