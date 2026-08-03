const aiController = require('../../controllers/aiController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('AI Rental Assistant Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queryAssistant', () => {
    it('returns 400 if prompt is missing', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await aiController.queryAssistant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('matches security deposit FAQ prompt successfully', async () => {
      const req = { body: { prompt: 'How do deposits work?' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock database logging insert
      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({})
      });

      await aiController.queryAssistant(req, res, next);
      
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.response).toContain('deposit');
      expect(payload.suggestedFollowUps).toContain('Can I cancel a booking?');
    });

    it('filters catalog items and attaches rich cards for search queries', async () => {
      const req = { body: { prompt: 'I need a camera under $100' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock catalog fetch matching 'Cameras' category
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const lteMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue({
        data: [
          { id: 'cam-1', title: 'Sony A7', category: 'Cameras', price_per_day: 75, images: ['image.jpg'] }
        ],
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'products') {
          return { select: selectMock, eq: eqMock, lte: lteMock, limit: limitMock };
        }
        if (table === 'ai_interactions') {
          return { insert: jest.fn().mockResolvedValue({}) };
        }
        return {};
      });

      await aiController.queryAssistant(req, res, next);

      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.richCards.length).toBe(1);
      expect(payload.richCards[0].title).toBe('Sony A7');
    });
  });
});
