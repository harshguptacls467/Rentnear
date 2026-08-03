import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook listening to Supabase Realtime WebSocket changes on `notifications` table for active user.
 * @param {string} userId - Active user's ID
 * @param {function} onNotificationReceived - Callback when new notification arrives
 */
export function useRealtimeNotifications(userId, onNotificationReceived) {
  useEffect(() => {
    if (!userId || userId === 'mock-user-id') return;

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && onNotificationReceived) {
            onNotificationReceived(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNotificationReceived]);
}

export default useRealtimeNotifications;
