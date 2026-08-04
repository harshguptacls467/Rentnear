const supabase = require('../config/supabase');
const cache = require('../utils/cache');

const analyticsController = {
  getOwnerDashboard: async (req, res, next) => {
    try {
      const ownerId = req.user.id;
      const cacheKey = `owner_analytics:${ownerId}`;

      // 1. Try to get from cache (TTL 15 mins)
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return res.json({ success: true, ...cachedData });
      }

      // 2. Fetch required data in parallel
      const [
        { data: bookings, error: bookingsError },
        { data: payouts, error: payoutsError },
        { data: products, error: productsError },
        { data: reviews, error: reviewsError },
        { data: wishlists, error: wishlistsError },
        { data: ownerData, error: ownerError }
      ] = await Promise.all([
        supabase.from('bookings').select('*, product:products(category)').eq('owner_id', ownerId),
        supabase.from('payouts').select('*').eq('owner_id', ownerId),
        supabase.from('products').select('*').eq('owner_id', ownerId),
        supabase.from('reviews').select('*').eq('reviewee_id', ownerId),
        // we can fetch all wishlists for these products, or just count them. 
        // We'll fetch wishlists where product is owned by owner. We can't directly query wishlists.owner_id, 
        // so we'll fetch wishlists based on product IDs.
        supabase.from('products').select('id, wishlists(*)').eq('owner_id', ownerId),
        supabase.from('users').select('rating_average, kyc_verified, email_verified').eq('id', ownerId).single()
      ]);

      if (bookingsError) throw bookingsError;
      if (productsError) throw productsError;

      const safeBookings = bookings || [];
      const safePayouts = payouts || [];
      const safeProducts = products || [];
      const safeReviews = reviews || [];
      const safeWishlists = wishlists || []; // This actually returns products with nested wishlists

      // 3. Calculate Top-Level Metrics
      let totalEarnings = 0;
      let pendingEarnings = 0;
      let securityDepositsHeld = 0;
      let completedRentals = 0;
      let activeRentals = 0;
      let cancelledBookings = 0;
      let repeatCustomersSet = new Set();
      let customerBookingCounts = {};

      safeBookings.forEach(b => {
        if (b.status === 'completed') {
          totalEarnings += parseFloat(b.total_amount) || 0;
          completedRentals++;
        }
        if (b.status === 'approved' || b.status === 'awaiting_handover' || b.status === 'active') {
          pendingEarnings += parseFloat(b.total_amount) || 0;
          securityDepositsHeld += parseFloat(b.deposit_amount) || 0;
        }
        if (b.status === 'active') activeRentals++;
        if (b.status === 'cancelled') cancelledBookings++;

        // Track repeat customers (completed bookings only)
        if (b.status === 'completed') {
          if (!customerBookingCounts[b.renter_id]) {
            customerBookingCounts[b.renter_id] = 1;
          } else {
            customerBookingCounts[b.renter_id]++;
            repeatCustomersSet.add(b.renter_id);
          }
        }
      });

      // Payouts might also reflect total earnings, but we'll use bookings total_amount for "gross earnings" 
      // or we can use payouts for net. Let's stick to bookings for simplicity unless specified.

      const responseRate = 95; // Mock for now, would require message response tracking
      const acceptanceRate = safeBookings.length > 0 
        ? Math.round(((safeBookings.length - cancelledBookings) / safeBookings.length) * 100) 
        : 100;

      // Profile Completion
      let profileScore = 50;
      if (ownerData?.kyc_verified) profileScore += 25;
      if (ownerData?.email_verified) profileScore += 25;

      const metrics = {
        totalEarnings,
        pendingEarnings,
        securityDepositsHeld,
        totalBookings: safeBookings.length,
        activeRentals,
        completedRentals,
        cancelledBookings,
        averageRating: ownerData?.rating_average || 0,
        responseRate,
        acceptanceRate,
        repeatCustomers: repeatCustomersSet.size,
        profileScore
      };

      // 4. Calculate Charts Data
      
      // A. Earnings (Month-by-Month for the current year)
      const currentYear = new Date().getFullYear();
      const monthlyEarningsMap = {};
      for (let i = 0; i < 12; i++) monthlyEarningsMap[i] = 0;
      
      safeBookings.forEach(b => {
        if (b.status === 'completed') {
          const d = new Date(b.created_at);
          if (d.getFullYear() === currentYear) {
            monthlyEarningsMap[d.getMonth()] += parseFloat(b.total_amount) || 0;
          }
        }
      });
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const earningsChart = Object.keys(monthlyEarningsMap).map(m => ({
        date: monthNames[m],
        amount: monthlyEarningsMap[m]
      }));

      // B. Booking Trends (Last 7 days)
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();
      
      const bookingTrendsMap = {};
      last7Days.forEach(date => bookingTrendsMap[date] = 0);

      safeBookings.forEach(b => {
        const dateStr = new Date(b.created_at).toISOString().split('T')[0];
        if (bookingTrendsMap[dateStr] !== undefined) {
          bookingTrendsMap[dateStr]++;
        }
      });
      const bookingTrendsChart = Object.keys(bookingTrendsMap).map(date => ({
        date,
        count: bookingTrendsMap[date]
      }));

      // C. Revenue by Category
      const categoryMap = {};
      safeBookings.forEach(b => {
        if (b.status === 'completed' && b.product && b.product.category) {
          if (!categoryMap[b.product.category]) categoryMap[b.product.category] = 0;
          categoryMap[b.product.category] += parseFloat(b.total_amount) || 0;
        }
      });
      const revenueByCategoryChart = Object.keys(categoryMap).map(cat => ({
        category: cat,
        revenue: categoryMap[cat]
      })).sort((a,b) => b.revenue - a.revenue);

      // 5. Product Insights
      const wishlistCountMap = {};
      safeWishlists.forEach(p => {
        wishlistCountMap[p.id] = p.wishlists ? p.wishlists.length : 0;
      });

      const productInsights = safeProducts.map(p => {
        const productBookings = safeBookings.filter(b => b.product_id === p.id);
        const revenue = productBookings
          .filter(b => b.status === 'completed')
          .reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0);
        
        const views = p.views_count || 0;
        const bookingCount = productBookings.length;
        const conversionRate = views > 0 ? ((bookingCount / views) * 100).toFixed(2) : 0;
        
        const lastBooking = productBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        const insights = [];
        if (views > 100 && bookingCount === 0) insights.push('High views, 0 bookings. Consider lowering price.');
        if (bookingCount > 5) insights.push('Frequently booked badge earned!');
        if (!p.images || p.images.length === 0) insights.push('Add photos to improve conversion.');

        return {
          id: p.id,
          title: p.title,
          views,
          wishlistCount: wishlistCountMap[p.id] || 0,
          bookingCount,
          conversionRate: parseFloat(conversionRate),
          revenue,
          lastBookingDate: lastBooking ? lastBooking.created_at : null,
          insights
        };
      });

      // 6. Global Actionable Insights
      const actionableInsights = [];
      if (acceptanceRate < 80) actionableInsights.push({ type: 'warning', message: 'Low acceptance rate. Approving more requests boosts your rank.' });
      if (safeProducts.some(p => (!p.images || p.images.length === 0))) {
         actionableInsights.push({ type: 'suggestion', message: 'Some products are missing images. Listings with images get 3x more bookings.' });
      }
      if (repeatCustomersSet.size > 2) {
         actionableInsights.push({ type: 'success', message: 'You have repeat customers! Excellent service pays off.' });
      }

      const responsePayload = {
        metrics,
        charts: {
          earnings: earningsChart,
          bookingTrends: bookingTrendsChart,
          revenueByCategory: revenueByCategoryChart
        },
        products: productInsights,
        actionableInsights
      };

      // Cache for 15 minutes (900 seconds)
      await cache.set(cacheKey, responsePayload, 900);

      res.json({ success: true, ...responsePayload });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/analytics/search/event (Log Click & Conversion events)
  logSearchEvent: async (req, res, next) => {
    try {
      const { search_log_id, event_type, product_id, query } = req.body;
      const userId = req.user ? req.user.id : null;

      if (search_log_id) {
        const updateFields = {};
        if (event_type === 'click') {
          updateFields.clicked = true;
          if (product_id) updateFields.clicked_product_id = product_id;
        } else if (event_type === 'conversion') {
          updateFields.converted = true;
        }

        const { error } = await supabase
          .from('search_analytics')
          .update(updateFields)
          .eq('id', search_log_id);

        if (error) throw error;
      } else if (query) {
        const { data: latest } = await supabase
          .from('search_analytics')
          .select('id')
          .eq('query_text', query)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          const updateFields = {};
          if (event_type === 'click') {
            updateFields.clicked = true;
            if (product_id) updateFields.clicked_product_id = product_id;
          } else if (event_type === 'conversion') {
            updateFields.converted = true;
          }

          await supabase
            .from('search_analytics')
            .update(updateFields)
            .eq('id', latest.id);
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.warn('Search event logging failed:', err.message);
      res.json({ success: true });
    }
  },

  // GET /api/analytics/search/report (Admin Search Analytics Dashboard report)
  getSearchAnalyticsReport: async (req, res, next) => {
    try {
      if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Unauthorized. Admin access required.', status: 403 } });
      }

      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const safeData = data || [];
      const totalCount = safeData.length;
      
      let clickCount = 0;
      let conversionCount = 0;
      let totalDuration = 0;
      const noResultKeywords = {};
      const mostSearched = {};

      safeData.forEach(row => {
        if (row.clicked) clickCount++;
        if (row.converted) conversionCount++;
        totalDuration += row.duration_ms || 0;

        const q = (row.query_text || '').trim().toLowerCase();
        if (q) {
          mostSearched[q] = (mostSearched[q] || 0) + 1;
          if (row.results_count === 0) {
            noResultKeywords[q] = (noResultKeywords[q] || 0) + 1;
          }
        }
      });

      const avgDuration = totalCount > 0 ? parseFloat((totalDuration / totalCount).toFixed(1)) : 0;
      const ctr = totalCount > 0 ? parseFloat(((clickCount / totalCount) * 100).toFixed(2)) : 0;
      const conversionRate = totalCount > 0 ? parseFloat(((conversionCount / totalCount) * 100).toFixed(2)) : 0;

      const sortedMostSearched = Object.entries(mostSearched)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => ({ keyword: entry[0], count: entry[1] }));

      const sortedNoResult = Object.entries(noResultKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => ({ keyword: entry[0], count: entry[1] }));

      res.json({
        success: true,
        report: {
          total_searches: totalCount,
          average_duration_ms: avgDuration,
          click_through_rate: ctr,
          conversion_rate: conversionRate,
          most_searched_keywords: sortedMostSearched,
          no_result_keywords: sortedNoResult
        }
      });

    } catch (err) {
      next(err);
    }
  }
};

module.exports = analyticsController;

