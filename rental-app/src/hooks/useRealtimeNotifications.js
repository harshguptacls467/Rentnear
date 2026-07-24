// src/hooks/useRealtimeNotifications.js
// Realtime hook for user notifications (INSERT new notification, UPDATE read status)

import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import useRealtimeStore from '../store/realtimeStore'; // optional store for global unread count

/**
 * @param {Function} setNotifications - State setter to update notifications list (newest first)
 * @param {Function} setUnreadCount - State setter for unread badge count (optional)
 * @param {Object|null} user - Authenticated user object with .id
 */
const useRealtimeNotifications = (setNotifications, setUnreadCount, user) => {
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime-notifications-${user.id}`)
      // New notification inserted for this user
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new;
          // Prepend the notification so newest appears first
          setNotifications((prev) => [newNotif, ...prev]);
          if (setUnreadCount) setUnreadCount((c) => c + 1);
        }
      )
      // Update read status (or any other field that changes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
          );
          // If the notification was marked as read, decrement unread count
          if (payload.old && payload.old.read && !updated.read && setUnreadCount) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, [user?.id, setNotifications, setUnreadCount]);
};

export default useRealtimeNotifications;
