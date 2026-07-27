import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from '../store/authStore';

describe('Zustand Auth Store Unit Tests (Frontend Only)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      initialized: true,
    });
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.initialized).toBe(true);
  });

  it('should allow setting session and user details manually', () => {
    useAuthStore.setState({
      session: { access_token: 'valid-token-123' },
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
      session: { access_token: 'valid-token-123' },
      user: { id: 'user-id-abc', name: 'Real User', email: 'real@rentnear.app' },
      initialized: true,
    });

    await useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('should perform signup and update state directly', async () => {
    const res = await useAuthStore.getState().signUpUser({
      email: 'john@rentnear.app',
      password: 'password123',
      name: 'John Doe',
      phone: '+91 9876543210',
      role: 'owner',
    });

    expect(res.user.email).toBe('john@rentnear.app');
    expect(res.user.name).toBe('John Doe');
    expect(res.user.phone).toBe('+91 9876543210');
    expect(res.user.role).toBe('owner');
    expect(res.session).not.toBeNull();
  });

  it('should perform login directly', async () => {
    const user = await useAuthStore.getState().loginUser({
      email: 'jane@rentnear.app',
      password: 'password123',
    });

    expect(user.email).toBe('jane@rentnear.app');

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.session).not.toBeNull();
  });
});
