// useRealtimePayments.js
// Realtime hook for payment events (INSERT) for the current user.

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * @param {Function} setPayments - State setter to prepend new payment records.
 * @param {Object|null} user - Authenticated user.
 */
const useRealtimePayments = (setPayments, user) => {
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime-payments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Prepend the new payment to the list
          setPayments((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, setPayments]);
};

export default useRealtimePayments;
