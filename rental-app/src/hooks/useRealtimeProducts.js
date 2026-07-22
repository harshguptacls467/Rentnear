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
import { useEffect, useCallback, useRef } from 'react';
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

  const filtersRef = useRef(filters);
  const sortByRef = useRef(sortBy);

  useEffect(() => {
    filtersRef.current = filters;
    sortByRef.current = sortBy;
  }, [filters, sortBy]);

  // Helper: insert product into sorted list
  const insertSorted = useCallback((list, newProduct) => {
    const updated = [...list];
    const currentSort = sortByRef.current;
    
    if (currentSort === 'price_asc') {
      const idx = updated.findIndex(p => p.price_per_day > newProduct.price_per_day);
      if (idx === -1) updated.push(newProduct);
      else updated.splice(idx, 0, newProduct);
    } else if (currentSort === 'price_desc') {
      const idx = updated.findIndex(p => p.price_per_day < newProduct.price_per_day);
      if (idx === -1) updated.push(newProduct);
      else updated.splice(idx, 0, newProduct);
    } else {
      // newest — prepend
      updated.unshift(newProduct);
    }
    return updated;
  }, []);

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
        async (payload) => {
          const newProduct = payload.new;
          
          // Fetch owner details to populate owner join object
          try {
            const { data: ownerData } = await supabase
              .from('users')
              .select('id, name, avatar_url, rating_average, rating_count, phone')
              .eq('id', newProduct.owner_id)
              .single();
              
            if (ownerData) {
              newProduct.owner = ownerData;
            }
          } catch (err) {
            console.error("Failed to fetch owner details for live product:", err);
          }

          // Mark as "new" for badge display
          addNewProduct(newProduct.id);
          
          // Check filters using ref to avoid effect dependency issues
          const currentFilters = filtersRef.current;
          const filterCategory = currentFilters?.category || 'All';
          const filterSearch = currentFilters?.searchQuery || '';
          
          let matches = true;
          if (filterCategory !== 'All' && newProduct.category !== filterCategory) matches = false;
          if (filterSearch.trim() && !newProduct.title.toLowerCase().includes(filterSearch.toLowerCase())) matches = false;

          // Only add to list if matches current filters
          if (matches) {
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
  }, [isMock, insertSorted, addNewProduct, setProducts, setProductsFeedStatus, showToast]);
};

export default useRealtimeProducts;
