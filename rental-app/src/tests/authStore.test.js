import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../store/authStore';

describe('Zustand Auth Store Unit Tests (Frontend Only)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }
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

  it('should perform signup and request OTP step', async () => {
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
    expect(res.session).toBeNull();
  });

  it('should verify OTP and preserve full user metadata', async () => {
    await useAuthStore.getState().signUpUser({
      email: 'harsh@rentnear.app',
      password: 'password123',
      name: 'Harsh Gupta',
      phone: '+91 9999988888',
      role: 'renter',
    });

    const user = await useAuthStore.getState().verifySignupOtp('harsh@rentnear.app', '123456');

    expect(user.email).toBe('harsh@rentnear.app');
    expect(user.name).toBe('Harsh Gupta');
    expect(user.phone).toBe('+91 9999988888');
    expect(user.role).toBe('renter');

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.session).not.toBeNull();
    expect(state.user.name).toBe('Harsh Gupta');
  });

  it('should reject invalid or incomplete OTP code', async () => {
    await expect(
      useAuthStore.getState().verifySignupOtp('john@rentnear.app', '123')
    ).rejects.toThrow('Please enter a valid 6-digit verification code.');
  });

  it('should perform login directly without OTP', async () => {
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
