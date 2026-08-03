const supabase = require('../config/supabase');
const cache = require('../utils/cache');

const calculateTrustMetrics = (user, bookings, reviews, disputes) => {
  let score = 50;
  const newBadges = new Set();
  const timelineEvents = [];

  // 1. Identity & Contact
  if (user.kyc_verified) {
    score += 20;
    newBadges.add('Identity Verified');
  }
  if (user.email_verified) {
    score += 10;
    newBadges.add('Email Verified');
  }

  // 2. Bookings (Renter & Owner)
  const completedOwnerBookings = bookings.filter(b => b.owner_id === user.id && b.status === 'completed');
  const completedRenterBookings = bookings.filter(b => b.renter_id === user.id && b.status === 'completed');
  const totalCompleted = completedOwnerBookings.length + completedRenterBookings.length;

  score += Math.min(totalCompleted * 2, 30); // Max +30 from completions

  if (completedOwnerBookings.length > 10) newBadges.add('Trusted Owner');
  if (completedRenterBookings.length >= 3) newBadges.add('Repeat Customer');

  // Cancellations
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled' && (b.renter_id === user.id || b.owner_id === user.id));
  score -= (cancelledBookings.length * 5);

  // 3. Reviews
  if (user.rating_count >= 5) {
    if (user.rating_average >= 4.8) {
      score += 10;
      newBadges.add('Top Rated');
    } else if (user.rating_average < 3.0) {
      score -= 10;
    }
  }

  // Super Owner Badge requires high trust score & owner completions
  if (score >= 80 && completedOwnerBookings.length > 10) {
    newBadges.add('Super Owner');
  }

  // 4. Disputes Penalty
  const disputesAgainstUser = disputes.filter(d => 
    (d.status === 'resolved_owner' && d.opened_by !== user.id) || 
    (d.status === 'resolved_renter' && d.opened_by !== user.id)
  );
  score -= (disputesAgainstUser.length * 15);

  // Bounds checking
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return {
    newScore: score,
    newBadges: Array.from(newBadges)
  };
};

const trustController = {
  // Public user profile trust details
  getUserTrustInfo: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const cacheKey = `trust_info:${userId}`;
      const cached = await cache.get(cacheKey);

      if (cached) return res.json({ success: true, ...cached });

      const [
        { data: user, error: userErr },
        { data: history, error: historyErr }
      ] = await Promise.all([
        supabase.from('users').select('trust_score, badges, kyc_verified, email_verified, rating_average, created_at').eq('id', userId).single(),
        supabase.from('trust_score_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      if (userErr) throw userErr;

      const payload = {
        trustScore: user.trust_score || 50,
        badges: user.badges || [],
        verifiedFields: {
          kyc: user.kyc_verified,
          email: user.email_verified
        },
        rating: user.rating_average,
        memberSince: user.created_at,
        recentHistory: history || []
      };

      await cache.set(cacheKey, payload, 900); // 15 min cache
      res.json({ success: true, ...payload });
    } catch (err) {
      next(err);
    }
  },

  // Recalculate trust score internally or via cron/webhook
  recalculateTrustScore: async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      const [
        { data: user, error: userErr },
        { data: bookings, error: bookingsErr },
        { data: reviews, error: reviewsErr },
        { data: disputes, error: disputesErr }
      ] = await Promise.all([
        supabase.from('users').select('id, trust_score, badges, kyc_verified, email_verified, rating_average, rating_count').eq('id', userId).single(),
        supabase.from('bookings').select('id, owner_id, renter_id, status').or(`owner_id.eq.${userId},renter_id.eq.${userId}`),
        supabase.from('reviews').select('*').eq('reviewee_id', userId),
        supabase.from('disputes').select('*').or(`opened_by.eq.${userId}`) 
          // Note: Full dispute logic might require joining bookings to see if user was the owner/renter when they lost
      ]);

      if (userErr) throw userErr;

      // In real scenario, disputes filter needs booking context. We'll use mocked array for now if missing.
      const safeDisputes = disputesErr ? [] : disputes; 
      
      const { newScore, newBadges } = calculateTrustMetrics(
        user,
        bookings || [],
        reviews || [],
        safeDisputes
      );

      const oldScore = user.trust_score || 50;

      // Update if changed
      if (newScore !== oldScore || JSON.stringify(newBadges) !== JSON.stringify(user.badges)) {
        await supabase.from('users').update({
          trust_score: newScore,
          badges: newBadges
        }).eq('id', userId);

        if (newScore !== oldScore) {
          await supabase.from('trust_score_history').insert({
            user_id: userId,
            previous_score: oldScore,
            new_score: newScore,
            reason: newScore > oldScore ? 'Automated Recalculation (Positive)' : 'Automated Recalculation (Penalty)'
          });
        }
        
        // Invalidate cache
        await cache.del(`trust_info:${userId}`);
      }

      res.json({ success: true, previousScore: oldScore, newScore, badges: newBadges });
    } catch (err) {
      next(err);
    }
  },

  // Admin adjust score
  adminAdjustScore: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { adjustment, reason } = req.body;
      
      if (!adjustment || !reason) {
        return res.status(400).json({ success: false, error: 'Adjustment and reason required' });
      }

      const { data: user } = await supabase.from('users').select('trust_score').eq('id', userId).single();
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      let newScore = (user.trust_score || 50) + Number(adjustment);
      if (newScore > 100) newScore = 100;
      if (newScore < 0) newScore = 0;

      await supabase.from('users').update({ trust_score: newScore }).eq('id', userId);
      
      await supabase.from('trust_score_history').insert({
        user_id: userId,
        previous_score: user.trust_score || 50,
        new_score: newScore,
        reason: `Admin Adjustment: ${reason}`
      });

      await cache.del(`trust_info:${userId}`);
      res.json({ success: true, newScore });
    } catch (err) {
      next(err);
    }
  },

  // Fraud Alerts Queue
  getFraudAlerts: async (req, res, next) => {
    try {
      // Find users with multiple cancellations or low trust score + high disputes
      // Simple heuristic for demonstration:
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, trust_score, created_at, risk_score')
        .lt('trust_score', 30)
        .order('trust_score', { ascending: true })
        .limit(20);

      if (error) throw error;
      res.json({ success: true, alerts: users });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = trustController;
