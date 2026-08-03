const pricingEngine = require('../../utils/pricingEngine');

describe('AI Pricing Engine Utility', () => {
  describe('calculateRecommendation', () => {
    it('calculates recommendation using market median and default demand/trust', () => {
      const product = { price_per_day: 50, views_count: 20 };
      const marketProducts = [{ price_per_day: 40 }, { price_per_day: 60 }, { price_per_day: 80 }];
      
      const result = pricingEngine.calculateRecommendation({
        product,
        marketProducts,
        bookingsCount: 1,
        ownerTrustScore: 50,
        ownerRating: 0
      });

      expect(result.suggested_daily_price).toBe(60); // Median of 40, 60, 80 = 60
      expect(result.suggested_weekly_price).toBe(Math.round(60 * 5.5 * 100) / 100);
      expect(result.suggested_monthly_price).toBe(Math.round(60 * 18 * 100) / 100);
      expect(result.demand_level).toBe('medium');
      expect(result.competitiveness_score).toBe(83);
    });

    it('applies high demand multiplier when conversion/bookings are high', () => {
      const product = { price_per_day: 100, views_count: 60 };
      const marketProducts = [{ price_per_day: 100 }];

      const result = pricingEngine.calculateRecommendation({
        product,
        marketProducts,
        bookingsCount: 10,
        ownerTrustScore: 50,
        ownerRating: 0
      });

      expect(result.demand_level).toBe('peak');
      expect(result.suggested_daily_price).toBe(115); // 100 * 1.15
    });

    it('applies trust bonus markup for verified high trust score and rating', () => {
      const product = { price_per_day: 100, views_count: 20 };
      const marketProducts = [{ price_per_day: 100 }];

      const result = pricingEngine.calculateRecommendation({
        product,
        marketProducts,
        bookingsCount: 1,
        ownerTrustScore: 90, // +8%
        ownerRating: 4.9     // +7% -> total +15%
      });

      expect(result.suggested_daily_price).toBe(115); // 100 * 1.15
      expect(result.rationale.some(r => r.includes('Trust Score'))).toBe(true);
    });

    it('handles zero market listings gracefully', () => {
      const product = { price_per_day: 45, views_count: 5 };

      const result = pricingEngine.calculateRecommendation({
        product,
        marketProducts: [],
        bookingsCount: 0,
        ownerTrustScore: 50,
        ownerRating: 0
      });

      expect(result.suggested_daily_price).toBe(45);
      expect(result.market_stats.similarListingsCount).toBe(0);
    });
  });

  describe('simulateRevenue', () => {
    it('simulates higher days booked when simulated price is lower than category avg', () => {
      const result = pricingEngine.simulateRevenue({
        currentPrice: 50,
        simulatedPrice: 35,
        categoryAvgPrice: 50,
        viewsCount: 100,
        historicalBookings: 3
      });

      expect(result.simulatedPrice).toBe(35);
      expect(result.demandImpact).toBe('positive');
      expect(result.occupancyPercentage).toBeGreaterThan(0);
      expect(result.estimatedMonthlyRevenue).toBe(result.estimatedDaysBooked * 35);
    });

    it('simulates lower occupancy when simulated price is significantly above category avg', () => {
      const result = pricingEngine.simulateRevenue({
        currentPrice: 50,
        simulatedPrice: 120,
        categoryAvgPrice: 50,
        viewsCount: 100,
        historicalBookings: 3
      });

      expect(result.demandImpact).toBe('negative');
      expect(result.estimatedDaysBooked).toBeLessThan(10);
    });
  });
});
