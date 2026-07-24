// src/hooks/useRealtimeReviews.js
// Realtime hook for product reviews (INSERT, UPDATE, DELETE)

import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * @param {Function} setReviews - State setter to manage the list of reviews (newest first)
 * @param {Object|null} user - Authenticated user (optional, used for filter if needed)
 * @param {string|null} productId - If provided, only listen for reviews of this product
 */
const useRealtimeReviews = (setReviews, user = null, productId = null) => {
  const cleanupRef = useRef(null);

  useEffect(() => {
    // Build a filter string based on optional parameters
    const filters = [];
    if (user?.id) filters.push(`user_id=eq.${user.id}`);
    if (productId) filters.push(`product_id=eq.${productId}`);
    const filterString = filters.length ? filters.join(' & ') : undefined;

    const channel = supabase
      .channel(`realtime-reviews-${productId || 'all'}`)
      // New review added
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          ...(filterString && { filter: filterString }),
        },
        (payload) => {
          const newReview = payload.new;
          // Prepend newest review
          setReviews((prev) => [newReview, ...prev]);
        }
      )
      // Review updated (e.g., edited content or rating changed)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reviews',
          ...(filterString && { filter: filterString }),
        },
        (payload) => {
          const updated = payload.new;
          setReviews((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          );
        }
      )
      // Review deleted
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reviews',
          ...(filterString && { filter: filterString }),
        },
        (payload) => {
          const deletedId = payload.old.id;
          setReviews((prev) => prev.filter((r) => r.id !== deletedId));
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, [user?.id, productId, setReviews]);
};

export default useRealtimeReviews;
