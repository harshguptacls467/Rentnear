const request = require('supertest');
const app = require('../app');

describe('Bookings API Authorization Tests', () => {
  it('POST /api/bookings without token should respond with 401', async () => {
    const res = await request(app).post('/api/bookings').send({
      product_id: 'some-id',
      start_date: '2026-08-01',
      end_date: '2026-08-05'
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/bookings/my without token should respond with 401', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect(res.statusCode).toBe(401);
  });
});
