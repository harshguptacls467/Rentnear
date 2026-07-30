/**
 * useRealtimeBookings.js
 * 
 * Subscribes to the `bookings` table for UPDATE events relevant to the current user.
 */
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useRealtimeStore from '../store/realtimeStore';
import { useToast } from '../context/ToastContext';

const STATUS_MESSAGES = {
  approved:        '✅ Booking approved! Proceed to payment.',
  rejected:        '❌ Booking request was rejected.',
  cancelled:       '🚫 Booking cancelled by user.',
  completed:       '🎉 Rental completed! Please leave a review.',
  active:          '📦 Rental started — item is now in use.',
  disputed:        '⚠️ A dispute has been opened on this booking.',
  return_requested: '↩️ Return requested by renter.',
  return_approved:  '✅ Return approved by owner.',
};

/**
 * @param {Function} setBookings - State setter from Bookings page
 * @param {Object|null} user - Current auth user
 * @param {boolean} isMock - Skip in mock mode
 */
const useRealtimeBookings = (setBookings, user, isMock) => {
  const { showToast } = useToast();

  useEffect(() => {
    if (isMock || !user?.id) return;

    useRealtimeStore.getState().setBookingsFeedStatus('connecting');

    const channel = supabase
      .channel(`realtime-bookings-${user.id}`)
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

          if (typeof setBookings === 'function') {
            setBookings(prev_list =>
              (Array.isArray(prev_list) ? prev_list : []).map(b => b.id === updated.id ? { ...b, ...updated } : b)
            );
          }

          if (updated.status !== prev?.status && STATUS_MESSAGES[updated.status]) {
            const successStatuses = ['approved', 'completed', 'active', 'return_approved'];
            const toastType = successStatuses.includes(updated.status) ? 'success' : 'error';
            showToast(STATUS_MESSAGES[updated.status], toastType);
          }
        }
      )
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

          if (typeof setBookings === 'function') {
            setBookings(prev_list =>
              (Array.isArray(prev_list) ? prev_list : []).map(b => b.id === updated.id ? { ...b, ...updated } : b)
            );
          }

          if (updated.status !== prev_status && STATUS_MESSAGES[updated.status]) {
            const successStatuses = ['approved', 'completed', 'active', 'return_approved'];
            const toastType = successStatuses.includes(updated.status) ? 'success' : 'error';
            showToast(STATUS_MESSAGES[updated.status], toastType);
          }
        }
      )
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
          if (typeof setBookings === 'function') {
            setBookings(prev => [newBooking, ...(Array.isArray(prev) ? prev : [])]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `renter_id=eq.${user.id}`
        },
        (payload) => {
          const newBooking = payload.new;
          showToast('🔔 New booking created!', 'info');
          if (typeof setBookings === 'function') {
            setBookings(prev => [newBooking, ...(Array.isArray(prev) ? prev : [])]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookings',
          filter: `renter_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          if (typeof setBookings === 'function') {
            setBookings(prev => (Array.isArray(prev) ? prev : []).filter(b => b.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookings',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          if (typeof setBookings === 'function') {
            setBookings(prev => (Array.isArray(prev) ? prev : []).filter(b => b.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') useRealtimeStore.getState().setBookingsFeedStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') useRealtimeStore.getState().setBookingsFeedStatus('disconnected');
      });

    return () => {
      useRealtimeStore.getState().setBookingsFeedStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [isMock, user?.id, setBookings, showToast]);
};

export default useRealtimeBookings;
