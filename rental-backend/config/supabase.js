require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Backend MUST use SERVICE_ROLE_KEY — it bypasses Row Level Security safely on the server.
// NEVER use the anon key on the backend; it would be blocked by RLS policies.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Config Error] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required. ' +
    'Please set them in your environment or your .env file.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

module.exports = supabase;
