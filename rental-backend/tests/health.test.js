const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('should return 200 OK with health details', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('env', 'test');
  });

  it('should return 404 for an invalid endpoint', async () => {
    const response = await request(app).get('/api/invalid-route-xyz');
    expect(response.statusCode).toBe(404);
  });
});
