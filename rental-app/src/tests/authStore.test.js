import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../store/authStore';

describe('Zustand Auth Store Unit Tests', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      session: null,
      initialized: false,
    });
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.initialized).toBe(false);
  });

  it('should allow setting session and user details manually', () => {
    useAuthStore.setState({
      session: { access_token: 'valid-token-123', user: { id: 'user-id-abc' } },
      user: { id: 'user-id-abc', name: 'Real User', email: 'real@rentnear.app' },
      initialized: true,
    });
    
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user.email).toBe('real@rentnear.app');
    expect(state.user.name).toBe('Real User');
    expect(state.session.access_token).toBe('valid-token-123');
  });

  it('should logout cleanly', async () => {
    useAuthStore.setState({
      session: { access_token: 'valid-token-123', user: { id: 'user-id-abc' } },
      user: { id: 'user-id-abc', name: 'Real User', email: 'real@rentnear.app' },
      initialized: true,
    });

    await useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });
});
