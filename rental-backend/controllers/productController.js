const supabase = require('../config/supabase');
const { sendGlobalPushNotification } = require('../utils/notifications');
const cache = require('../utils/cache');
const { haversineKm } = require('../utils/geo');

const productController = {
  // GET /api/products (Smart Search, Advanced Filters & Sorting)
  getAllProducts: async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
      const { 
        category, search, min_price, max_price, condition, 
        instant_booking, min_rating, max_deposit, lat, lng, max_distance, sort_by 
      } = req.query;

      // 1. Redis / In-Memory Cache Lookup
      const cacheKey = `products:${category || 'all'}:${search || 'all'}:${min_price || '0'}:${max_price || 'max'}:${condition || 'all'}:${instant_booking || 'all'}:${min_rating || '0'}:${sort_by || 'newest'}:${limit}:${offset}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      let query = supabase
        .from('products')
        .select('*, owner:users!owner_id(name, avatar_url, rating_average, rating_count)')
        .eq('is_available', true);

      // Filters
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (search && search.trim()) {
        const cleanSearch = search.trim();
        query = query.or(`title.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%`);
      }

      if (min_price && !isNaN(parseFloat(min_price))) {
        query = query.gte('price_per_day', parseFloat(min_price));
      }

      if (max_price && !isNaN(parseFloat(max_price))) {
        query = query.lte('price_per_day', parseFloat(max_price));
      }

      if (condition && condition !== 'All') {
        query = query.ilike('condition', condition);
      }

      if (instant_booking === 'true' || instant_booking === true) {
        query = query.eq('instant_booking_enabled', true);
      }

      if (max_deposit && !isNaN(parseFloat(max_deposit))) {
        query = query.lte('deposit_amount', parseFloat(max_deposit));
      }

      // Sorting
      if (sort_by === 'price_asc') {
        query = query.order('price_per_day', { ascending: true });
      } else if (sort_by === 'price_desc') {
        query = query.order('price_per_day', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Safety cap: never fetch more than 1000 rows from the DB into Node.js process memory.
      // Without this, a table with 10,000+ products would be fully loaded on every request.
      // Long-term fix: move all filtering/sorting/pagination to DB-level queries.
      query = query.range(0, 999);

      const { data, error } = await query;

      if (!error && data) {
        let results = data;

        // In-Memory post-filtering for owner rating & owner name search match
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          results = results.filter(p => 
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.owner?.name?.toLowerCase().includes(q)
          );
        }

        if (min_rating && !isNaN(parseFloat(min_rating))) {
          const targetRating = parseFloat(min_rating);
          results = results.filter(p => (p.owner?.rating_average || 0) >= targetRating);
        }

        // Distance filtering & Nearest sorting
        if ((lat || req.query.latitude) && (lng || req.query.longitude)) {
          const centerLat = parseFloat(lat || req.query.latitude);
          const centerLng = parseFloat(lng || req.query.longitude);
          const maxDist = parseFloat(max_distance || req.query.radius_km || 100);

          results = results.map(p => {
            const dist = (p.latitude && p.longitude) ? haversineKm(centerLat, centerLng, parseFloat(p.latitude), parseFloat(p.longitude)) : 0;
            return { ...p, distance_km: parseFloat(dist.toFixed(2)) };
          }).filter(p => !max_distance || p.distance_km <= maxDist);

          if (sort_by === 'nearest') {
            results.sort((a, b) => a.distance_km - b.distance_km);
          }
        }

        if (sort_by === 'rating_desc') {
          results.sort((a, b) => (b.owner?.rating_average || 0) - (a.owner?.rating_average || 0));
        } else if (sort_by === 'popular') {
          results.sort((a, b) => (b.owner?.rating_count || 0) - (a.owner?.rating_count || 0));
        }

        // Pagination slicing
        const paginated = results.slice(offset, offset + limit);

        await cache.set(cacheKey, paginated, 60);
        return res.json(paginated);
      }

      // Fallback query without column join specifier
      let fallbackQuery = supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'All') fallbackQuery = fallbackQuery.eq('category', category);
      if (search) fallbackQuery = fallbackQuery.ilike('title', `%${search}%`);
      fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);

      const { data: fallbackData } = await fallbackQuery;
      res.json(fallbackData || []);
    } catch {
      res.json([]);
    }
  },

  // GET /api/products/nearby
  getNearbyProducts: async (req, res, next) => {
    try {
      const { minLat, maxLat, minLng, maxLng, lat, lng, radius_km } = req.query;

      // 1. Radius-based filtering
      if ((lat || req.query.latitude) && (lng || req.query.longitude)) {
        const centerLat = parseFloat(lat || req.query.latitude);
        const centerLng = parseFloat(lng || req.query.longitude);
        const maxDistKm = parseFloat(radius_km || 10);

        const { data: allProducts, error } = await supabase
          .from('products')
          .select('*, owner:users!owner_id(name, avatar_url, rating_average, rating_count)')
          .eq('is_available', true);

        if (!error && allProducts) {
          const filtered = allProducts.filter(p => {
            if (!p.latitude || !p.longitude) return false;
            const dist = haversineKm(centerLat, centerLng, parseFloat(p.latitude), parseFloat(p.longitude));
            return dist <= maxDistKm;
          }).map(p => ({
            ...p,
            distance_km: parseFloat(haversineKm(centerLat, centerLng, parseFloat(p.latitude), parseFloat(p.longitude)).toFixed(2)),
            // Fuzzy location obfuscation (~150m offset) for renter privacy before booking
            latitude: parseFloat((parseFloat(p.latitude) + (Math.sin(p.id.length) * 0.0015)).toFixed(6)),
            longitude: parseFloat((parseFloat(p.longitude) + (Math.cos(p.id.length) * 0.0015)).toFixed(6))
          }));

          return res.json(filtered);
        }
      }

      if (!minLat || !maxLat || !minLng || !maxLng) {
        return res.status(400).json({ success: false, error: { message: 'Bounding box or location parameters (minLat, maxLat, minLng, maxLng OR lat, lng, radius_km) are required.', status: 400 } });
      }

      // 2. Bounding box query
      const { data } = await supabase
        .from('products')
        .select('*, owner:users!owner_id(name, avatar_url, rating_average, rating_count)')
        .eq('is_available', true)
        .gte('latitude', parseFloat(minLat))
        .lte('latitude', parseFloat(maxLat))
        .gte('longitude', parseFloat(minLng))
        .lte('longitude', parseFloat(maxLng));

      res.json(data || []);
    } catch {
      res.json([]);
    }
  },

  // GET /api/products/:id
  getProductById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: product, error } = await supabase
        .from('products')
        .select('*, owner:users!owner_id(id, name, avatar_url, rating_average, rating_count, created_at)')
        .eq('id', id)
        .maybeSingle();

      if (product) {
        return res.json(product);
      }

      // Fallback query without column join
      const { data: fallbackProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!fallbackProduct) {
        return res.status(404).json({ success: false, error: { message: 'Product not found.', status: 404 } });
      }

      res.json(fallbackProduct);
      // Note: removed unreachable res.json(product) that was below this line
    } catch (error) {
      next(error);
    }
  },

  // POST /api/products
  createProduct: async (req, res, next) => {
    try {
      const { 
        title, 
        description, 
        category, 
        condition, 
        price_per_day, 
        price_per_hour, 
        deposit_amount, 
        location, 
        latitude, 
        longitude, 
        images,
        instant_booking_enabled,
        calendar_blocked_dates
      } = req.body;
      const owner_id = req.user.id;

      if (!title || !price_per_day) {
        return res.status(400).json({ success: false, error: { message: 'title and price_per_day are required.', status: 400 } });
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          owner_id,
          title,
          description,
          category,
          condition: condition || 'Good',
          price_per_day,
          price_per_hour,
          deposit_amount: deposit_amount || 0,
          location,
          latitude,
          longitude,
          images: images || [],
          is_available: true,
          instant_booking_enabled: instant_booking_enabled === true,
          calendar_blocked_dates: Array.isArray(calendar_blocked_dates) ? calendar_blocked_dates : []
        }])
        .select()
        .single();

      if (error) throw error;

      // Invalidate catalog cache
      await cache.delPattern('products:');

      // Send global push notification to all users about new rental item
      try {
        await sendGlobalPushNotification(
          'New Item Available! 🌟',
          `"${data.title}" is now available for rent nearby on RentNear!`,
          { productId: data.id }
        );
      } catch (pushErr) {
        console.error('Error sending global listing push:', pushErr);
      }

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/products/:id
  updateProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const owner_id = req.user.id;
      // SECURITY: Use explicit field allowlist — never pass raw req.body to DB
      // This prevents mass-assignment attacks (e.g. user setting owner_id or created_at)
      const {
        title, description, category, condition,
        price_per_day, price_per_hour, deposit_amount,
        location, latitude, longitude, images, is_available,
        instant_booking_enabled, calendar_blocked_dates
      } = req.body;

      const allowedUpdates = {};
      if (title !== undefined) allowedUpdates.title = title;
      if (description !== undefined) allowedUpdates.description = description;
      if (category !== undefined) allowedUpdates.category = category;
      if (condition !== undefined) allowedUpdates.condition = condition;
      if (price_per_day !== undefined) allowedUpdates.price_per_day = price_per_day;
      if (price_per_hour !== undefined) allowedUpdates.price_per_hour = price_per_hour;
      if (deposit_amount !== undefined) allowedUpdates.deposit_amount = deposit_amount;
      if (location !== undefined) allowedUpdates.location = location;
      if (latitude !== undefined) allowedUpdates.latitude = latitude;
      if (longitude !== undefined) allowedUpdates.longitude = longitude;
      if (images !== undefined) allowedUpdates.images = images;
      if (is_available !== undefined) allowedUpdates.is_available = is_available;
      if (instant_booking_enabled !== undefined) allowedUpdates.instant_booking_enabled = instant_booking_enabled;
      if (calendar_blocked_dates !== undefined) allowedUpdates.calendar_blocked_dates = calendar_blocked_dates;

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('products')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ success: false, error: { message: 'Product not found.', status: 404 } });
      }

      if (existing.owner_id !== owner_id) {
        return res.status(403).json({ success: false, error: { message: 'Only the owner can update this product.', status: 403 } });
      }

      const { data, error } = await supabase
        .from('products')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/products/:id
  deleteProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const owner_id = req.user.id;

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('products')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ success: false, error: { message: 'Product not found.', status: 404 } });
      }

      if (existing.owner_id !== owner_id) {
        return res.status(403).json({ success: false, error: { message: 'Only the owner can delete this product.', status: 403 } });
      }

      // Check if there are active bookings
      const { data: activeBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('product_id', id)
        .in('status', ['pending', 'approved', 'awaiting_handover', 'active', 'disputed']);
        
      if (bookingError) throw bookingError;

      if (activeBookings && activeBookings.length > 0) {
        return res.status(400).json({ success: false, error: { message: 'Cannot delete a product with active or pending bookings. Set it to unavailable instead.', status: 400 } });
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/products/pricing-recommendation?category=x
  getPricingRecommendation: async (req, res, next) => {
    try {
      const { category } = req.query;

      const CATEGORY_DEFAULTS = {
        'Electronics': { min: 15, max: 45, avg: 25 },
        'Cameras & Gear': { min: 25, max: 80, avg: 40 },
        'Tools & Equipment': { min: 10, max: 35, avg: 20 },
        'Outdoor & Camping': { min: 12, max: 40, avg: 22 },
        'Party & Events': { min: 20, max: 70, avg: 35 },
        'Sports & Fitness': { min: 10, max: 30, avg: 18 },
        'Musical Instruments': { min: 15, max: 50, avg: 30 }
      };

      if (!category) {
        return res.json({ success: true, recommendation: { min: 15, max: 50, avg: 25 } });
      }

      const { data: existingProducts } = await supabase
        .from('products')
        .select('price_per_day')
        .eq('category', category);

      if (existingProducts && existingProducts.length >= 3) {
        const prices = existingProducts.map(p => parseFloat(p.price_per_day)).filter(p => !isNaN(p) && p > 0);
        if (prices.length >= 3) {
          prices.sort((a, b) => a - b);
          const avg = parseFloat((prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2));

          return res.json({
            success: true,
            category,
            recommendation: {
              min: parseFloat((avg * 0.75).toFixed(2)),
              max: parseFloat((avg * 1.35).toFixed(2)),
              avg
            },
            sample_size: prices.length
          });
        }
      }

      const fallback = CATEGORY_DEFAULTS[category] || { min: 15, max: 45, avg: 25 };
      res.json({
        success: true,
        category,
        recommendation: fallback,
        sample_size: 0
      });

    } catch (error) {
      next(error);
    }
  },

  // POST /api/products/ai-recommend
  getAiProductRecommendation: async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'prompt is required', status: 400 } });
      }

      const queryText = prompt.toLowerCase();

      // Fetch active catalog
      const { data: catalog } = await supabase
        .from('products')
        .select('id, title, category, price_per_day, images, location')
        .eq('is_available', true);

      const items = catalog || [];

      // Natural language keyword matching
      const keywords = queryText.split(/\s+/).filter(w => w.length > 2);
      const scored = items.map(item => {
        let score = 0;
        const text = `${item.title} ${item.category} ${item.location}`.toLowerCase();
        keywords.forEach(kw => {
          if (text.includes(kw)) score += 1;
        });
        return { item, score };
      }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

      const matchedProducts = scored.map(s => s.item).slice(0, 3);

      const responseText = matchedProducts.length > 0
        ? `Based on your request ("${prompt}"), here are the best matching items available near you on RentNear:`
        : `I searched our live inventory for "${prompt}". Here are top recommended gear options for your task:`;

      res.json({
        success: true,
        ai_response: responseText,
        recommended_products: matchedProducts.length > 0 ? matchedProducts : items.slice(0, 2)
      });
    } catch (error) {
      next(error);
    }
  }

};

module.exports = productController;
