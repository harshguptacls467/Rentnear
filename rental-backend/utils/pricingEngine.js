/**
 * AI Pricing Engine Utility
 * Provides algorithmic price recommendations and revenue simulation models.
 */

const pricingEngine = {
  /**
   * Calculates dynamic pricing recommendations based on market data, owner metrics, and listing demand.
   */
  calculateRecommendation: ({ product, marketProducts = [], bookingsCount = 0, ownerTrustScore = 50, ownerRating = 0 }) => {
    const currentPrice = parseFloat(product?.price_per_day || 50);
    const views = parseInt(product?.views_count || 0, 10);

    // 1. Calculate Market Proximity Anchor (median/avg of category in area)
    const validMarketPrices = marketProducts
      .map(p => parseFloat(p.price_per_day))
      .filter(p => !isNaN(p) && p > 0);

    let baseMarketPrice = currentPrice;
    if (validMarketPrices.length > 0) {
      const sorted = [...validMarketPrices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      baseMarketPrice = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // 2. Compute Demand Velocity Multiplier
    // Conversion rate: bookings / max(views, 1)
    const conversionRate = views > 0 ? bookingsCount / views : 0.05;
    let demandMultiplier = 1.0;
    let demandLevel = 'medium';

    if (conversionRate > 0.15 || (views > 50 && bookingsCount > 5)) {
      demandMultiplier = 1.15;
      demandLevel = 'peak';
    } else if (conversionRate > 0.08 || bookingsCount > 2) {
      demandMultiplier = 1.08;
      demandLevel = 'high';
    } else if (views > 100 && bookingsCount === 0) {
      demandMultiplier = 0.88; // Price might be too high for view volume
      demandLevel = 'low';
    } else {
      demandMultiplier = 1.0;
      demandLevel = 'medium';
    }

    // 3. Compute Owner Reputation Trust Bonus (+0% to +15%)
    let trustBonus = 0;
    if (ownerTrustScore >= 80) trustBonus += 0.08;
    if (ownerRating >= 4.8) trustBonus += 0.07;
    const trustMultiplier = 1.0 + trustBonus;

    // 4. Calculate Final Suggested Prices
    const rawSuggested = baseMarketPrice * demandMultiplier * trustMultiplier;
    // Round to clean integer/two decimals
    const suggestedDailyPrice = Math.max(10, Math.round(rawSuggested * 100) / 100);
    const suggestedWeeklyPrice = Math.round(suggestedDailyPrice * 5.5 * 100) / 100;
    const suggestedMonthlyPrice = Math.round(suggestedDailyPrice * 18 * 100) / 100;

    const priceMin = Math.max(5, Math.round(suggestedDailyPrice * 0.85 * 100) / 100);
    const priceMax = Math.round(suggestedDailyPrice * 1.25 * 100) / 100;

    // 5. Competitiveness Score (0-100%)
    // How close is current price to optimal range
    const diffRatio = Math.abs(currentPrice - suggestedDailyPrice) / suggestedDailyPrice;
    const competitivenessScore = Math.max(40, Math.min(100, Math.round(100 - (diffRatio * 100))));

    // 6. Generate Human-Readable Rationale
    const rationale = [];
    if (validMarketPrices.length > 0) {
      rationale.push(`Based on ${validMarketPrices.length} similar listings in your category (avg $${baseMarketPrice.toFixed(2)}/day).`);
    } else {
      rationale.push(`Market baseline benchmarked against regional category averages.`);
    }

    if (demandLevel === 'peak' || demandLevel === 'high') {
      rationale.push(`High booking conversion detected (+${Math.round((demandMultiplier - 1) * 100)}% demand headroom).`);
    } else if (demandLevel === 'low') {
      rationale.push(`High views (${views}) with 0 bookings suggest lowering price to trigger initial bookings.`);
    } else {
      rationale.push(`Balanced views and booking demand.`);
    }

    if (trustBonus > 0) {
      rationale.push(`Verified Trust Score (${ownerTrustScore}) allows a +${Math.round(trustBonus * 100)}% premium quality markup.`);
    }

    return {
      suggested_daily_price: suggestedDailyPrice,
      suggested_weekly_price: suggestedWeeklyPrice,
      suggested_monthly_price: suggestedMonthlyPrice,
      price_min: priceMin,
      price_max: priceMax,
      demand_level: demandLevel,
      competitiveness_score: competitivenessScore,
      rationale,
      market_stats: {
        similarListingsCount: validMarketPrices.length,
        categoryAvgPrice: parseFloat(baseMarketPrice.toFixed(2)),
        viewsCount: views,
        completedBookings: bookingsCount
      }
    };
  },

  /**
   * Simulates expected monthly bookings, occupancy, and revenue for a custom target price.
   */
  simulateRevenue: ({ currentPrice, simulatedPrice, categoryAvgPrice = 50, viewsCount = 50, historicalBookings = 2 }) => {
    const simPrice = Math.max(1, parseFloat(simulatedPrice || currentPrice || 50));
    const avgPrice = Math.max(1, parseFloat(categoryAvgPrice || simPrice));

    // Base estimated monthly days booked (out of 30 days)
    const baseDaysBooked = Math.max(2, Math.min(25, historicalBookings > 0 ? historicalBookings * 3 : 8));

    // Price elasticity factor: As price increases relative to avg market price, demand drops log-linear
    const priceRatio = simPrice / avgPrice;
    let elasticityFactor = 1.0;
    if (priceRatio > 1.0) {
      elasticityFactor = Math.max(0.2, 1.0 - (priceRatio - 1.0) * 1.2);
    } else {
      elasticityFactor = Math.min(1.8, 1.0 + (1.0 - priceRatio) * 0.9);
    }

    const estimatedDaysBooked = Math.max(1, Math.min(30, Math.round(baseDaysBooked * elasticityFactor)));
    const estimatedMonthlyRevenue = Math.round(estimatedDaysBooked * simPrice * 100) / 100;
    const occupancyPercentage = Math.min(100, Math.round((estimatedDaysBooked / 30) * 100));
    const estimatedBookingsCount = Math.max(1, Math.round(estimatedDaysBooked / 3));

    return {
      simulatedPrice: simPrice,
      estimatedDaysBooked,
      estimatedBookingsCount,
      estimatedMonthlyRevenue,
      occupancyPercentage,
      demandImpact: elasticityFactor >= 1.0 ? 'positive' : elasticityFactor >= 0.7 ? 'neutral' : 'negative'
    };
  }
};

module.exports = pricingEngine;
