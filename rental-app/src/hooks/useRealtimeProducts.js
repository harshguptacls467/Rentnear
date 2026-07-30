/**
 * useRealtimeProducts.js
 * 
 * Subscribes to the `products` table for INSERT, UPDATE, DELETE events.
 * Returns a `status` string so pages can show a "🔴 Live" indicator.
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
  const { showToast } = useToast();
  const filtersRef = useRef(filters);
  const sortByRef = useRef(sortBy);
  const setProductsRef = useRef(setProducts);

  useEffect(() => {
    filtersRef.current = filters;
    sortByRef.current = sortBy;
    setProductsRef.current = setProducts;
  }, [filters, sortBy, setProducts]);

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

    useRealtimeStore.getState().setProductsFeedStatus('connecting');

    const channelName = `realtime-products-${Date.now()}`;
    useRealtimeStore.getState().setProductsChannelName(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        async (payload) => {
          const newProduct = payload.new;
          
          try {
            const { data: ownerData } = await supabase
              .from('users')
              .select('id, name, avatar_url, rating_average, rating_count, phone')
              .eq('id', newProduct.owner_id)
              .maybeSingle();
              
            if (ownerData) {
              newProduct.owner = ownerData;
            }
          } catch (err) {
            console.error("Failed to fetch owner details for live product:", err);
          }

          useRealtimeStore.getState().addNewProduct(newProduct.id);
          
          const currentFilters = filtersRef.current;
          const filterCategory = currentFilters?.category || 'All';
          const filterSearch = currentFilters?.searchQuery || '';
          
          let matches = true;
          if (filterCategory !== 'All' && newProduct.category !== filterCategory) matches = false;
          if (filterSearch.trim() && !newProduct.title?.toLowerCase().includes(filterSearch.toLowerCase())) matches = false;

          if (matches && typeof setProductsRef.current === 'function') {
            setProductsRef.current(prev => insertSorted(prev || [], newProduct));
            showToast(`🆕 New item listed: "${newProduct.title}"`, 'info');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const updated = payload.new;
          const currentFilters = filtersRef.current;
          const matchesFilters = (product) => {
            const filterCategory = currentFilters?.category || 'All';
            const filterSearch = currentFilters?.searchQuery || '';
            const filterOwnerId = currentFilters?.ownerId;
            const filterStatus = currentFilters?.status;
            let ok = true;
            if (filterCategory !== 'All' && product.category !== filterCategory) ok = false;
            if (filterSearch && !product.title?.toLowerCase().includes(filterSearch.toLowerCase())) ok = false;
            if (filterOwnerId && product.owner_id !== filterOwnerId) ok = false;
            if (filterStatus && product.status !== filterStatus) ok = false;
            if (!filterStatus && (product.status === 'hidden' || product.status === 'rejected')) ok = false;
            return ok;
          };
          if (typeof setProductsRef.current === 'function') {
            setProductsRef.current(prev => {
              const currentList = Array.isArray(prev) ? prev : [];
              const exists = currentList.some(p => p.id === updated.id);
              const matches = matchesFilters(updated);
              if (!matches) {
                return currentList.filter(p => p.id !== updated.id);
              }
              if (exists) {
                return currentList.map(p => p.id === updated.id ? { ...p, ...updated } : p);
              }
              return insertSorted(currentList, updated);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          const deleted = payload.old;
          if (typeof setProductsRef.current === 'function') {
            setProductsRef.current(prev => (Array.isArray(prev) ? prev : []).filter(p => p.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          useRealtimeStore.getState().setProductsFeedStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          useRealtimeStore.getState().setProductsFeedStatus('disconnected');
        }
      });

    return () => {
      useRealtimeStore.getState().setProductsFeedStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [isMock, insertSorted, showToast]);
};

export default useRealtimeProducts;
