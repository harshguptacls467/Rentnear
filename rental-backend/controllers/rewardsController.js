const supabase = require('../config/supabase');

const REWARD_AMOUNTS = {
  REFERRER_BONUS: 15.00,
  WELCOME_BONUS: 10.00
};

const rewardsController = {
  // Get wallet dashboard info
  getDashboard: async (req, res, next) => {
    try {
      const { userId } = req.params;

      const [
        { data: user, error: userErr },
        { data: referrals, error: refErr },
        { data: transactions, error: txErr }
      ] = await Promise.all([
        supabase.from('users').select('wallet_balance, referral_code').eq('id', userId).single(),
        supabase.from('referrals').select('status').eq('referrer_id', userId),
        supabase.from('wallet_transactions').select('amount, type').eq('user_id', userId)
      ]);

      if (userErr) throw userErr;

      let lifetimeEarned = 0;
      let lifetimeRedeemed = 0;
      
      if (transactions) {
        transactions.forEach(tx => {
          if (tx.amount > 0) lifetimeEarned += parseFloat(tx.amount);
          if (tx.amount < 0) lifetimeRedeemed += Math.abs(parseFloat(tx.amount));
        });
      }

      const pendingInvites = (referrals || []).filter(r => r.status === 'pending').length;
      const successfulInvites = (referrals || []).filter(r => r.status === 'rewarded').length;

      res.json({
        success: true,
        walletBalance: user.wallet_balance || 0,
        referralCode: user.referral_code,
        lifetimeEarned,
        lifetimeRedeemed,
        pendingInvites,
        successfulInvites
      });
    } catch (err) {
      next(err);
    }
  },

  // Get transaction history
  getTransactions: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, transactions: data || [] });
    } catch (err) {
      next(err);
    }
  },

  // Get detailed list of referrals
  getReferralsList: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          reward_amount,
          created_at,
          referred:referred_id ( name, avatar_url )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, referrals: data || [] });
    } catch (err) {
      next(err);
    }
  },

  // Internal trigger helper
  processPayout: async (bookingId) => {
    // 1. Get the booking to find the renter
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('renter_id, status')
      .eq('id', bookingId)
      .single();
      
    if (bookingErr || !booking || booking.status !== 'completed') {
      return { success: false, message: 'Invalid booking or not completed.' };
    }

    const renterId = booking.renter_id;

    // 2. Find if this user was referred and the status is pending
    const { data: referral, error: refErr } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', renterId)
      .eq('status', 'pending')
      .single();

    if (refErr || !referral) {
      return { success: true, message: 'No pending referral for this user.' };
    }

    // 3. Begin payout process
    const referrerId = referral.referrer_id;

    // Update Referral Status
    await supabase.from('referrals').update({ status: 'rewarded' }).eq('id', referral.id);

    // Get current balances
    const { data: users } = await supabase.from('users').select('id, wallet_balance').in('id', [referrerId, renterId]);
    const referrer = users.find(u => u.id === referrerId);
    const renter = users.find(u => u.id === renterId);

    // Add to balances
    const newReferrerBalance = parseFloat(referrer.wallet_balance || 0) + REWARD_AMOUNTS.REFERRER_BONUS;
    const newRenterBalance = parseFloat(renter.wallet_balance || 0) + REWARD_AMOUNTS.WELCOME_BONUS;

    await Promise.all([
      supabase.from('users').update({ wallet_balance: newReferrerBalance }).eq('id', referrerId),
      supabase.from('users').update({ wallet_balance: newRenterBalance }).eq('id', renterId),
      
      // Log transactions
      supabase.from('wallet_transactions').insert([
        {
          user_id: referrerId,
          amount: REWARD_AMOUNTS.REFERRER_BONUS,
          type: 'referral_bonus',
          reference_id: referral.id,
          description: `Referral bonus for inviting a friend`
        },
        {
          user_id: renterId,
          amount: REWARD_AMOUNTS.WELCOME_BONUS,
          type: 'welcome_bonus',
          reference_id: referral.id,
          description: `Welcome bonus for completing your first rental`
        }
      ])
    ]);

    return { success: true, message: 'Payout triggered successfully.' };
  },

  // API Route wrapper
  triggerPayout: async (req, res, next) => {
    try {
      const { bookingId } = req.body;
      const result = await rewardsController.processPayout(bookingId);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = rewardsController;
