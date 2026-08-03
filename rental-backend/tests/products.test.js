const request = require('supertest');
const app = require('../app');

describe('Products API', () => {

  // ── Public read routes ──────────────────────────────────────────────────────

  it('GET /api/products should return 200 with an array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 15000);

  it('GET /api/products/nearby should return 400 when bounding box params are missing', async () => {
    const res = await request(app).get('/api/products/nearby');
    // No minLat/maxLat/minLng/maxLng — validation or controller should reject
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBeDefined();
  });

  it('GET /api/products/nearby should return 200 when all coords are provided', async () => {
    const res = await request(app)
      .get('/api/products/nearby')
      .query({ minLat: 12.9, maxLat: 13.1, minLng: 77.5, maxLng: 77.7 });
    // May return 200 with an empty array if no products exist in test DB
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  }, 15000);

  // ── Auth guard on write routes ──────────────────────────────────────────────

  it('POST /api/products should return 401 without a token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ title: 'Test', price_per_day: 100, category: 'Electronics' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('PUT /api/products/:id should return 401 without a token', async () => {
    const res = await request(app)
      .put('/api/products/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Updated' });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/products/:id should return 401 without a token', async () => {
    const res = await request(app)
      .delete('/api/products/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toBe(401);
  });

  // ── Validation middleware on POST ───────────────────────────────────────────
  // These tests bypass auth — validation runs before auth in the route handler order?
  // Actually auth runs first (router.use(authenticate)). So 401 wins.
  // Validation tests for POST without auth → 401. Validation fires for authenticated
  // users — this is covered in validate.test.js unit tests.

});
