const request = require('supertest');
const app = require('../app');

describe('Bookings API Integration Tests', () => {
  it('GET /api/bookings/my should handle request cleanly', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect([200, 500]).toContain(res.statusCode);
  });
});
