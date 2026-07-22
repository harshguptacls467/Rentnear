const request = require('supertest');
const app = require('../app');

describe('Admin Routes Protection (Authentication & RBAC)', () => {
  it('should reject unauthorized access to /api/admin/stats with 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid auth token with 401', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer invalid_token_xyz');
    expect(res.statusCode).toBe(401);
  });
});
