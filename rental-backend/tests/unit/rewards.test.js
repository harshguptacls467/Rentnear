const rewardsController = require('../../controllers/rewardsController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('Rewards Controller Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayout', () => {
    it('returns error if booking is not completed', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { renter_id: 1, status: 'active' },
          error: null
        })
      });

      const res = await rewardsController.processPayout(100);
      expect(res.success).toBe(false);
      expect(res.message).toContain('not completed');
    });

    it('returns success but no action if no pending referral exists', async () => {
      // Mock booking
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { renter_id: 2, status: 'completed' },
          error: null
        })
      });

      // Mock referral lookup - not found
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const res = await rewardsController.processPayout(100);
      expect(res.success).toBe(true);
      expect(res.message).toContain('No pending referral');
    });

    it('processes payout successfully when criteria are met', async () => {
      // 1. Mock booking
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { renter_id: 'renter-123', status: 'completed' },
          error: null
        })
      });

      // 2. Mock referral
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'ref-1', referrer_id: 'referrer-456', status: 'pending' },
          error: null
        })
      });

      // 3. Mock referral update
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({})
      });

      // 4. Mock users fetch
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'referrer-456', wallet_balance: 10 },
            { id: 'renter-123', wallet_balance: 0 }
          ]
        })
      });

      // Mock Promise.all updates and inserts
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({});
      const insertMock = jest.fn().mockResolvedValue({});

      // We don't perfectly mock every sub-call in the Promise.all for simple unit testing here,
      // but we ensure the function resolves properly.
      supabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return { update: updateMock, eq: eqMock };
        }
        if (table === 'wallet_transactions') {
          return { insert: insertMock };
        }
        return {};
      });

      const res = await rewardsController.processPayout(100);
      expect(res.success).toBe(true);
      expect(res.message).toContain('Payout triggered successfully');
    });
  });

  describe('getDashboard security', () => {
    it('allows access if logged-in user is the target user', async () => {
      const req = {
        user: { id: 'user-123', is_admin: false },
        params: { userId: 'user-123' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      // Mock database calls for wallet_balance, referrals, and transactions
      supabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { wallet_balance: 50, referral_code: 'REF123' },
              error: null
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [] })
        };
      });

      await rewardsController.getDashboard(req, res, next);
      expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('blocks access with 403 if user is not target user and not an admin (IDOR Check)', async () => {
      const req = {
        user: { id: 'attacker-id', is_admin: false },
        params: { userId: 'victim-id' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      await rewardsController.getDashboard(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Unauthorized access')
        })
      }));
    });
  });

  describe('triggerPayout authorization', () => {
    it('blocks manual payout triggering if the user is not an admin', async () => {
      const req = {
        user: { id: 'user-123', is_admin: false },
        body: { bookingId: 'booking-xyz' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      await rewardsController.triggerPayout(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Access denied')
        })
      }));
    });
  });
});
