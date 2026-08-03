const supabase = require('../config/supabase');

const referralController = {
  // GET /api/referrals/my
  getMyReferrals: async (req, res, next) => {
    try {
      const user_id = req.user.id;

      // 1. Fetch user to check referral code & wallet balance
      const { data: user } = await supabase
        .from('users')
        .select('id, email, referral_code, wallet_balance')
        .eq('id', user_id)
        .single();

      let refCode = user?.referral_code;
      let walletBal = parseFloat(user?.wallet_balance || 0);

      // Auto-generate code if missing
      if (!refCode) {
        refCode = 'RENT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('users').update({ referral_code: refCode }).eq('id', user_id);
      }

      // 2. Fetch list of referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*, referred:users!referred_id(name, avatar_url, created_at)')
        .eq('referrer_id', user_id)
        .order('created_at', { ascending: false });

      res.json({
        success: true,
        referral_code: refCode,
        wallet_balance: walletBal,
        reward_per_referral: 10.00,
        referral_count: referrals ? referrals.length : 0,
        referrals: referrals || []
      });

    } catch (error) {
      next(error);
    }
  },

  // POST /api/referrals/claim
  claimReferralCode: async (req, res, next) => {
    try {
      const { referral_code } = req.body;
      const referred_id = req.user.id;

      if (!referral_code || typeof referral_code !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'referral_code is required.', status: 400 } });
      }

      const cleanCode = referral_code.trim().toUpperCase();

      // 1. Find referrer user
      const { data: referrer, error: refErr } = await supabase
        .from('users')
        .select('id, email, referral_code')
        .eq('referral_code', cleanCode)
        .single();

      if (refErr || !referrer) {
        return res.status(404).json({ success: false, error: { message: 'Invalid referral code.', status: 404 } });
      }

      // Fraud check: Cannot refer self
      if (referrer.id === referred_id) {
        return res.status(400).json({ success: false, error: { message: 'You cannot use your own referral code.', status: 400 } });
      }

      // Check if already claimed
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', referred_id)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ success: false, error: { message: 'You have already claimed a referral code.', status: 409 } });
      }

      // Create pending referral & instantly grant $10 store credit to welcome referred user!
      const { data: refRecord, error: insertErr } = await supabase
        .from('referrals')
        .insert([{
          referrer_id: referrer.id,
          referred_id: referred_id,
          referral_code: cleanCode,
          status: 'rewarded',
          reward_amount: 10.00
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Add $10 to referred user's wallet
      const { data: u } = await supabase.from('users').select('wallet_balance').eq('id', referred_id).single();
      const cur = parseFloat(u?.wallet_balance || 0);
      await supabase.from('users').update({ wallet_balance: cur + 10.00 }).eq('id', referred_id);

      // Add $10 to referrer's wallet
      const { data: refUser } = await supabase.from('users').select('wallet_balance').eq('id', referrer.id).single();
      const refCur = parseFloat(refUser?.wallet_balance || 0);
      await supabase.from('users').update({ wallet_balance: refCur + 10.00 }).eq('id', referrer.id);

      res.status(201).json({
        success: true,
        message: 'Referral code claimed successfully! $10 store credit added to your wallet balance.',
        reward_amount: 10.00,
        referral: refRecord
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = referralController;
