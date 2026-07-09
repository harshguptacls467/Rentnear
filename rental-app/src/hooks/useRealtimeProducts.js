/**
 * useRealtimeProducts.js
 * 
 * Subscribes to the `products` table for INSERT, UPDATE, DELETE events.
 * Returns a `status` string so pages can show a "🔴 Live" indicator.
 * 
 * How Supabase Realtime works here:
 * - We create a "channel" (a named WebSocket room)
 * - We listen for `postgres_changes` events on the `products` table
 * - When Postgres commits an INSERT/UPDATE/DELETE, Supabase broadcasts it
 *   to all subscribers of that channel
 * - RLS still applies: Supabase checks the user's JWT before broadcasting
 * 
 * Memory leak prevention:
 * - Returns a cleanup function that calls `supabase.removeChannel`
 * - React calls this cleanup when the component unmounts
 */
import { useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import useRealtimeStore from '../store/realtimeStore';
import { useToast } from '../context/ToastContext';

/**
 * @param {Function} setProducts - State setter from the consuming page
 * @param {boolean} isMock - Skip subscription in mock/demo mode
 * @param {Object} filters - { category, searchQuery } for client-side filtering
 * @param {string} sortBy - Current sort ('newest' | 'price_asc' | 'price_desc')
 */
const useRealtimeProducts = (setProducts, isMock, filters = {}, sortBy = 'newest') => {
  const { addNewProduct, setProductsFeedStatus } = useRealtimeStore();
  const { showToast } = useToast();

  // Helper: does this product match current filters?
  const matchesFilters = useCallback((product) => {
    const { category = 'All', searchQuery = '' } = filters;
    if (category !== 'All' && product.category !== category) return false;
    if (searchQuery.trim() && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }, [filters]);

  // Helper: insert product into sorted list
  const insertSorted = useCallback((list, newProduct) => {
    const updated = [...list];
    if (sortBy === 'price_asc') {
      const idx = updated.findIndex(p => p.price_per_day > newProduct.price_per_day);
      if (idx === -1) updated.push(newProduct);
      else updated.splice(idx, 0, newProduct);
    } else if (sortBy === 'price_desc') {
      const idx = updated.findIndex(p => p.price_per_day < newProduct.price_per_day);
      if (idx === -1) updated.push(newProduct);
      else updated.splice(idx, 0, newProduct);
    } else {
      // newest — prepend
      updated.unshift(newProduct);
    }
    return updated;
  }, [sortBy]);

  useEffect(() => {
    // Never subscribe in mock/demo mode
    if (isMock) return;

    setProductsFeedStatus('connecting');

    // Unique channel name prevents collisions if the same hook
    // is mounted multiple times (e.g. Home + Products both open)
    const channelName = `realtime-products-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          const newProduct = payload.new;
          // Mark as "new" for badge display
          addNewProduct(newProduct.id);
          // Only add to list if matches current filters
          if (matchesFilters(newProduct)) {
            setProducts(prev => insertSorted(prev, newProduct));
            showToast(`🆕 New item listed: "${newProduct.title}"`, 'info');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const updated = payload.new;
          setProducts(prev =>
            prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          const deleted = payload.old;
          setProducts(prev => prev.filter(p => p.id !== deleted.id));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setProductsFeedStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setProductsFeedStatus('disconnected');
        }
      });

    // Cleanup: CRITICAL — prevents WebSocket memory leaks
    return () => {
      setProductsFeedStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [isMock, matchesFilters, insertSorted, addNewProduct, setProducts, setProductsFeedStatus, showToast]);
};

export default useRealtimeProducts;
