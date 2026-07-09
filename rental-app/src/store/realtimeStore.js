/**
 * realtimeStore.js
 * 
 * Central Zustand store for all real-time UI state.
 * Pages read from this store instead of managing their own RT state.
 * 
 * Why a separate store?
 * - Keeps authStore focused on auth only
 * - Allows any component tree level to read RT state without prop drilling
 * - Single cleanup point for all subscriptions
 */
import { create } from 'zustand';

const NEW_PRODUCT_TTL_MS = 30_000; // "New" badge expires after 30 seconds

const useRealtimeStore = create((set, get) => ({
  // ─── New Products (for "New" badge) ───────────────────────────────────────
  // A Map of productId -> timestamp when it was first seen
  newProductIds: new Map(),

  addNewProduct: (productId) => {
    const now = Date.now();
    set((state) => {
      const next = new Map(state.newProductIds);
      next.set(productId, now);
      return { newProductIds: next };
    });
    // Auto-expire badge after TTL
    setTimeout(() => {
      set((state) => {
        const next = new Map(state.newProductIds);
        next.delete(productId);
        return { newProductIds: next };
      });
    }, NEW_PRODUCT_TTL_MS);
  },

  isNewProduct: (productId) => {
    return get().newProductIds.has(productId);
  },

  // ─── Online Users (for presence) ──────────────────────────────────────────
  // A Set of user_ids currently online
  onlineUsers: new Set(),

  setOnlineUsers: (userIds) => {
    set({ onlineUsers: new Set(userIds) });
  },

  addOnlineUser: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    });
  },

  removeOnlineUser: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    });
  },

  isUserOnline: (userId) => {
    return get().onlineUsers.has(userId);
  },

  // ─── Chat Unread Count (for Navbar badge) ─────────────────────────────────
  unreadMessageCount: 0,

  incrementUnread: () => {
    set((state) => ({ unreadMessageCount: state.unreadMessageCount + 1 }));
  },

  resetUnread: () => {
    set({ unreadMessageCount: 0 });
  },

  // ─── Live subscription status (UI indicator) ──────────────────────────────
  // 'connecting' | 'connected' | 'disconnected'
  productsFeedStatus: 'disconnected',
  setProductsFeedStatus: (status) => set({ productsFeedStatus: status }),

  bookingsFeedStatus: 'disconnected',
  setBookingsFeedStatus: (status) => set({ bookingsFeedStatus: status }),
}));

export default useRealtimeStore;
