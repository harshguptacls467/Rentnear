/**
 * useRealtimeAdmin.js
 * 
 * Real-time hook for the Admin dashboard.
 * Subscribes to multiple tables to keep stats live.
 * 
 * Performance optimization:
 * - Uses debouncing (500ms) to batch rapid stat updates
 *   (e.g., if 5 products are listed in quick succession, 
 *    we only re-calculate stats once)
 * - Single channel with multiple listeners (efficient)
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const DEBOUNCE_MS = 500;

/**
 * @param {Function} setStats - Stats setter from Admin page
 * @param {Function} setUsers - Users setter from Admin page
 * @param {Function} setProducts - Products setter from Admin page
 * @param {boolean} isAdmin - Only subscribe for admin users
 */
const useRealtimeAdmin = (setStats, setUsers, setProducts, isAdmin) => {
  const debounceRef = useRef(null);

  const debouncedStatUpdate = (updater) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(updater, DEBOUNCE_MS);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-realtime-dashboard')

      // ── New user registered ─────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          const newUser = payload.new;
          setUsers(prev => [newUser, ...prev]);
          debouncedStatUpdate(() =>
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }))
          );
        }
      )

      // ── Product listed ──────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          const newProduct = payload.new;
          setProducts(prev => [newProduct, ...prev]);
          debouncedStatUpdate(() =>
            setStats(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }))
          );
        }
      )

      // ── Product removed ─────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          debouncedStatUpdate(() =>
            setStats(prev => ({ ...prev, totalProducts: Math.max(0, prev.totalProducts - 1) }))
          );
        }
      )

      // ── New booking ─────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => {
          debouncedStatUpdate(() =>
            setStats(prev => ({ ...prev, bookingsToday: prev.bookingsToday + 1 }))
          );
        }
      )

      // ── Booking status changed ──────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          const updated = payload.new;
          const prev_status = payload.old?.status;
          if (updated.status === 'disputed' && prev_status !== 'disputed') {
            debouncedStatUpdate(() =>
              setStats(prev => ({ ...prev, openDisputes: prev.openDisputes + 1 }))
            );
          }
          if (prev_status === 'disputed' && updated.status !== 'disputed') {
            debouncedStatUpdate(() =>
              setStats(prev => ({ ...prev, openDisputes: Math.max(0, prev.openDisputes - 1) }))
            );
          }
        }
      )

      .subscribe();

    return () => {
      clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, setStats, setUsers, setProducts]);
};

export default useRealtimeAdmin;
