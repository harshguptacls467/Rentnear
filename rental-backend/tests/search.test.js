const request = require('supertest');
const app = require('../app');

describe('Intelligent Search & Analytics API', () => {

  describe('GET /api/products/search', () => {
    
    it('should return 200 with search results and metadata properties', async () => {
      const res = await request(app)
        .get('/api/products/search')
        .query({ q: 'camera', limit: 5 });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.metadata).toBeDefined();
      expect(res.body.metadata.total_count).toBeDefined();
      expect(res.body.metadata.has_more).toBeDefined();
      expect(res.body.metadata.duration_ms).toBeDefined();
      expect(Array.isArray(res.body.metadata.ai_suggestions)).toBe(true);
    }, 15000);

    it('should handle price range filters', async () => {
      const res = await request(app)
        .get('/api/products/search')
        .query({ price_min: 10, price_max: 100 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle sorting modes', async () => {
      const res = await request(app)
        .get('/api/products/search')
        .query({ sort_by: 'lowest_price' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should calculate geodistances when lat/lng are supplied', async () => {
      const res = await request(app)
        .get('/api/products/search')
        .query({ lat: 12.9716, lng: 77.5946, sort_by: 'nearest' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

  });

  describe('GET /api/products/search/trending', () => {
    
    it('should return 200 with an array of trending keywords', async () => {
      const res = await request(app).get('/api/products/search/trending');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.trending)).toBe(true);
    });

  });

  describe('POST /api/analytics/search/event', () => {
    
    it('should accept search click/conversion event tracking logging', async () => {
      const res = await request(app)
        .post('/api/analytics/search/event')
        .send({
          query: 'drill',
          event_type: 'click',
          product_id: '11111111-0000-4000-8000-000000000001'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });

});
