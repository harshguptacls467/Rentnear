const supabase = require('../config/supabase');
const pricingEngine = require('../utils/pricingEngine');
const cache = require('../utils/cache');

const pricingController = {
  // GET /api/pricing/recommendation/:productId
  getRecommendation: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const ownerId = req.user.id;

      const cacheKey = `pricing_rec:${productId}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({ success: true, recommendation: cached, cached: true });
      }

      // 1. Fetch target product
      const { data: product, error: productErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productErr || !product) {
        return res.status(404).json({ success: false, error: { message: 'Product not found.' } });
      }

      if (product.owner_id !== ownerId && !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Not authorized to view pricing recommendations for this product.' } });
      }

      // 2. Fetch parallel market context data
      const [
        { data: marketProducts },
        { data: bookings },
        { data: ownerUser }
      ] = await Promise.all([
        supabase.from('products').select('price_per_day').eq('category', product.category).neq('id', productId),
        supabase.from('bookings').select('id').eq('product_id', productId).eq('status', 'completed'),
        supabase.from('users').select('trust_score, rating_average').eq('id', ownerId).single()
      ]);

      const completedBookingsCount = bookings ? bookings.length : 0;
      const trustScore = ownerUser?.trust_score || 50;
      const rating = ownerUser?.rating_average || 0;

      // 3. Compute Recommendation via Engine
      const recommendation = pricingEngine.calculateRecommendation({
        product,
        marketProducts: marketProducts || [],
        bookingsCount: completedBookingsCount,
        ownerTrustScore: trustScore,
        ownerRating: rating
      });

      // 4. Upsert into pricing_recommendations DB table
      await supabase.from('pricing_recommendations').upsert({
        product_id: productId,
        suggested_daily_price: recommendation.suggested_daily_price,
        suggested_weekly_price: recommendation.suggested_weekly_price,
        suggested_monthly_price: recommendation.suggested_monthly_price,
        price_min: recommendation.price_min,
        price_max: recommendation.price_max,
        demand_level: recommendation.demand_level,
        competitiveness_score: recommendation.competitiveness_score,
        rationale: recommendation.rationale,
        market_stats: recommendation.market_stats,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id' });

      // Cache for 1 hour
      await cache.set(cacheKey, recommendation, 3600);

      res.json({ success: true, recommendation, cached: false });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/pricing/simulate
  simulateRevenue: async (req, res, next) => {
    try {
      const { productId, simulatedPrice } = req.body;
      if (!productId || simulatedPrice == null) {
        return res.status(400).json({ success: false, error: { message: 'productId and simulatedPrice are required.' } });
      }

      const { data: product, error: productErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productErr || !product) {
        return res.status(404).json({ success: false, error: { message: 'Product not found.' } });
      }

      const [{ data: marketProducts }, { data: bookings }] = await Promise.all([
        supabase.from('products').select('price_per_day').eq('category', product.category).neq('id', productId),
        supabase.from('bookings').select('id').eq('product_id', productId).eq('status', 'completed')
      ]);

      const validPrices = (marketProducts || []).map(p => parseFloat(p.price_per_day)).filter(p => p > 0);
      const catAvg = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : parseFloat(product.price_per_day || 50);

      const simulation = pricingEngine.simulateRevenue({
        currentPrice: product.price_per_day,
        simulatedPrice,
        categoryAvgPrice: catAvg,
        viewsCount: product.views_count || 0,
        historicalBookings: bookings ? bookings.length : 0
      });

      res.json({ success: true, simulation });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/pricing/apply
  applyPrice: async (req, res, next) => {
    try {
      const { productId, newPrice, appliedAi = false } = req.body;
      const ownerId = req.user.id;

      if (!productId || newPrice == null || newPrice <= 0) {
        return res.status(400).json({ success: false, error: { message: 'Valid productId and positive newPrice are required.' } });
      }

      const { data: product, error: fetchErr } = await supabase
        .from('products')
        .select('id, owner_id, price_per_day')
        .eq('id', productId)
        .single();

      if (fetchErr || !product) {
        return res.status(404).json({ success: false, error: { message: 'Product not found.' } });
      }

      if (product.owner_id !== ownerId && !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Not authorized to update price for this product.' } });
      }

      const previousPrice = parseFloat(product.price_per_day || 0);
      const targetPrice = parseFloat(newPrice);

      // Update product price
      const { data: updatedProduct, error: updateErr } = await supabase
        .from('products')
        .update({ price_per_day: targetPrice })
        .eq('id', productId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Log into pricing_history
      await supabase.from('pricing_history').insert([{
        product_id: productId,
        owner_id: ownerId,
        previous_price: previousPrice,
        new_price: targetPrice,
        applied_ai_recommendation: appliedAi
      }]);

      // Invalidate recommendation cache
      await cache.del(`pricing_rec:${productId}`);

      res.json({ success: true, product: updatedProduct, message: `Price updated to $${targetPrice}/day successfully.` });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/pricing/history/:productId
  getHistory: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const ownerId = req.user.id;

      const { data: history, error } = await supabase
        .from('pricing_history')
        .select('*')
        .eq('product_id', productId)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, history: history || [] });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = pricingController;
