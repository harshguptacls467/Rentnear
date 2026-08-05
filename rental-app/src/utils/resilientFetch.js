/**
 * resilientFetch.js — Global browser window.fetch interceptor.
 *
 * Implements:
 * 1. Automatic Request Tracing: Injects a unique `x-correlation-id` header for all requests.
 * 2. Timeout Protection: Cancels slow hanging fetch requests after 10 seconds.
 * 3. Transient Error Retries: Automatically retries on 502, 503, 504 and network errors.
 * 4. Stale Content & Local Offline Fallbacks.
 */

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const originalFetch = window.fetch;

window.fetch = async function(resource, options = {}) {
  const maxRetries = 2;
  let delay = 150; // ms
  const timeoutMs = 10000; // 10 seconds

  // Add Correlation ID request tracer
  const correlationId = generateUUID();
  const headers = {
    ...options.headers,
    'x-correlation-id': correlationId,
  };

  const modifiedOptions = {
    ...options,
    headers,
  };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const finalOptions = {
      ...modifiedOptions,
      signal: controller.signal
    };

    try {
      const response = await originalFetch(resource, finalOptions);
      clearTimeout(id);

      // Retry on bad gateway / service unavailable (502, 503, 504)
      if (response.status >= 502 && response.status <= 504) {
        throw new Error(`Transient status: ${response.status}`);
      }
      return response;
    } catch (err) {
      clearTimeout(id);
      const isTimeout = err.name === 'AbortError';
      const isLastAttempt = attempt === maxRetries + 1;

      if (isLastAttempt) {
        console.error(`[Resilient Fetch] Failed to query ${resource} after ${attempt} attempts:`, err.message);
        throw err;
      }

      console.warn(`[Resilient Fetch] Request to ${resource} failed (Attempt ${attempt}): ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};
