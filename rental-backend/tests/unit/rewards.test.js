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
});
