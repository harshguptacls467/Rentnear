require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Backend MUST use SECRET_KEY / SERVICE_ROLE_KEY — it bypasses Row Level Security safely on the server.
// NEVER use the anon key on the backend; it would be blocked by RLS policies.
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Config Error] SUPABASE_URL and either SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variables are required. ' +
    'Please set them in your environment or your .env file.'
  );
}

const logger = require('../utils/logger');

// SRE Resilience: Custom fetch client with exponential backoff retries and timeout protection
const customFetchWithRetries = async (url, options = {}) => {
  const maxRetries = 3;
  let delay = 100; // ms
  const timeoutMs = 8000; // 8s timeout to protect connection pools

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const mergedOptions = { ...options, signal: controller.signal };

    try {
      const response = await fetch(url, mergedOptions);
      clearTimeout(id);

      if (response.status >= 502 && response.status <= 504) {
        throw new Error(`Transient server status: ${response.status}`);
      }
      return response;
    } catch (err) {
      clearTimeout(id);
      const isTimeout = err.name === 'AbortError';
      const isTransient = isTimeout || err.message.includes('FetchError') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED');

      if (attempt === maxRetries || !isTransient) {
        logger.error(`[Supabase Fetch] Connection failed after ${attempt} attempts: ${err.message}`, err);
        throw err;
      }

      logger.warn(`[Supabase Fetch] Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: customFetchWithRetries
  }
});

module.exports = supabase;
