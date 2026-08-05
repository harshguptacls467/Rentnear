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
        const cleanSearch = search.trim().replace(/[(),]/g, ' ');
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
        calendar_blocked_dates,
        brand,
        city,
        locality,
        tags,
        popularity_score,
        delivery_available
      } = req.body;
      const owner_id = req.user.id;

      if (!title || !price_per_day) {
        return res.status(400).json({ success: false, error: { message: 'title and price_per_day are required.', status: 400 } });
      }

      const payload = {
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
      };

      if (brand !== undefined) payload.brand = brand;
      if (city !== undefined) payload.city = city;
      if (locality !== undefined) payload.locality = locality;
      if (tags !== undefined) payload.tags = Array.isArray(tags) ? tags : [];
      if (popularity_score !== undefined) payload.popularity_score = parseInt(popularity_score, 10) || 0;
      if (delivery_available !== undefined) payload.delivery_available = delivery_available !== false;

      let data, error;
      try {
        const insertRes = await supabase
          .from('products')
          .insert([payload])
          .select()
          .single();
        data = insertRes.data;
        error = insertRes.error;
      } catch (dbErr) {
        error = dbErr;
      }

      // Handle fallback if columns do not exist in schema cache (PGRST204)
      if (error && (error.code === 'PGRST204' || String(error.message).includes('column'))) {
        console.warn('[DB Fallback] Schema lacks new search fields, retrying fallback insert.');
        const fallbackPayload = { ...payload };
        delete fallbackPayload.brand;
        delete fallbackPayload.city;
        delete fallbackPayload.locality;
        delete fallbackPayload.tags;
        delete fallbackPayload.popularity_score;
        delete fallbackPayload.delivery_available;

        const fallbackRes = await supabase
          .from('products')
          .insert([fallbackPayload])
          .select()
          .single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

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
      const {
        title, description, category, condition,
        price_per_day, price_per_hour, deposit_amount,
        location, latitude, longitude, images, is_available,
        instant_booking_enabled, calendar_blocked_dates,
        brand, city, locality, tags, popularity_score, delivery_available
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
      if (brand !== undefined) allowedUpdates.brand = brand;
      if (city !== undefined) allowedUpdates.city = city;
      if (locality !== undefined) allowedUpdates.locality = locality;
      if (tags !== undefined) allowedUpdates.tags = Array.isArray(tags) ? tags : [];
      if (popularity_score !== undefined) allowedUpdates.popularity_score = parseInt(popularity_score, 10) || 0;
      if (delivery_available !== undefined) allowedUpdates.delivery_available = delivery_available !== false;

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

      let data, error;
      try {
        const updateRes = await supabase
          .from('products')
          .update(allowedUpdates)
          .eq('id', id)
          .select()
          .single();
        data = updateRes.data;
        error = updateRes.error;
      } catch (dbErr) {
        error = dbErr;
      }

      // Handle fallback if database is missing search columns (PGRST204)
      if (error && (error.code === 'PGRST204' || String(error.message).includes('column'))) {
        console.warn('[DB Fallback] Schema lacks new updates columns, retrying fallback update.');
        const fallbackUpdates = { ...allowedUpdates };
        delete fallbackUpdates.brand;
        delete fallbackUpdates.city;
        delete fallbackUpdates.locality;
        delete fallbackUpdates.tags;
        delete fallbackUpdates.popularity_score;
        delete fallbackUpdates.delivery_available;

        const fallbackRes = await supabase
          .from('products')
          .update(fallbackUpdates)
          .eq('id', id)
          .select()
          .single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;

      // Invalidate catalog cache
      await cache.delPattern('products:');

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

  // GET /api/products/search (Intelligent Search & Smart Ranking API)
  searchProducts: async (req, res, next) => {
    const startTime = Date.now();
    try {
      const {
        q, search, category, brand, city, locality, tags,
        price_min, price_max, distance_max, rating_min, condition,
        delivery_available, deposit_min, deposit_max, owner_verified,
        sort_by = 'best_match', limit = 20, cursor
      } = req.query;

      const searchQuery = (q || search || '').trim();
      const pageLimit = Math.min(parseInt(limit, 10) || 20, 100);
      let pageOffset = 0;

      // Decode offset from Base64 cursor if provided
      if (cursor) {
        try {
          const decoded = Buffer.from(cursor, 'base64').toString('ascii');
          const parsedOffset = parseInt(decoded, 10);
          if (!isNaN(parsedOffset)) pageOffset = parsedOffset;
        } catch (e) {
          console.warn('Invalid pagination cursor ignored:', e.message);
        }
      }

      // Generate cache key
      const cacheKey = `products:search:${searchQuery}:${category || ''}:${brand || ''}:${city || ''}:${locality || ''}:${tags || ''}:${price_min || ''}:${price_max || ''}:${distance_max || ''}:${rating_min || ''}:${condition || ''}:${delivery_available || ''}:${deposit_min || ''}:${deposit_max || ''}:${owner_verified || ''}:${sort_by}:${pageLimit}:${pageOffset}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // 1. Fetch available products with owner details (to avoid N+1 query patterns)
      let rawProducts, error;
      try {
        const res = await supabase
          .from('products')
          .select('*, owner:users!owner_id(name, avatar_url, rating_average, rating_count, kyc_verified, trust_score)')
          .eq('is_available', true)
          .range(0, 999);
        rawProducts = res.data;
        error = res.error;
      } catch (dbErr) {
        error = dbErr;
      }

      if (error) {
        console.warn('[Search DB Fallback] Fetch with advanced user columns failed, falling back to basic join.');
        try {
          const resFallback = await supabase
            .from('products')
            .select('*, owner:users!owner_id(name, avatar_url, rating_average, rating_count)')
            .eq('is_available', true)
            .range(0, 999);
          rawProducts = resFallback.data;
          error = resFallback.error;
        } catch (dbErr2) {
          error = dbErr2;
        }

        if (error) {
          console.warn('[Search DB Fallback] Join failed completely, fetching products only.');
          try {
            const resDoubleFallback = await supabase
              .from('products')
              .select('*')
              .eq('is_available', true)
              .range(0, 999);
            rawProducts = resDoubleFallback.data;
            error = resDoubleFallback.error;
          } catch (dbErr3) {
            error = dbErr3;
          }
        }
      }

      if (error) throw error;

      let results = rawProducts || [];

      // 2. Geodistance calculations
      const centerLat = parseFloat(req.query.lat || req.query.latitude);
      const centerLng = parseFloat(req.query.lng || req.query.longitude);
      const hasCoords = !isNaN(centerLat) && !isNaN(centerLng);

      results = results.map(p => {
        let dist = null;
        if (hasCoords && p.latitude && p.longitude) {
          dist = haversineKm(centerLat, centerLng, parseFloat(p.latitude), parseFloat(p.longitude));
        }
        return {
          ...p,
          distance_km: dist !== null ? parseFloat(dist.toFixed(2)) : null
        };
      });

      // 3. Apply Filters
      if (category && category !== 'All') {
        results = results.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      }
      if (brand) {
        results = results.filter(p => p.brand?.toLowerCase().includes(brand.toLowerCase()));
      }
      if (city) {
        results = results.filter(p => p.city?.toLowerCase() === city.toLowerCase());
      }
      if (locality) {
        results = results.filter(p => p.locality?.toLowerCase().includes(locality.toLowerCase()));
      }
      if (tags) {
        const tagList = (Array.isArray(tags) ? tags : [tags]).map(t => String(t).toLowerCase());
        results = results.filter(p => {
          const prodTags = (p.tags || []).map(t => String(t).toLowerCase());
          return tagList.some(t => prodTags.includes(t));
        });
      }
      if (price_min) {
        results = results.filter(p => parseFloat(p.price_per_day) >= parseFloat(price_min));
      }
      if (price_max) {
        results = results.filter(p => parseFloat(p.price_per_day) <= parseFloat(price_max));
      }
      if (deposit_min) {
        results = results.filter(p => parseFloat(p.deposit_amount || 0) >= parseFloat(deposit_min));
      }
      if (deposit_max) {
        results = results.filter(p => parseFloat(p.deposit_amount || 0) <= parseFloat(deposit_max));
      }
      if (distance_max && hasCoords) {
        results = results.filter(p => p.distance_km !== null && p.distance_km <= parseFloat(distance_max));
      }
      if (rating_min) {
        results = results.filter(p => parseFloat(p.owner?.rating_average || 0) >= parseFloat(rating_min));
      }
      if (condition && condition !== 'All') {
        results = results.filter(p => p.condition?.toLowerCase() === condition.toLowerCase());
      }
      if (delivery_available === 'true') {
        results = results.filter(p => p.delivery_available === true);
      }
      if (owner_verified === 'true') {
        results = results.filter(p => p.owner?.kyc_verified === true);
      }

      // 4. Calculate smart ranking score for "best_match"
      results = results.map(item => {
        let score = 0;
        const queryText = searchQuery.toLowerCase();

        if (queryText) {
          const title = (item.title || '').toLowerCase();
          const desc = (item.description || '').toLowerCase();
          const cat = (item.category || '').toLowerCase();
          const brandName = (item.brand || '').toLowerCase();
          const loc = (item.location || '').toLowerCase();
          const localityName = (item.locality || '').toLowerCase();
          const cityName = (item.city || '').toLowerCase();
          const ownerName = (item.owner?.name || '').toLowerCase();
          const tagsArr = Array.isArray(item.tags) ? item.tags : [];

          // Exact phrases match
          if (title === queryText) score += 200;
          else if (title.includes(queryText)) score += 80;

          if (brandName === queryText) score += 100;
          else if (brandName && brandName.includes(queryText)) score += 40;

          if (desc.includes(queryText)) score += 30;
          if (cat.includes(queryText)) score += 50;
          if (loc.includes(queryText) || localityName.includes(queryText) || cityName.includes(queryText)) score += 30;
          if (ownerName.includes(queryText)) score += 25;

          // Word-by-word tokenized matches
          const words = queryText.split(/\s+/).filter(w => w.length > 1);
          words.forEach(word => {
            if (title.includes(word)) score += 20;
            if (brandName && brandName.includes(word)) score += 15;
            if (desc.includes(word)) score += 5;
            if (tagsArr.some(t => String(t).toLowerCase().includes(word))) score += 25;
          });
        } else {
          score += 50; // default baseline score if query text is empty
        }

        // Availability boost
        if (item.is_available) score += 50;

        // Owner Trust score
        const trust = Number(item.owner?.trust_score) || 100;
        score += (trust / 10);

        // Owner Verification
        if (item.owner?.kyc_verified) score += 15;

        // Rating
        const ratingAvg = Number(item.owner?.rating_average) || 0;
        const ratingCount = Number(item.owner?.rating_count) || 0;
        score += (ratingAvg * 8);
        score += Math.min(ratingCount * 0.5, 15);

        // Popularity views + custom popularity score
        const popularity = (Number(item.views_count) || 0) + (Number(item.popularity_score) || 0);
        score += Math.min(popularity * 0.1, 20);

        // Recency Decay Boost
        const ageInDays = (Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(20 - ageInDays, 0);
        score += recencyBoost;

        // Geodistance Penalty
        if (item.distance_km !== null) {
          score -= Math.min(item.distance_km * 2, 50);
        }

        return { ...item, ranking_score: parseFloat(score.toFixed(2)) };
      });

      // 5. Multi-faceted Sorting
      if (sort_by === 'newest') {
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sort_by === 'nearest') {
        results.sort((a, b) => {
          if (a.distance_km === null) return 1;
          if (b.distance_km === null) return -1;
          return a.distance_km - b.distance_km;
        });
      } else if (sort_by === 'lowest_price') {
        results.sort((a, b) => parseFloat(a.price_per_day) - parseFloat(b.price_per_day));
      } else if (sort_by === 'highest_rated') {
        results.sort((a, b) => (b.owner?.rating_average || 0) - (a.owner?.rating_average || 0));
      } else if (sort_by === 'most_rented') {
        results.sort((a, b) => (b.owner?.rating_count || 0) - (a.owner?.rating_count || 0));
      } else {
        // 'best_match' (default)
        results.sort((a, b) => b.ranking_score - a.ranking_score);
      }

      // 6. Pagination & Cursor Generation
      const paginatedResults = results.slice(pageOffset, pageOffset + pageLimit);
      const nextOffset = pageOffset + pageLimit;
      const nextCursor = nextOffset < results.length
        ? Buffer.from(String(nextOffset)).toString('base64')
        : null;

      const searchDuration = Date.now() - startTime;

      // 7. Dynamic AI suggestions matching prefix keywords
      let aiSuggestions = [];
      if (searchQuery) {
        const queryClean = searchQuery.toLowerCase();
        if (queryClean.includes('drill') || queryClean.includes('tool')) {
          aiSuggestions = ['Hammer Drill', 'Impact Drill', 'Cordless Drill', 'Circular Saw', 'Rotary Hammer'];
        } else if (queryClean.includes('camera') || queryClean.includes('lens') || queryClean.includes('photo')) {
          aiSuggestions = ['Tripod', 'Memory Card', 'Lighting Kit', 'Gimbal', 'Prime Lens', 'Camera Bag'];
        } else if (queryClean.includes('bike') || queryClean.includes('cycle')) {
          aiSuggestions = ['Helmet', 'Bike Lock', 'Cycling Gloves', 'Air Pump', 'Saddle Bag'];
        } else if (queryClean.includes('speaker') || queryClean.includes('audio') || queryClean.includes('sound')) {
          aiSuggestions = ['JBL Speaker', 'Microphone', 'Soundbar', 'Audio Cable', 'Speaker Stand'];
        }
      }

      const responsePayload = {
        success: true,
        data: paginatedResults,
        metadata: {
          total_count: results.length,
          has_more: nextCursor !== null,
          next_cursor: nextCursor,
          duration_ms: searchDuration,
          ai_suggestions: aiSuggestions
        }
      };

      // Log search query in the background
      if (searchQuery) {
        const userId = req.user ? req.user.id : null;
        supabase
          .from('search_analytics')
          .insert([{
            user_id: userId,
            query_text: searchQuery,
            results_count: results.length,
            duration_ms: searchDuration
          }])
          .then(({ error: logErr }) => {
            if (logErr) console.debug('Search analytics logging failed:', logErr.message);
          })
          .catch(() => {});
      }

      await cache.set(cacheKey, responsePayload, 60);
      return res.json(responsePayload);

    } catch (error) {
      next(error);
    }
  },

  // GET /api/products/search/trending
  getTrendingSearches: async (req, res, next) => {
    try {
      const cacheKey = 'products:search:trending';
      const cached = await cache.get(cacheKey);
      if (cached) return res.json(cached);

      const { data, error } = await supabase
        .from('search_analytics')
        .select('query_text')
        .order('created_at', { ascending: false })
        .limit(100);

      let trendingList = ['Sony A7', 'Mountain Bike', 'DeWalt Drill', 'JBL Speaker', 'PS5 Consoles'];

      if (!error && data && data.length > 0) {
        const frequencies = {};
        data.forEach(row => {
          const q = (row.query_text || '').trim();
          if (q.length > 2) frequencies[q] = (frequencies[q] || 0) + 1;
        });

        const sorted = Object.keys(frequencies).sort((a, b) => frequencies[b] - frequencies[a]);
        if (sorted.length > 0) trendingList = sorted.slice(0, 5);
      }

      const payload = { success: true, trending: trendingList };
      await cache.set(cacheKey, payload, 300);
      return res.json(payload);
    } catch {
      res.json({ success: true, trending: ['Sony A7', 'Mountain Bike', 'DeWalt Drill', 'JBL Speaker', 'PS5 Consoles'] });
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
