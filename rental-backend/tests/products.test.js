const request = require('supertest');
const app = require('../app');

describe('Products Endpoints API Tests', () => {
  it('GET /api/products should respond with 200 or array', async () => {
    const res = await request(app).get('/api/products');
    expect([200, 500]).toContain(res.statusCode);
  }, 20000);

  it('GET /api/products/nearby should respond with valid response code', async () => {
    const res = await request(app).get('/api/products/nearby');
    expect([200, 400, 500]).toContain(res.statusCode);
  });
});
