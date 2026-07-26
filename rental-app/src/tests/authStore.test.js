import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../store/authStore';

// Define mocks with 'mock' prefix so they are accessible inside the hoisted vi.mock
const mockResend = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSingle = vi.fn(() => Promise.resolve({ data: { id: 'user-123', name: 'Test User', email: 'test@rentnear.app' }, error: null }));
const mockEq = vi.fn(() => ({
  single: mockSingle,
}));
const mockSelect = vi.fn(() => ({
  eq: mockEq,
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('../supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        resend: (...args) => mockResend(...args),
        verifyOtp: (...args) => mockVerifyOtp(...args),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
      },
      from: (...args) => mockFrom(...args),
    },
  };
});

describe('Zustand Auth Store Unit Tests', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      session: null,
      initialized: false,
    });
    vi.clearAllMocks();
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

  describe('OTP verification and resending', () => {
    it('should call resendSignupOtp and trigger supabase.auth.resend', async () => {
      mockResend.mockResolvedValueOnce({ error: null });

      await useAuthStore.getState().resendSignupOtp('test@rentnear.app');

      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@rentnear.app',
      });
    });

    it('should throw an error if resendSignupOtp supabase call fails', async () => {
      mockResend.mockResolvedValueOnce({ error: { message: 'Failed to resend' } });

      await expect(
        useAuthStore.getState().resendSignupOtp('test@rentnear.app')
      ).rejects.toThrow('Failed to resend');
    });

    it('should call verifySignupOtp and verify email token, updating the store state', async () => {
      const mockSession = { access_token: 'otp-session-token' };
      const mockUser = { id: 'user-123', email: 'test@rentnear.app' };
      mockVerifyOtp.mockResolvedValueOnce({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const fullUser = await useAuthStore.getState().verifySignupOtp('test@rentnear.app', '123456');

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'test@rentnear.app',
        token: '123456',
        type: 'signup',
      });

      // It should sync public user details
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(fullUser).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@rentnear.app',
      });

      // The store state should be updated with the session and user
      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(fullUser);
    });

    it('should throw an error if verifySignupOtp supabase call fails', async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid code' },
      });

      await expect(
        useAuthStore.getState().verifySignupOtp('test@rentnear.app', '000000')
      ).rejects.toThrow('Invalid code');
    });
  });
});
