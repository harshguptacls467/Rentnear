const supabase = require('../config/supabase');
const cache = require('../utils/cache');
const { haversineKm } = require('../utils/geo');

const recommendationController = {
  // GET /api/v1/recommendations/feed (Get Personalized Home Feed)
  getPersonalizedFeed: async (req, res, next) => {
    try {
      const userId = req.user ? req.user.id : null;
      const { lat, lng } = req.query;
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const hasCoords = !isNaN(centerLat) && !isNaN(centerLng);

      const cacheKey = `recommendations:feed:${userId || 'guest'}:${lat || 'none'}:${lng || 'none'}`;
      const cachedFeed = await cache.get(cacheKey);
      if (cachedFeed) {
        return res.json({ success: true, feed: cachedFeed });
      }

      // 1. Fetch available products with owner details (to avoid N+1 query patterns)
      let rawProducts = [];
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, owner:users!owner_id(name, avatar_url, rating_average, rating_count, kyc_verified, trust_score)')
          .eq('is_available', true)
          .range(0, 999);
        
        if (!error && data) {
          rawProducts = data;
        }
      } catch (dbErr) {
        console.warn('[Recommendations DB] Fetching products failed, falling back to empty list:', dbErr.message);
      }

      if (rawProducts.length === 0) {
        return res.json({
          success: true,
          feed: {
            recommendedForYou: [],
            trendingNearYou: [],
            similarToRecentlyViewed: [],
            becauseYouRented: [],
            bestRatedNearby: [],
            newListingsAroundYou: [],
            weekendPicks: [],
            budgetFriendly: [],
            premiumCollection: []
          }
        });
      }

      // Map geodistances on products
      rawProducts = rawProducts.map(p => {
        let dist = null;
        if (hasCoords && p.latitude && p.longitude) {
          dist = haversineKm(centerLat, centerLng, parseFloat(p.latitude), parseFloat(p.longitude));
        }
        return {
          ...p,
          distance_km: dist !== null ? parseFloat(dist.toFixed(2)) : null
        };
      });

      // 2. Load User Profile / Activity History to compile recommendation weights
      let viewedCategories = new Set();
      let lastViewedProductIds = new Set();
      let lastBookingCategory = null;
      let preferredPriceMin = 0;
      let preferredPriceMax = 300;
      let isColdStart = true;

      if (userId) {
        try {
          // Fetch last 20 activity logs to build preference mapping
          const { data: logs } = await supabase
            .from('user_activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

          if (logs && logs.length > 0) {
            isColdStart = false;
            let sumPrices = 0;
            let countPrices = 0;

            logs.forEach(log => {
              if (log.category) viewedCategories.add(log.category.toLowerCase());
              if (log.product_id) lastViewedProductIds.add(log.product_id);
              
              // If booking activity is present, get the last checkout category
              if (log.activity_type === 'rent' && log.category) {
                lastBookingCategory = log.category.toLowerCase();
              }
            });

            // Find prices of viewed items in logs (we can correlate with current catalog)
            const matchedProducts = rawProducts.filter(p => lastViewedProductIds.has(p.id));
            matchedProducts.forEach(p => {
              sumPrices += parseFloat(p.price_per_day) || 0;
              countPrices++;
            });

            if (countPrices > 0) {
              const avg = sumPrices / countPrices;
              preferredPriceMin = Math.max(avg * 0.6, 0);
              preferredPriceMax = avg * 1.5;
            }
          }

          // Fetch explicit preferences
          const { data: explicitPrefs } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (explicitPrefs) {
            isColdStart = false;
            if (Array.isArray(explicitPrefs.favorite_categories)) {
              explicitPrefs.favorite_categories.forEach(c => viewedCategories.add(c.toLowerCase()));
            }
            if (explicitPrefs.preferred_price_min !== undefined) preferredPriceMin = parseFloat(explicitPrefs.preferred_price_min);
            if (explicitPrefs.preferred_price_max !== undefined) preferredPriceMax = parseFloat(explicitPrefs.preferred_price_max);
          }
        } catch (prefsErr) {
          console.debug('[Recommendations DB] Loading user preferences failed (will use cold start).');
        }
      }

      // 3. Compute Recommendation Score for each product
      const scoredProducts = rawProducts.map(p => {
        let score = 0;
        const categoryClean = (p.category || '').toLowerCase();

        if (!isColdStart) {
          // A. Category Affinity Boost
          if (viewedCategories.has(categoryClean)) {
            score += 60;
          }
          // B. Budget Range Fit
          const price = parseFloat(p.price_per_day) || 0;
          if (price >= preferredPriceMin && price <= preferredPriceMax) {
            score += 30;
          } else if (price >= preferredPriceMin * 0.8 && price <= preferredPriceMax * 1.2) {
            score += 10;
          } else {
            score -= 10;
          }
        } else {
          // Cold Start baseline matches
          score += 20;
        }

        // C. Location geodistance bounds
        if (p.distance_km !== null) {
          if (p.distance_km <= 5) score += 50;
          else if (p.distance_km <= 15) score += 30;
          else if (p.distance_km <= 50) score += 10;
          else if (p.distance_km > 100) score -= 20;
        }

        // D. Social Proof (Ratings, views, and popularity score)
        const ratingAvg = Number(p.owner?.rating_average) || 0;
        const ratingCount = Number(p.owner?.rating_count) || 0;
        score += (ratingAvg * 8); // up to +40 points
        score += Math.min(ratingCount * 0.5, 15); // up to +15 points

        const views = Number(p.views_count) || 0;
        const popularity = Number(p.popularity_score) || 0;
        score += Math.min(views * 0.1, 20); // up to +20 points
        score += Math.min(popularity * 0.2, 20); // up to +20 points

        // E. Owner Trust Score
        const trust = Number(p.owner?.trust_score) || 100;
        score += (trust / 10);
        if (p.owner?.kyc_verified) score += 15;

        // F. Listings Recency (Newly added listings get boosted)
        const ageInDays = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(20 - ageInDays, 0); // decays over 20 days
        score += recencyBoost;

        return {
          ...p,
          recommendation_score: parseFloat(score.toFixed(2))
        };
      });

      // 4. Distribute products across feed section arrays (Unique, deduplicated lists)
      const sortByScoreDesc = (a, b) => b.recommendation_score - a.recommendation_score;

      // Recommended For You: Top scoring products
      const recommendedForYou = [...scoredProducts]
        .sort(sortByScoreDesc)
        .slice(0, 8);

      // Trending Near You: Sorted by views count, distance < 50km
      const trendingNearYou = [...scoredProducts]
        .filter(p => p.distance_km === null || p.distance_km <= 50)
        .sort((a, b) => (b.views_count + (b.popularity_score || 0)) - (a.views_count + (a.popularity_score || 0)))
        .slice(0, 8);

      // Similar to recently viewed
      let similarToRecentlyViewed = [];
      if (viewedCategories.size > 0) {
        similarToRecentlyViewed = [...scoredProducts]
          .filter(p => viewedCategories.has((p.category || '').toLowerCase()) && !lastViewedProductIds.has(p.id))
          .sort(sortByScoreDesc)
          .slice(0, 8);
      } else {
        // Fallback for cold start
        similarToRecentlyViewed = [...scoredProducts]
          .filter(p => p.category === 'Cameras')
          .slice(0, 8);
      }

      // Because you rented ... (Accessory cross-mappings, e.g. Rented 'Cameras' -> Recommend 'Electronics', Rented 'Bikes' -> Recommend 'Sports')
      let companionCategory = 'Sports';
      if (lastBookingCategory) {
        if (lastBookingCategory.includes('camera')) companionCategory = 'Electronics';
        else if (lastBookingCategory.includes('bike')) companionCategory = 'Sports';
        else if (lastBookingCategory.includes('tool')) companionCategory = 'Other';
      }
      const becauseYouRented = [...scoredProducts]
        .filter(p => (p.category || '').toLowerCase() === companionCategory.toLowerCase())
        .sort(sortByScoreDesc)
        .slice(0, 8);

      // Best Rated Nearby
      const bestRatedNearby = [...scoredProducts]
        .filter(p => p.distance_km === null || p.distance_km <= 50)
        .sort((a, b) => {
          const ratingA = a.owner?.rating_average || 0;
          const ratingB = b.owner?.rating_average || 0;
          return ratingB - ratingA;
        })
        .slice(0, 8);

      // New Listings Around You
      const newListingsAroundYou = [...scoredProducts]
        .filter(p => p.distance_km === null || p.distance_km <= 100)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);

      // Weekend Picks (Speakers, Sports, Gaming, Outdoors categories)
      const weekendPicks = [...scoredProducts]
        .filter(p => ['speakers', 'sports', 'gaming', 'outdoors', 'bikes'].includes((p.category || '').toLowerCase()))
        .sort((a, b) => (b.owner?.rating_average || 0) - (a.owner?.rating_average || 0))
        .slice(0, 8);

      // Budget Friendly (Price per day under $20)
      const budgetFriendly = [...scoredProducts]
        .filter(p => parseFloat(p.price_per_day) <= 20)
        .sort(sortByScoreDesc)
        .slice(0, 8);

      // Premium Collection (Price over $40 and rated > 4.5)
      const premiumCollection = [...scoredProducts]
        .filter(p => parseFloat(p.price_per_day) >= 40 && (p.owner?.rating_average || 0) >= 4.5)
        .sort(sortByScoreDesc)
        .slice(0, 8);

      const feed = {
        recommendedForYou,
        trendingNearYou,
        similarToRecentlyViewed,
        becauseYouRented,
        bestRatedNearby,
        newListingsAroundYou,
        weekendPicks,
        budgetFriendly,
        premiumCollection
      };

      // Background caching
      if (userId) {
        supabase
          .from('recommendation_caches')
          .upsert([{
            user_id: userId,
            cached_feed: feed,
            updated_at: new Date().toISOString()
          }])
          .then(({ error: cacheErr }) => {
            if (cacheErr) console.debug('Failed to update recommendations cache in DB:', cacheErr.message);
          })
          .catch(() => {});
      }

      await cache.set(cacheKey, feed, 300); // 5 minutes cache
      return res.json({ success: true, feed });

    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/recommendations/activity (Log user interaction click metrics)
  logUserActivity: async (req, res, next) => {
    try {
      const { product_id, activity_type, category } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!activity_type) {
        return res.status(400).json({ success: false, error: { message: 'activity_type is required', status: 400 } });
      }

      // Log to database asynchronously
      supabase
        .from('user_activity_logs')
        .insert([{
          user_id: userId,
          activity_type,
          product_id,
          category
        }])
        .then(({ error }) => {
          if (error) console.debug('Logging user activity failed in DB:', error.message);
        })
        .catch(() => {});

      // If user logs a checkout/rent, update preferred pricing bounds
      if (userId && activity_type === 'rent' && product_id) {
        try {
          const { data: prod } = await supabase
            .from('products')
            .select('price_per_day, category')
            .eq('id', product_id)
            .maybeSingle();
            
          if (prod) {
            const price = parseFloat(prod.price_per_day);
            const { data: existingPref } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();

            const favCats = existingPref ? [...(existingPref.favorite_categories || [])] : [];
            const catClean = prod.category?.toLowerCase();
            if (catClean && !favCats.includes(catClean)) {
              favCats.push(catClean);
            }

            await supabase
              .from('user_preferences')
              .upsert([{
                user_id: userId,
                favorite_categories: favCats,
                preferred_price_min: Math.max(price * 0.5, 0),
                preferred_price_max: price * 2.0,
                updated_at: new Date().toISOString()
              }]);
          }
        } catch (prefErr) {
          console.debug('Failed to update explicit preferences on rent:', prefErr.message);
        }
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/recommendations/report (CTR Performance Reports for Admin Console)
  getRecommendationPerformance: async (req, res, next) => {
    try {
      if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Unauthorized. Admin access required.', status: 403 } });
      }

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const logs = data || [];
      let clicks = 0;
      let ignores = 0;
      let rentals = 0;

      const clickFrequencies = {};

      logs.forEach(log => {
        if (log.activity_type === 'recommendation_click') {
          clicks++;
          if (log.product_id) {
            clickFrequencies[log.product_id] = (clickFrequencies[log.product_id] || 0) + 1;
          }
        } else if (log.activity_type === 'recommendation_ignore') {
          ignores++;
        } else if (log.activity_type === 'rent') {
          rentals++;
        }
      });

      const totalImpressions = clicks + ignores;
      const ctr = totalImpressions > 0 ? parseFloat(((clicks / totalImpressions) * 100).toFixed(2)) : 0;
      const conversionRate = clicks > 0 ? parseFloat(((rentals / clicks) * 100).toFixed(2)) : 0;

      // Map top clicked items (ids)
      const topClickedIds = Object.entries(clickFrequencies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => ({ product_id: entry[0], clicks: entry[1] }));

      res.json({
        success: true,
        report: {
          total_recommendation_clicks: clicks,
          total_recommendation_ignores: ignores,
          recommendation_ctr: ctr,
          conversion_rate: conversionRate,
          top_clicked_recommendations: topClickedIds
        }
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = recommendationController;
