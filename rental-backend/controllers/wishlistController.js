const supabase = require('../config/supabase');
const cache = require('../utils/cache');

const wishlistController = {
  // GET /api/wishlist
  getWishlist: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { search, sort_by } = req.query;

      const cacheKey = `wishlist:${userId}:${search || 'all'}:${sort_by || 'newest'}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          created_at,
          product:products (
            id,
            title,
            description,
            category,
            price_per_day,
            deposit_amount,
            images,
            is_available,
            condition,
            location,
            owner:users!owner_id (
              name,
              avatar_url,
              rating_average,
              rating_count
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.json({ success: true, count: 0, data: [] });
      }

      let items = (data || []).map(entry => ({
        wishlist_id: entry.id,
        saved_at: entry.created_at,
        ...entry.product
      })).filter(item => item && item.id);

      // Filtering by search
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(item => 
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
        );
      }

      // Sorting
      if (sort_by === 'price_asc') {
        items.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
      } else if (sort_by === 'price_desc') {
        items.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));
      }

      const responsePayload = {
        success: true,
        count: items.length,
        data: items
      };

      await cache.set(cacheKey, responsePayload, 30);
      return res.json(responsePayload);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/wishlist/:productId
  addToWishlist: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ success: false, error: { message: 'productId is required', status: 400 } });
      }

      const { data, error } = await supabase
        .from('wishlists')
        .insert([{ user_id: userId, product_id: productId }])
        .select()
        .single();

      if (error && error.code !== '23505') {
        // Ignore unique constraint violation (already saved)
        throw error;
      }

      await cache.delPattern(`wishlist:${userId}`);

      res.status(201).json({
        success: true,
        message: 'Item saved to wishlist',
        data: data || { user_id: userId, product_id: productId }
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/wishlist/:productId
  removeFromWishlist: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      await cache.delPattern(`wishlist:${userId}`);

      res.json({
        success: true,
        message: 'Item removed from wishlist'
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/wishlist (Clear all)
  clearWishlist: async (req, res, next) => {
    try {
      const userId = req.user.id;

      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);

      await cache.delPattern(`wishlist:${userId}`);

      res.json({
        success: true,
        message: 'Wishlist cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = wishlistController;
