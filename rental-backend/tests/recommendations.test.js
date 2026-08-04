const request = require('supertest');
const app = require('../app');

describe('Personalized Recommendation Engine API', () => {

  describe('GET /api/recommendations/feed', () => {

    it('should return 200 with structured feed collections', async () => {
      const res = await request(app)
        .get('/api/recommendations/feed')
        .query({ lat: 12.9716, lng: 77.5946 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.feed).toBeDefined();
      expect(Array.isArray(res.body.feed.recommendedForYou)).toBe(true);
      expect(Array.isArray(res.body.feed.trendingNearYou)).toBe(true);
      expect(Array.isArray(res.body.feed.similarToRecentlyViewed)).toBe(true);
      expect(Array.isArray(res.body.feed.becauseYouRented)).toBe(true);
      expect(Array.isArray(res.body.feed.bestRatedNearby)).toBe(true);
      expect(Array.isArray(res.body.feed.newListingsAroundYou)).toBe(true);
      expect(Array.isArray(res.body.feed.weekendPicks)).toBe(true);
      expect(Array.isArray(res.body.feed.budgetFriendly)).toBe(true);
      expect(Array.isArray(res.body.feed.premiumCollection)).toBe(true);
    }, 15000);

  });

  describe('POST /api/recommendations/activity', () => {

    it('should accept logging view/click activities and conversion events', async () => {
      const res = await request(app)
        .post('/api/recommendations/activity')
        .send({
          product_id: '11111111-0000-4000-8000-000000000001',
          activity_type: 'recommendation_click',
          category: 'Tools'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });

});
