const request = require('supertest');
const app = require('../app');

describe('Bookings API — Auth Guard', () => {
  it('GET /api/bookings/my should return 401 without a token', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toBeDefined();
  });

  it('POST /api/bookings should return 401 without a token', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/bookings with malformed token should return 401', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer invalid-malformed-token')
      .send({ product_id: 'not-a-uuid' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
