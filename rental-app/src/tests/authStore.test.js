import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../store/authStore';

const mockSignUp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockResend = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignInWithOAuth = vi.fn();

const storageStore = {};
const localStorageMock = {
  getItem: vi.fn((key) => storageStore[key] || null),
  setItem: vi.fn((key, value) => { storageStore[key] = String(value); }),
  removeItem: vi.fn((key) => { delete storageStore[key]; }),
  clear: vi.fn(() => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }),
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
} else {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
}

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: (...args) => mockSignUp(...args),
      verifyOtp: (...args) => mockVerifyOtp(...args),
      resend: (...args) => mockResend(...args),
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signOut: (...args) => mockSignOut(...args),
      resetPasswordForEmail: (...args) => mockResetPasswordForEmail(...args),
      updateUser: (...args) => mockUpdateUser(...args),
      signInWithOAuth: (...args) => mockSignInWithOAuth(...args),
    },
    from: vi.fn(() => ({
      upsert: vi.fn((profileData) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: profileData,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('Zustand Auth Store Unit Tests (Supabase Auth)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      pendingUser: null,
      initialized: true,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
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

  it('should store rememberMe preference in localStorage when loginUser is called', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'usr_rem', email: 'remember@rentnear.app', user_metadata: { name: 'Remember User' } },
        session: { access_token: 'rem_token_123' },
      },
      error: null,
    });

    await useAuthStore.getState().loginUser({
      email: 'remember@rentnear.app',
      password: 'password123',
      rememberMe: false,
    });

    expect(localStorage.getItem('rentnear_remember_me')).toBe('false');
  });

  it('should logout cleanly', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });
    useAuthStore.setState({
      session: { access_token: 'valid-token-123' },
      user: { id: 'user-id-abc', name: 'Real User', email: 'real@rentnear.app' },
      initialized: true,
    });

    await useAuthStore.getState().logout();
    
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('should support global logout scope to revoke sessions across all devices', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });
    useAuthStore.setState({
      session: { access_token: 'valid-token-123' },
      user: { id: 'user-id-abc', name: 'Real User', email: 'real@rentnear.app' },
      initialized: true,
    });

    await useAuthStore.getState().logout({ scope: 'global' });
    
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('should call signUpUser and trigger supabase.auth.signUp', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'usr_1', email: 'john@rentnear.app' }, session: null },
      error: null,
    });

    const res = await useAuthStore.getState().signUpUser({
      email: 'john@rentnear.app',
      password: 'password123',
      name: 'John Doe',
      phone: '+91 9876543210',
      role: 'owner',
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'john@rentnear.app',
      password: 'password123',
      options: {
        data: {
          name: 'John Doe',
          phone: '+91 9876543210',
          role: 'owner',
        },
      },
    });

    expect(res.user.email).toBe('john@rentnear.app');
    expect(res.session).toBeNull();
  });

  it('should verify Email OTP code and set active session', async () => {
    mockVerifyOtp.mockResolvedValueOnce({
      data: {
        user: { id: 'usr_1', email: 'harsh@rentnear.app' },
        session: { access_token: 'valid_otp_session' },
      },
      error: null,
    });

    const user = await useAuthStore.getState().verifySignupOtp('harsh@rentnear.app', '123456');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'harsh@rentnear.app',
      token: '123456',
      type: 'signup',
    });

    expect(user).not.toBeNull();
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.session).not.toBeNull();
  });

  it('should reject invalid or incomplete OTP code', async () => {
    await expect(
      useAuthStore.getState().verifySignupOtp('john@rentnear.app', '123')
    ).rejects.toThrow('Please enter a valid 6-digit verification code.');
  });

  it('should perform loginUser successfully for verified account', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'usr_verified', email: 'verified@rentnear.app' },
        session: { access_token: 'login_token_123' },
      },
      error: null,
    });

    const user = await useAuthStore.getState().loginUser({
      email: 'verified@rentnear.app',
      password: 'password123',
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'verified@rentnear.app',
      password: 'password123',
    });

    expect(user.email).toBe('verified@rentnear.app');
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.session).not.toBeNull();
  });

  it('should propagate unverified email error on loginUser', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    });

    await expect(
      useAuthStore.getState().loginUser({
        email: 'unverified@rentnear.app',
        password: 'password123',
      })
    ).rejects.toThrow('Email not confirmed');
  });

  it('should trigger sendPasswordResetOtp using resetPasswordForEmail', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const ok = await useAuthStore.getState().sendPasswordResetOtp('forgot@rentnear.app');

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('forgot@rentnear.app');
    expect(ok).toBe(true);
  });

  it('should verify recovery OTP token using verifyPasswordResetOtp', async () => {
    mockVerifyOtp.mockResolvedValueOnce({
      data: { session: { access_token: 'recovery_session' } },
      error: null,
    });

    const ok = await useAuthStore.getState().verifyPasswordResetOtp('forgot@rentnear.app', '654321');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'forgot@rentnear.app',
      token: '654321',
      type: 'recovery',
    });
    expect(ok).toBe(true);
  });

  it('should update user password using updateUserPassword', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null });
    mockSignOut.mockResolvedValueOnce({ error: null });

    const ok = await useAuthStore.getState().updateUserPassword('newPassword123');

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPassword123' });
    expect(ok).toBe(true);
  });

  it('should trigger Google OAuth login via loginWithGoogle', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    });

    const res = await useAuthStore.getState().loginWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    expect(res.provider).toBe('google');
  });

  it('should update user profile details via updateUserProfile', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null });
    useAuthStore.setState({
      user: { id: 'usr_update', name: 'Old Name', phone: '+91 0000000000', email: 'user@rentnear.app' },
      session: { access_token: 'token_123' },
      initialized: true,
    });

    const updated = await useAuthStore.getState().updateUserProfile({
      name: 'New Updated Name',
      phone: '+91 9999988888',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=new',
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: {
        name: 'New Updated Name',
        phone: '+91 9999988888',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=new',
      },
    });

    expect(updated.name).toBe('New Updated Name');
    expect(updated.phone).toBe('+91 9999988888');
    const state = useAuthStore.getState();
    expect(state.user.name).toBe('New Updated Name');
  });
});
