/**
 * usePresence.js
 * 
 * Tracks online/offline status of users using Supabase Presence channels.
 * 
 * How Supabase Presence works (different from postgres_changes):
 * - Presence channels are ephemeral — no DB writes required
 * - Each client "tracks" a payload (their user_id) in a channel
 * - Supabase broadcasts join/leave events to all channel members
 * - Perfect for online indicators: zero DB cost, instant updates
 * 
 * Usage:
 *   const { isOnline } = usePresence(user);   // in App or Layout
 *   const online = isUserOnline(targetUserId); // anywhere via store
 * 
 * Two modes:
 *   1. Global (no targetId) — broadcasts own presence, updates store
 *   2. Targeted (with targetId) — only checks if specific user is online
 */
import { useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import useRealtimeStore from '../store/realtimeStore';

/**
 * @param {Object|null} user - Current auth user (whose presence to broadcast)
 * @param {string} [channelName='global-presence'] - Presence channel to join
 */
const usePresence = (user, channelName = 'global-presence') => {
  const { addOnlineUser, removeOnlineUser, setOnlineUsers, isUserOnline } = useRealtimeStore();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Sync event fires on join and whenever state changes
        // Get all currently tracked keys (user IDs)
        const state = channel.presenceState();
        const onlineIds = Object.keys(state);
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        addOnlineUser(key);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        removeOnlineUser(key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track own presence — this broadcasts to all others in the channel
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Cleanup: untrack presence before leaving
    // This triggers a 'leave' event for other subscribers
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user?.id, channelName, addOnlineUser, removeOnlineUser, setOnlineUsers]);

  // Convenience: check if a specific user is online
  const checkIsOnline = useCallback((userId) => {
    return isUserOnline(userId);
  }, [isUserOnline]);

  return { isUserOnline: checkIsOnline };
};

export default usePresence;
