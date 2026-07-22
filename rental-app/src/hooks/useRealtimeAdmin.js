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
 * @param {Object} params
 * @param {Function} params.setStats - Stats setter from Admin page
 * @param {Function} params.setUsers - Users setter from Admin page
 * @param {Function} params.setProducts - Products setter from Admin page
 * @param {Function} params.setBookings - Bookings setter from Admin page
 * @param {Function} params.setDisputes - Disputes setter from Admin page
 * @param {Function} params.setKycSubmissions - KYC Submissions setter from Admin page
 * @param {boolean} params.isAdmin - Only subscribe for admin users
 */
const useRealtimeAdmin = ({
  setStats,
  setUsers,
  setProducts,
  setBookings,
  setDisputes,
  setKycSubmissions,
  isAdmin
}) => {
  const debounceRef = useRef(null);

  const debouncedStatUpdate = (updater) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(updater, DEBOUNCE_MS);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-realtime-dashboard')

      // ── Users ──────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          const newUser = payload.new;
          if (setUsers) setUsers(prev => [newUser, ...prev]);
          if (setStats) {
            debouncedStatUpdate(() =>
              setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          const updatedUser = payload.new;
          if (setUsers) setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
        }
      )

      // ── Products (Listings) ─────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        async (payload) => {
          const newProduct = { ...payload.new };
          try {
            if (newProduct.owner_id) {
              const { data: owner } = await supabase.from('users').select('id, name, email, avatar_url').eq('id', newProduct.owner_id).single();
              if (owner) newProduct.owner = owner;
            }
          } catch (e) { console.warn("Failed to fetch owner for realtime product:", e); }

          if (setProducts) setProducts(prev => [newProduct, ...prev]);
          if (setStats) {
            debouncedStatUpdate(() =>
              setStats(prev => ({ ...prev, totalProducts: prev.totalProducts + 1, activeListings: prev.activeListings + 1 }))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const updatedProduct = payload.new;
          if (setProducts) setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          if (setProducts) setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          if (setStats) {
            debouncedStatUpdate(() =>
              setStats(prev => ({ ...prev, totalProducts: Math.max(0, prev.totalProducts - 1) }))
            );
          }
        }
      )

      // ── Bookings ────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async (payload) => {
          const newBooking = { ...payload.new };
          try {
            const [{ data: product }, { data: renter }, { data: owner }] = await Promise.all([
              supabase.from('products').select('id, title, images, category').eq('id', newBooking.product_id).single(),
              supabase.from('users').select('id, name, email, avatar_url').eq('id', newBooking.renter_id).single(),
              supabase.from('users').select('id, name, email, avatar_url').eq('id', newBooking.owner_id).single()
            ]);
            if (product) newBooking.product = product;
            if (renter) newBooking.renter = renter;
            if (owner) newBooking.owner = owner;
          } catch (e) { console.warn("Failed to fetch booking relations:", e); }

          if (setBookings) setBookings(prev => [newBooking, ...prev]);
          if (setStats) {
            debouncedStatUpdate(() =>
              setStats(prev => ({ ...prev, bookingsToday: prev.bookingsToday + 1 }))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          const updated = payload.new;
          if (setBookings) setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
          
          const prev_status = payload.old?.status;
          if (setStats) {
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
        }
      )

      // ── KYC Submissions ─────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kyc_submissions' },
        async (payload) => {
          const newKyc = { ...payload.new };
          try {
            if (newKyc.user_id) {
              const { data: user } = await supabase.from('users').select('id, name, email, avatar_url').eq('id', newKyc.user_id).single();
              if (user) newKyc.user = user;
            }
          } catch (e) { console.warn("Failed to fetch user for realtime KYC:", e); }

          if (setKycSubmissions) setKycSubmissions(prev => [newKyc, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'kyc_submissions' },
        (payload) => {
          const updatedKyc = payload.new;
          if (setKycSubmissions) setKycSubmissions(prev => prev.map(k => k.id === updatedKyc.id ? { ...k, ...updatedKyc } : k));
        }
      )

      // ── Disputes ────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'disputes' },
        async (payload) => {
          const newDispute = { ...payload.new };
          try {
            if (newDispute.reported_by) {
              const { data: reporter } = await supabase.from('users').select('id, name, email').eq('id', newDispute.reported_by).single();
              if (reporter) newDispute.reporter = reporter;
            }
          } catch (e) { console.warn("Failed to fetch dispute reporter:", e); }

          if (setDisputes) setDisputes(prev => [newDispute, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'disputes' },
        (payload) => {
          const updatedDispute = payload.new;
          if (setDisputes) setDisputes(prev => prev.map(d => d.id === updatedDispute.id ? { ...d, ...updatedDispute } : d));
        }
      )

      .subscribe();

    return () => {
      clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, setStats, setUsers, setProducts, setBookings, setDisputes, setKycSubmissions]);
};

export default useRealtimeAdmin;
