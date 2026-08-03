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

    let channel;
    try {
      channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          try {
            const state = channel.presenceState();
            const onlineIds = Object.keys(state || {});
            setOnlineUsers(onlineIds);
          } catch (err) {
            console.debug('Presence sync error:', err);
          }
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          if (key) addOnlineUser(key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key) removeOnlineUser(key);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              await channel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
            } catch (err) {
              console.debug('Presence track error:', err);
            }
          }
        });
    } catch (err) {
      console.warn('Presence channel initialization failed:', err);
    }

    // Cleanup: untrack presence before leaving
    return () => {
      if (channel) {
        try {
          channel.untrack();
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [user?.id, channelName, addOnlineUser, removeOnlineUser, setOnlineUsers]);

  // Convenience: check if a specific user is online
  const checkIsOnline = useCallback((userId) => {
    return isUserOnline(userId);
  }, [isUserOnline]);

  return { isUserOnline: checkIsOnline };
};

export default usePresence;
