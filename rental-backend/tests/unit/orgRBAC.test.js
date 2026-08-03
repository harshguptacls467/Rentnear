const orgController = require('../../controllers/orgController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('RentNear Pro Organization RBAC Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrg', () => {
    it('creates organization and adds user as owner', async () => {
      const req = {
        user: { id: 'owner-123' },
        body: { name: 'Rent Co', taxId: 'GST-123' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock organization insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'org-999', name: 'Rent Co', tax_id: 'GST-123' },
          error: null
        })
      });

      // Mock membership insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await orgController.createOrg(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        organization: expect.objectContaining({ name: 'Rent Co' })
      }));
    });
  });

  describe('inviteMember', () => {
    it('generates invitation token and link', async () => {
      const req = {
        params: { id: 'org-999' },
        body: { email: 'staff@rent.co', role: 'staff' }
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
          data: { id: 'inv-123', email: 'staff@rent.co' },
          error: null
        })
      });

      await orgController.inviteMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        inviteLink: expect.stringContaining('/workspace/accept')
      }));
    });
  });

  describe('bulkUploadInventory', () => {
    it('inserts bulk products linked to organization', async () => {
      const req = {
        params: { id: 'org-999' },
        user: { id: 'owner-123' },
        body: {
          products: [
            { title: 'Item A', category: 'Tools', price_per_day: 15 },
            { title: 'Item B', category: 'Tools', price_per_day: 25 }
          ]
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'p1', title: 'Item A', organization_id: 'org-999' },
            { id: 'p2', title: 'Item B', organization_id: 'org-999' }
          ],
          error: null
        })
      });

      await orgController.bulkUploadInventory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json.mock.calls[0][0].products.length).toBe(2);
    });
  });
});
