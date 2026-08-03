const federationController = require('../../controllers/federationController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('Global Marketplace Federation Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('federatedSearch', () => {
    it('returns empty list if no tenants are opted in', async () => {
      const req = { query: {} };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock zero active registries
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      await federationController.federatedSearch(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: []
      }));
    });

    it('returns products from opted-in tenants', async () => {
      const req = { query: { query: 'generator' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock one active registry
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ tenant_id: 'tenant-123' }],
          error: null
        })
      });

      // Mock product search results
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: [
            { id: 'p1', title: 'Industrial Generator', tenant_id: 'tenant-123' }
          ],
          error: null
        })
      });

      await federationController.federatedSearch(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: expect.arrayContaining([
          expect.objectContaining({ title: 'Industrial Generator' })
        ])
      }));
    });
  });

  describe('reconcileWalletSettlement', () => {
    it('resolves settlements status to cleared', async () => {
      const req = { body: { settlementId: 'set-999' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'set-999', status: 'cleared' },
          error: null
        })
      });

      await federationController.reconcileWalletSettlement(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Settlement cleared successfully.',
        settlement: expect.objectContaining({ status: 'cleared' })
      }));
    });
  });
});
