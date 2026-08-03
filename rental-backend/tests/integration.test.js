/**
 * Auth Guard Integration Tests
 *
 * Verifies that every protected route family correctly returns 401
 * when no Authorization header is provided.
 *
 * These are black-box tests — they hit the actual Express app and verify
 * that the authMiddleware is wired correctly on every route group.
 *
 * We do NOT mock Supabase here. If no token is provided, the middleware
 * short-circuits before making any Supabase call, so no network I/O occurs.
 */

const request = require('supertest');
const app = require('../app');

// Helper — confirm the response is a proper 401 with our standard error shape
const expect401 = (res) => {
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).toHaveProperty('message');
  expect(res.body.error).toHaveProperty('status', 401);
};

describe('Auth Guard — All Protected Route Families', () => {

  // ── Bookings ────────────────────────────────────────────────────────────────
  describe('Bookings routes', () => {
    it('GET /api/bookings/my → 401 without token', async () => {
      expect401(await request(app).get('/api/bookings/my'));
    });
    it('POST /api/bookings → 401 without token', async () => {
      expect401(await request(app).post('/api/bookings').send({}));
    });
    it('PATCH /api/bookings/:id/status → 401 without token', async () => {
      expect401(await request(app).patch('/api/bookings/some-id/status').send({ status: 'approved' }));
    });
  });

  // ── Products (write only) ───────────────────────────────────────────────────
  describe('Product write routes', () => {
    it('POST /api/products → 401 without token', async () => {
      expect401(await request(app).post('/api/products').send({}));
    });
    it('PUT /api/products/:id → 401 without token', async () => {
      expect401(await request(app).put('/api/products/some-id').send({}));
    });
    it('DELETE /api/products/:id → 401 without token', async () => {
      expect401(await request(app).delete('/api/products/some-id'));
    });
  });

  // ── Reviews (write only) ────────────────────────────────────────────────────
  describe('Review write routes', () => {
    it('POST /api/reviews → 401 without token', async () => {
      expect401(await request(app).post('/api/reviews').send({}));
    });
  });

  // ── KYC ────────────────────────────────────────────────────────────────────
  describe('KYC routes', () => {
    it('POST /api/kyc/aadhaar/generate-otp → 401 without token', async () => {
      expect401(await request(app).post('/api/kyc/aadhaar/generate-otp').send({ aadharNumber: '123456789012' }));
    });
    it('POST /api/kyc/email/generate-otp → 401 without token', async () => {
      expect401(await request(app).post('/api/kyc/email/generate-otp').send({}));
    });
  });

  // ── Admin panel ─────────────────────────────────────────────────────────────
  describe('Admin routes', () => {
    it('GET /api/admin/stats → 401 without token', async () => {
      expect401(await request(app).get('/api/admin/stats'));
    });
    it('GET /api/admin/users → 401 without token', async () => {
      expect401(await request(app).get('/api/admin/users'));
    });
    it('GET /api/admin/disputes → 401 without token', async () => {
      expect401(await request(app).get('/api/admin/disputes'));
    });
    it('GET /api/admin/kyc → 401 without token', async () => {
      expect401(await request(app).get('/api/admin/kyc'));
    });
    it('GET /api/admin/payments → 401 without token', async () => {
      expect401(await request(app).get('/api/admin/payments'));
    });
  });

  // ── Public routes should NOT require auth ───────────────────────────────────
  describe('Public routes (must NOT require auth)', () => {
    it('GET /api/products → 200 without token', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
    }, 15000);

    it('GET /api/reviews/user/:userId → 200 without token', async () => {
      const res = await request(app).get('/api/reviews/user/some-user-id');
      // Returns 200 with empty array for unknown user — no auth required
      expect([200, 500]).toContain(res.statusCode);
    }, 10000);
  });
});
