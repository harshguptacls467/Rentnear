const supabase = require('../config/supabase');

const riskController = {
  // POST /api/admin/risk/recalculate
  recalculateUserRisk: async (req, res, next) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: { message: 'userId is required.' } });
      }

      // 1. Fetch user data (KYC verified status)
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id, kyc_status, rating_average')
        .eq('id', userId)
        .single();

      if (userErr || !user) {
        return res.status(404).json({ success: false, error: { message: 'User not found.' } });
      }

      // 2. Fetch history telemetry metrics (failed logins, disputes, cancellations)
      const [
        { data: events },
        { data: bookings },
        { data: disputes }
      ] = await Promise.all([
        supabase.from('fraud_events').select('*').eq('user_id', userId),
        supabase.from('bookings').select('status').eq('renter_id', userId),
        supabase.from('disputes').select('status').eq('reporter_id', userId)
      ]);

      let score = 0;
      const factors = [];

      // Weight 1: KYC status
      if (user.kyc_status !== 'approved') {
        score += 15;
        factors.push('Identity not fully verified (KYC)');
      }

      // Weight 2: Failed logins
      const failedLogins = (events || []).filter(e => e.event_type === 'failed_login').length;
      if (failedLogins > 0) {
        const penalty = Math.min(failedLogins * 5, 20);
        score += penalty;
        factors.push(`Spike in failed login attempts (${failedLogins})`);
      }

      // Weight 3: Cancellations rate
      const totalBookings = bookings || [];
      const cancelled = totalBookings.filter(b => b.status === 'cancelled').length;
      if (totalBookings.length > 2 && (cancelled / totalBookings.length) > 0.3) {
        score += 20;
        factors.push('High booking cancellation rate');
      }

      // Weight 4: Disputes
      const totalDisputes = disputes || [];
      if (totalDisputes.length > 0) {
        score += 30;
        factors.push('Involved in payment or condition disputes');
      }

      // Clamp risk score to 100
      score = Math.min(score, 100);

      // Save/update score record
      const { data: riskRecord, error: upsertErr } = await supabase
        .from('user_risk_scores')
        .upsert({
          user_id: userId,
          risk_score: score,
          factors,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      // Automated action: Trigger manual audit queue if high risk
      if (score >= 70) {
        const { data: existingInvest } = await supabase
          .from('fraud_investigations')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['open', 'under_review'])
          .maybeSingle();

        if (!existingInvest) {
          await supabase.from('fraud_investigations').insert([{
            user_id: userId,
            status: 'open',
            notes: `Auto-flagged due to High Risk Score (${score}/100)`
          }]);
        }
      }

      res.json({
        success: true,
        riskScore: score,
        factors,
        riskRecord
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/risk/investigations
  getInvestigations: async (req, res, next) => {
    try {
      const { data: queue, error } = await supabase
        .from('fraud_investigations')
        .select('*, user:users(id, name, email, trust_score)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, queue: queue || [] });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/admin/risk/investigations/:id/resolve
  resolveInvestigation: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body; // 'resolved_safe', 'resolved_fraud'

      if (!status || !['resolved_safe', 'resolved_fraud'].includes(status)) {
        return res.status(400).json({ success: false, error: { message: 'Valid resolution status required.' } });
      }

      const { data: investigation, error: updateErr } = await supabase
        .from('fraud_investigations')
        .update({
          status,
          notes,
          assigned_admin_id: req.user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // If marked as confirmed fraud, trigger auto restriction/suspension on users table
      if (status === 'resolved_fraud') {
        await supabase
          .from('users')
          .update({ status: 'suspended' })
          .eq('id', investigation.user_id);
      }

      res.json({ success: true, investigation });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = riskController;
