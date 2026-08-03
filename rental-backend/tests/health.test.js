const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  let response;

  beforeAll(async () => {
    response = await request(app).get('/api/health');
  });

  it('should return 200 OK', () => {
    expect(response.statusCode).toBe(200);
  });

  it('should have status ok', () => {
    expect(response.body.status).toBe('ok');
  });

  it('should include env field', () => {
    expect(response.body.env).toBeDefined();
  });

  it('should include a services object with all required keys', () => {
    const { services } = response.body;
    expect(services).toBeDefined();
    expect(services).toHaveProperty('supabase_url');
    expect(services).toHaveProperty('supabase_key');
    expect(services).toHaveProperty('frontend_url');
    expect(services).toHaveProperty('razorpay');
    expect(services).toHaveProperty('onesignal');
  });

  it('should NOT expose raw env values — only SET or MISSING', () => {
    const { services } = response.body;
    const allowed = ['SET', 'MISSING'];
    Object.values(services).forEach((val) => {
      expect(allowed).toContain(val);
    });
  });

  it('should NOT expose node_version, request_origin, or raw URLs', () => {
    expect(response.body).not.toHaveProperty('node_version');
    expect(response.body).not.toHaveProperty('request_origin');
    // Ensure frontend_url is not a real URL string at top level
    expect(typeof response.body.frontend_url).not.toBe('string');
  });

  it('should return 404 for an invalid endpoint', async () => {
    const res = await request(app).get('/api/invalid-route-xyz');
    expect(res.statusCode).toBe(404);
  });
});
