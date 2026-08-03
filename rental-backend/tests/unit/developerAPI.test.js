const developerController = require('../../controllers/developerController');
const supabase = require('../../config/supabase');
const crypto = require('crypto');

jest.mock('../../config/supabase');

describe('Developer Platform Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateKey', () => {
    it('generates secure raw key prefix and validates output format', async () => {
      const req = {
        user: { id: 'user-123' },
        body: { name: 'Prod API Syncer', scopes: ['read:products'] }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'key-999',
            name: 'Prod API Syncer',
            key_prefix: 'rn_live_',
            scopes: ['read:products'],
            created_at: '2026-08-03'
          },
          error: null
        })
      });

      await developerController.generateKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.key.rawToken.startsWith('rn_live_')).toBe(true);
      
      // Verify rawKey is securely generated with 24 bytes (48 hex chars) + prefix (8 chars) = 56 total length
      expect(payload.key.rawToken.length).toBe(56);
    });
  });

  describe('revokeKey', () => {
    it('updates API key status to revoked', async () => {
      const req = {
        params: { id: 'key-999' },
        user: { id: 'user-123' }
      };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock fetching current key owner
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'key-999', user_id: 'user-123' },
          error: null
        })
      });

      // Mock update status
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await developerController.revokeKey(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'API Key revoked successfully.'
      }));
    });
  });
});
