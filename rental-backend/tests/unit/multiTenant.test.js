const tenantController = require('../../controllers/tenantController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('SaaS Multi-Tenant Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveTenant', () => {
    it('returns 400 if host query is missing', async () => {
      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await tenantController.resolveTenant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('resolves and returns tenant details matching subdomain parameters', async () => {
      const req = { query: { host: 'apex.rentnear.com' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 'tenant-123',
            name: 'Apex rentals',
            subdomain: 'apex',
            branding: { primary_color: '#10b981' }
          },
          error: null
        })
      });

      await tenantController.resolveTenant(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        tenant: expect.objectContaining({ name: 'Apex rentals' })
      }));
    });
  });

  describe('createTenant', () => {
    it('creates new SaaS tenant profiles with branding configurations', async () => {
      const req = {
        body: {
          name: 'Horizon gear',
          subdomain: 'horizon',
          branding: { primary_color: '#f59e0b' }
        }
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
            id: 'tenant-999',
            name: 'Horizon gear',
            subdomain: 'horizon',
            branding: { primary_color: '#f59e0b' }
          },
          error: null
        })
      });

      await tenantController.createTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        tenant: expect.objectContaining({ name: 'Horizon gear' })
      }));
    });
  });
});
