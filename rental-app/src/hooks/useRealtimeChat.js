/**
 * useRealtimeChat.js
 * 
 * Enhanced chat real-time hook wrapping the raw Supabase channel logic.
 * Provides:
 *   - Message streaming (INSERT on messages table)
 *   - Typing indicator (debounced upsert to typing_indicators table)
 *   - Read receipts (UPDATE read_at on messages when seen)
 *   - Returns: { typingUser, sendTypingIndicator, markMessagesRead }
 * 
 * Debouncing:
 * - Typing events fire very frequently. We debounce the DB write to 600ms
 *   so we don't spam the server on every keystroke.
 * - We also clear the "is_typing" after 3 seconds of no activity.
 * 
 * Memory leak prevention:
 * - clearTimeout on all timer references in cleanup
 * - supabase.removeChannel on unmount
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import useRealtimeStore from '../store/realtimeStore';

const TYPING_DEBOUNCE_MS = 600;
const TYPING_CLEAR_MS = 3000;

/**
 * @param {string} bookingId
 * @param {Object|null} user - Current auth user
 * @param {Function} setMessages - State setter from ChatWindow
 * @param {boolean} isMock - Skip in mock mode
 */
const useRealtimeChat = (bookingId, user, setMessages, isMock) => {
  const [typingUser, setTypingUser] = useState(null);
  const typingDebounceRef = useRef(null);
  const typingClearRef = useRef(null);
  const { incrementUnread } = useRealtimeStore();

  // ─── Message Subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (isMock || !bookingId || !user?.id) return;

    const messageChannel = supabase
      .channel(`chat-messages-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const msg = payload.new;
          setMessages(prev => {
            // Prevent duplicate if optimistic message already added
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // If message is from the other person, increment unread badge in Navbar
          if (msg.sender_id !== user.id) {
            incrementUnread();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [bookingId, user?.id, isMock, setMessages, incrementUnread]);

  // ─── Typing Indicator Subscription ────────────────────────────────────────
  useEffect(() => {
    if (isMock || !bookingId || !user?.id) return;

    const typingChannel = supabase
      .channel(`chat-typing-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const row = payload.new || payload.old;
          // Don't show our own typing indicator
          if (!row || row.user_id === user.id) return;

          if (row.is_typing) {
            setTypingUser(row.user_id);
            // Auto-clear if no new events in 3 seconds
            clearTimeout(typingClearRef.current);
            typingClearRef.current = setTimeout(() => setTypingUser(null), TYPING_CLEAR_MS);
          } else {
            setTypingUser(null);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(typingDebounceRef.current);
      clearTimeout(typingClearRef.current);
      supabase.removeChannel(typingChannel);
    };
  }, [bookingId, user?.id, isMock]);

  // ─── Send Typing Indicator ────────────────────────────────────────────────
  const sendTypingIndicator = useCallback((isCurrentlyTyping) => {
    if (isMock || !bookingId || !user?.id) return;

    clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('typing_indicators')
          .upsert(
            { booking_id: bookingId, user_id: user.id, is_typing: isCurrentlyTyping, updated_at: new Date().toISOString() },
            { onConflict: 'booking_id,user_id' }
          );
      } catch (err) {
        // Silent fail — typing indicator is non-critical
        console.debug('Typing indicator error:', err);
      }
    }, TYPING_DEBOUNCE_MS);
  }, [bookingId, user?.id, isMock]);

  // ─── Mark Messages as Read ────────────────────────────────────────────────
  const markMessagesRead = useCallback(async (messageIds) => {
    if (isMock || !messageIds?.length) return;
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .neq('sender_id', user.id); // Only mark others' messages
    } catch (err) {
      console.debug('Mark read error:', err);
    }
  }, [isMock, user?.id]);

  return { typingUser, sendTypingIndicator, markMessagesRead };
};

export default useRealtimeChat;
