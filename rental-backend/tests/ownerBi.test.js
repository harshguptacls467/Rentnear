const request = require('supertest');
const app = require('../app');
const supabase = require('../config/supabase');

// Mock supabase client to intercept database operations during tests
jest.mock('../config/supabase', () => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockMaybeSingle = jest.fn().mockResolvedValue({
    data: { id: '00000000-0000-0000-0000-000000000001', rating_average: 4.9, trust_score: 98 },
    error: null
  });
  
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: '00000000-0000-0000-0000-000000000001', email: 'owner@rentnear.com' }
        },
        error: null
      })
    },
    from: jest.fn().mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [
                {
                  id: 'b1',
                  status: 'completed',
                  total_amount: '4500.00',
                  deposit_amount: '1000.00',
                  created_at: new Date().toISOString(),
                  start_date: '2026-08-01',
                  end_date: '2026-08-03',
                  renter_id: 'renter-1',
                  product_id: 'p1',
                  product: { category: 'Cameras', title: 'Sony FX3' },
                  renter: { name: 'Harsh Gupta', email: 'harsh@example.com' }
                }
              ],
              error: null
            })
          })
        };
      }
      if (table === 'payouts') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [
                { id: 'pay1', amount: '4500.00', status: 'completed', created_at: new Date().toISOString() }
              ],
              error: null
            })
          })
        };
      }
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [
                { id: 'p1', title: 'Sony FX3', views_count: 150, category: 'Cameras', is_available: true }
              ],
              error: null
            })
          })
        };
      }
      return {
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        maybeSingle: mockMaybeSingle,
        update: () => ({
          eq: () => Promise.resolve({ data: { success: true }, error: null })
        })
      };
    })
  };
});

describe('Owner Business Intelligence (BI) Analytics API', () => {

  describe('GET /api/analytics/owner/dashboard', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/analytics/owner/dashboard');
      expect(res.statusCode).toBe(401);
    });

    it('should return 200 with comprehensive analytics payload', async () => {
      const res = await request(app)
        .get('/api/analytics/owner/dashboard')
        .set('Authorization', 'Bearer valid-mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalRevenue).toBe(4500);
      expect(res.body.charts).toBeDefined();
      expect(res.body.bookingStats).toBeDefined();
      expect(res.body.customerAnalytics).toBeDefined();
      expect(res.body.inventoryHealth).toBeDefined();
    });
  });

  describe('GET /api/analytics/owner/notifications', () => {
    it('should retrieve list of milestone/demand notifications', async () => {
      const res = await request(app)
        .get('/api/analytics/owner/notifications')
        .set('Authorization', 'Bearer valid-mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/analytics/owner/notifications/:id/read', () => {
    it('should acknowledge notification read status', async () => {
      const res = await request(app)
        .post('/api/analytics/owner/notifications/n1/read')
        .set('Authorization', 'Bearer valid-mock-token')
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/owner/reports/download', () => {
    it('should generate financial report as downloadable CSV attachment', async () => {
      const res = await request(app)
        .get('/api/analytics/owner/reports/download')
        .query({ type: 'revenue' })
        .set('Authorization', 'Bearer valid-mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename=RentNear_revenue_Report.csv');
      expect(res.text).toContain('Sony FX3');
    });
  });

});
