import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../store/authStore';

// Mock localStorage for Vitest Node environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Zustand Auth Store Unit Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.initialized).toBe(false);
  });

  it('should support mock login and set user details', () => {
    useAuthStore.getState().mockLogin('testuser@example.com', { name: 'Test User' });
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user.email).toBe('testuser@example.com');
    expect(state.user.name).toBe('Test User');
    expect(state.isMock).toBe(true);
  });

  it('should logout cleanly', async () => {
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });
});
