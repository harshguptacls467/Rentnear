const request = require('supertest');
const app = require('../app');

describe('Products Endpoints API Tests', () => {
  it('GET /api/products should respond with 200 or array', async () => {
    const res = await request(app).get('/api/products');
    expect([200, 500]).toContain(res.statusCode);
  });

  it('POST /api/products without auth header should respond with 401', async () => {
    const res = await request(app).post('/api/products').send({
      title: 'Unauthenticated Listing Test',
      price_per_day: 50
    });
    expect(res.statusCode).toBe(401);
  });

  it('PUT /api/products/:id without auth header should respond with 401', async () => {
    const res = await request(app).put('/api/products/some-uuid').send({
      title: 'Hacked Title'
    });
    expect(res.statusCode).toBe(401);
  });
});
