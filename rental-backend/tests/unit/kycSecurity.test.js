// rental-backend/tests/unit/kycSecurity.test.js
const kycController = require('../../controllers/kycController');
const supabase = require('../../config/supabase');
const cache = require('../../utils/cache');

jest.mock('../../config/supabase');
jest.mock('../../utils/cache');

describe('KYC Email OTP Security & Rate Limiting Hardening', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateEmailOtp', () => {
    it('generates OTP server-side, saves it to cache, and returns it in mock mode (RESEND_API_KEY is missing)', async () => {
      delete process.env.RESEND_API_KEY;
      const req = {
        user: { id: 'user-uuid-123' },
        body: { email: 'user@example.com' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      await kycController.generateEmailOtp(req, res, next);

      expect(cache.set).toHaveBeenCalledWith(
        'otp:email:user-uuid-123',
        expect.objectContaining({
          code: expect.any(String),
          email: 'user@example.com'
        }),
        600
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isSimulated: true,
          emailOtp: expect.stringMatching(/^\d{6}$/),
          message: 'Simulated email verification OTP sent!'
        })
      );
    });

    it('does NOT leak the OTP code in the API response when in production mode (RESEND_API_KEY is configured)', async () => {
      process.env.RESEND_API_KEY = 're_prodkey123456';
      const req = {
        user: { id: 'user-uuid-123' },
        body: { email: 'user@example.com' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      // Mock the fetch call to Resend API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'email-id-123' })
      });

      await kycController.generateEmailOtp(req, res, next);

      expect(cache.set).toHaveBeenCalledWith(
        'otp:email:user-uuid-123',
        expect.objectContaining({
          code: expect.any(String),
          email: 'user@example.com'
        }),
        600
      );
      
      const responsePayload = res.json.mock.calls[0][0];
      expect(responsePayload).toBeDefined();
      expect(responsePayload.success).toBe(true);
      expect(responsePayload.isSimulated).toBe(false);
      expect(responsePayload.emailOtp).toBeUndefined(); // Crucial security requirement
    });
  });

  describe('verifyEmailOtp', () => {
    it('verifies correctly and updates user DB when correct OTP is provided', async () => {
      process.env.RESEND_API_KEY = 're_prodkey123456';
      const req = {
        user: { id: 'user-uuid-123' },
        body: { otp: '123456' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      cache.get.mockResolvedValue({ code: '123456', email: 'user@example.com', attempts: 0 });
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await kycController.verifyEmailOtp(req, res, next);

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(cache.set).toHaveBeenCalledWith('otp:email:user-uuid-123', null, 0); // Invalidation check
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Email address verified successfully!'
      }));
    });

    it('returns 400 for incorrect OTP and tracks failed attempts', async () => {
      process.env.RESEND_API_KEY = 're_prodkey123456';
      const req = {
        user: { id: 'user-uuid-123' },
        body: { otp: 'wrong-otp' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      cache.get.mockResolvedValue({ code: '123456', email: 'user@example.com', attempts: 1 });

      await kycController.verifyEmailOtp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid verification code.'
      }));
      expect(cache.set).toHaveBeenCalledWith(
        'otp:email:user-uuid-123',
        expect.objectContaining({ attempts: 2 }),
        600
      );
    });

    it('blocks and invalidates session after 5 failed brute-force attempts', async () => {
      process.env.RESEND_API_KEY = 're_prodkey123456';
      const req = {
        user: { id: 'user-uuid-123' },
        body: { otp: 'wrong-otp' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      // Mock cache returning 4 prior failed attempts (this makes it the 5th attempt)
      cache.get.mockResolvedValue({ code: '123456', email: 'user@example.com', attempts: 4 });

      await kycController.verifyEmailOtp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Too many incorrect attempts. Please request a new OTP.'
      }));
      expect(cache.set).toHaveBeenCalledWith('otp:email:user-uuid-123', null, 0); // Invalidated
    });

    it('returns 400 for expired or missing OTP session in cache', async () => {
      process.env.RESEND_API_KEY = 're_prodkey123456';
      const req = {
        user: { id: 'user-uuid-123' },
        body: { otp: '123456' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      cache.get.mockResolvedValue(null); // expired or not found

      await kycController.verifyEmailOtp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Verification code expired. Please request a new one.'
      }));
    });

    it('returns 400 when OTP parameter is completely missing from request body', async () => {
      process.env.RESEND_API_KEY = 're_prodkey123456';
      const req = {
        user: { id: 'user-uuid-123' },
        body: {} // missing otp
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      await kycController.verifyEmailOtp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Verification OTP is required.'
      }));
    });
  });
});
