const supabase = require('../config/supabase');

const productController = {
  // GET /api/products
  getAllProducts: async (req, res, next) => {
    try {
      const { category, search, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('products')
        .select('*, owner:users!products_owner_id_fkey(name, avatar_url, rating_average, rating_count)')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/products/nearby
  getNearbyProducts: async (req, res, next) => {
    try {
      const { minLat, maxLat, minLng, maxLng } = req.query;

      if (!minLat || !maxLat || !minLng || !maxLng) {
        return res.status(400).json({ message: 'Bounding box coordinates are required' });
      }

      // Simple bounding box query on latitude and longitude
      const { data, error } = await supabase
        .from('products')
        .select('*, owner:users!products_owner_id_fkey(name, avatar_url, rating_average, rating_count)')
        .eq('is_available', true)
        .gte('latitude', parseFloat(minLat))
        .lte('latitude', parseFloat(maxLat))
        .gte('longitude', parseFloat(minLng))
        .lte('longitude', parseFloat(maxLng));

      if (error) throw error;

      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/products/:id
  getProductById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: product, error } = await supabase
        .from('products')
        .select('*, owner:users!products_owner_id_fkey(id, name, avatar_url, rating_average, rating_count, created_at)')
        .eq('id', id)
        .single();

      if (error || !product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
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
        images 
      } = req.body;
      const owner_id = req.user.id;

      if (!title || !price_per_day) {
        return res.status(400).json({ message: 'Title and price_per_day are required' });
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
          is_available: true
        }])
        .select()
        .single();

      if (error) throw error;

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
      const updates = req.body;

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('products')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (existing.owner_id !== owner_id) {
        return res.status(403).json({ message: 'Only the owner can update this product' });
      }

      // We do not want to allow updating the owner_id or id
      delete updates.id;
      delete updates.owner_id;

      const { data, error } = await supabase
        .from('products')
        .update(updates)
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
        return res.status(404).json({ message: 'Product not found' });
      }

      if (existing.owner_id !== owner_id) {
        return res.status(403).json({ message: 'Only the owner can delete this product' });
      }

      // Check if there are active bookings
      const { data: activeBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('product_id', id)
        .in('status', ['pending', 'approved', 'awaiting_handover', 'active', 'disputed']);
        
      if (bookingError) throw bookingError;

      if (activeBookings && activeBookings.length > 0) {
        return res.status(400).json({ message: 'Cannot delete product with active or pending bookings. Set it to unavailable instead.' });
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
  }
};

module.exports = productController;
