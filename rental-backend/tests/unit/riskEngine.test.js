const riskController = require('../../controllers/riskController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('Radar Risk & Fraud Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recalculateUserRisk', () => {
    it('returns 400 if userId is missing', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await riskController.recalculateUserRisk(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calculates risk score based on KYC unverified and failed login counts', async () => {
      const req = { body: { userId: 'user-123' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock user select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123', kyc_status: 'pending', rating_average: 4.5 },
          error: null
        })
      });

      // Mock multi-queries for history events: fraud_events, bookings, disputes
      // We will resolve each sequentially:
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'ev1', event_type: 'failed_login' },
            { id: 'ev2', event_type: 'failed_login' }
          ],
          error: null
        })
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      // Mock user_risk_scores upsert
      supabase.from.mockReturnValueOnce({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { user_id: 'user-123', risk_score: 25 },
          error: null
        })
      });

      await riskController.recalculateUserRisk(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        riskScore: 25 // 15 (KYC pending) + 10 (2 failed logins * 5)
      }));
    });
  });
});
