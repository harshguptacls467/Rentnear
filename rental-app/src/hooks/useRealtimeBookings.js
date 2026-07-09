/**
 * useRealtimeBookings.js
 * 
 * Subscribes to the `bookings` table for UPDATE events relevant to the current user.
 * When a booking's status changes, it:
 *   1. Patches the booking in local state (no full refetch needed)
 *   2. Shows a toast notification with the appropriate message
 * 
 * How channels work:
 * - Supabase allows a `filter` parameter on postgres_changes listeners
 * - We use TWO listeners on the same channel: one for renter, one for owner
 * - Both share the same WebSocket connection (efficient)
 * 
 * Optimistic UI:
 * - When owner approves/rejects, the state is already updated optimistically
 *   by the Bookings page. This hook catches the DB-confirmed UPDATE and
 *   ensures the UI stays in sync even if optimistic update was wrong.
 */
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useRealtimeStore from '../store/realtimeStore';
import { useToast } from '../context/ToastContext';

const STATUS_MESSAGES = {
  approved:  '✅ Booking approved! Proceed to payment.',
  rejected:  '❌ Booking request was rejected.',
  cancelled: '🚫 A booking was cancelled.',
  completed: '🎉 Booking completed! Leave a review.',
  active:    '📦 Item handed over — rental is now active!',
  disputed:  '⚠️ A dispute has been opened on your booking.',
};

/**
 * @param {Function} setBookings - State setter from Bookings page
 * @param {Object|null} user - Current auth user
 * @param {boolean} isMock - Skip in mock mode
 */
const useRealtimeBookings = (setBookings, user, isMock) => {
  const { setBookingsFeedStatus } = useRealtimeStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (isMock || !user?.id) return;

    setBookingsFeedStatus('connecting');

    const channel = supabase
      .channel(`realtime-bookings-${user.id}`)
      // Listen for updates where current user is the RENTER
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `renter_id=eq.${user.id}`
        },
        (payload) => {
          const updated = payload.new;
          const prev = payload.old;

          // Patch the specific booking in state
          setBookings(prev_list =>
            prev_list.map(b => b.id === updated.id ? { ...b, ...updated } : b)
          );

          // Show toast only when status actually changed
          if (updated.status !== prev.status && STATUS_MESSAGES[updated.status]) {
            showToast(STATUS_MESSAGES[updated.status],
              updated.status === 'approved' || updated.status === 'completed' ? 'success' : 'error'
            );
          }
        }
      )
      // Listen for updates where current user is the OWNER
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          const updated = payload.new;
          const prev_status = payload.old?.status;

          setBookings(prev_list =>
            prev_list.map(b => b.id === updated.id ? { ...b, ...updated } : b)
          );

          if (updated.status !== prev_status && STATUS_MESSAGES[updated.status]) {
            showToast(STATUS_MESSAGES[updated.status], 'info');
          }
        }
      )
      // Listen for new booking INSERTS (new rental requests) for owner
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          const newBooking = payload.new;
          showToast('🔔 New booking request received!', 'info');
          // Prepend the new booking (it won't have joined data, so we use a flag
          // to trigger a background refresh on next focus)
          setBookings(prev => [newBooking, ...prev]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setBookingsFeedStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setBookingsFeedStatus('disconnected');
      });

    return () => {
      setBookingsFeedStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [isMock, user?.id, setBookings, setBookingsFeedStatus, showToast]);
};

export default useRealtimeBookings;
