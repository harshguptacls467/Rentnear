/**
 * adminService.js — Production Supabase-direct admin service
 *
 * All operations use the Supabase JS client with the authenticated admin JWT.
 * This removes the dependency on the Express backend for admin operations.
 * Every mutation auto-logs to admin_audit_logs.
 */
import { supabase } from '../supabaseClient';

// ─── Audit Logger ─────────────────────────────────────────────────────────────
const logAdminAction = async (action, targetId, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action,
      target_id: String(targetId),
      details,
      ip_address: 'client',
      user_agent: navigator.userAgent.slice(0, 200),
    });
  } catch (e) {
    console.warn('Audit log failed (non-critical):', e.message);
  }
};

// ─── Stats ─────────────────────────────────────────────────────────────────────
export const adminService = {

  getStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: totalProducts },
      { count: activeListings },
      { count: bookingsToday },
      { count: liveRentals },
      { count: completedRentals },
      { count: openDisputes },
      { data: revenueData },
      { data: refundData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('kyc_verified', true),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_available', true),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'live'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('payments').select('amount').eq('status', 'captured'),
      supabase.from('payments').select('amount').eq('status', 'refunded'),
    ]);

    const revenue = (revenueData || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const refunds = (refundData || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const platformCommission = revenue * 0.10;

    return {
      totalUsers: totalUsers || 0,
      verifiedUsers: verifiedUsers || 0,
      totalProducts: totalProducts || 0,
      activeListings: activeListings || 0,
      bookingsToday: bookingsToday || 0,
      liveRentals: liveRentals || 0,
      completedRentals: completedRentals || 0,
      openDisputes: openDisputes || 0,
      revenue,
      platformCommission,
      refunds,
      systemHealth: 'Healthy',
    };
  },

  // ─── Users ──────────────────────────────────────────────────────────────────
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, avatar_url, role, kyc_verified, kyc_status, is_admin, is_banned, admin_status, created_at, location')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  toggleUserBan: async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('users')
      .update({ is_banned: newStatus })
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await logAdminAction(newStatus ? 'user:ban' : 'user:unban', userId);
  },

  updateUserRole: async (userId, payload) => {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await logAdminAction('user:role_update', userId, payload);
  },

  // ─── Products (Listings) ─────────────────────────────────────────────────────
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, description, category, price_per_day, price_per_hour, deposit_amount,
        location, latitude, longitude, is_available, images, created_at,
        condition, status, is_featured, is_trending, is_premium, owner_id,
        owner:users!products_owner_id_fkey(id, name, email, avatar_url)
      `)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  updateListingStatus: async (productId, payload) => {
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId);
    if (error) throw new Error(error.message);
    await logAdminAction('listing:update', productId, payload);
  },

  removeProduct: async (productId) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw new Error(error.message);
    await logAdminAction('listing:delete', productId);
  },

  // ─── KYC Submissions ─────────────────────────────────────────────────────────
  getKycSubmissions: async () => {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select(`
        id, user_id, id_type, id_number, front_url, back_url, selfie_url,
        status, admin_notes, created_at,
        user:users!kyc_submissions_user_id_fkey(id, name, email, avatar_url)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    // Generate signed URLs for private storage
    const enriched = await Promise.all((data || []).map(async (kyc) => {
      const getSignedUrl = async (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; // already a public URL
        const { data: urlData } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(path, 3600);
        return urlData?.signedUrl || path;
      };
      return {
        ...kyc,
        front_signed_url: await getSignedUrl(kyc.front_url),
        back_signed_url: await getSignedUrl(kyc.back_url),
        selfie_signed_url: await getSignedUrl(kyc.selfie_url),
      };
    }));

    return enriched;
  },

  resolveKyc: async (kycId, status, notes, userId) => {
    // 1. Update KYC record
    const { error: kycError } = await supabase
      .from('kyc_submissions')
      .update({ status, admin_notes: notes })
      .eq('id', kycId);
    if (kycError) throw new Error(kycError.message);

    // 2. Update user verification status
    if (userId) {
      const userUpdate = {
        kyc_status: status === 'approved' ? 'verified' : status,
        kyc_verified: status === 'approved',
      };
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', userId);
      if (userError) console.warn('User KYC status update failed:', userError.message);

      // 3. Send notification to user
      const notifMsg = status === 'approved'
        ? '✅ Your KYC has been approved! You can now list items.'
        : status === 'rejected'
          ? `❌ Your KYC was rejected. Reason: ${notes || 'Please contact support.'}`
          : '⚠️ Please re-upload your KYC documents. ' + (notes || '');

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'kyc_update',
        message: notifMsg,
        is_read: false,
      });
    }

    await logAdminAction(`kyc:${status}`, kycId, { notes, userId });
  },

  // ─── Bookings ────────────────────────────────────────────────────────────────
  getBookings: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, start_date, end_date, total_amount, deposit_amount, status, created_at, message,
        product:products!bookings_product_id_fkey(id, title, images, category),
        renter:users!bookings_renter_id_fkey(id, name, email, avatar_url),
        owner:users!bookings_owner_id_fkey(id, name, email, avatar_url)
      `)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  updateBookingStatus: async (bookingId, payload) => {
    const { error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', bookingId);
    if (error) throw new Error(error.message);
    await logAdminAction('booking:status_update', bookingId, payload);
  },

  // ─── Disputes ────────────────────────────────────────────────────────────────
  getDisputes: async () => {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        id, reason, description, evidence_photos, status, admin_notes, resolution_amount, created_at,
        booking:bookings!disputes_booking_id_fkey(
          id, start_date, end_date,
          product:products!bookings_product_id_fkey(id, title),
          renter:users!bookings_renter_id_fkey(id, name, email),
          owner:users!bookings_owner_id_fkey(id, name, email)
        ),
        reporter:users!disputes_reported_by_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  resolveDispute: async (disputeId, resolution, notes, amount) => {
    const { error } = await supabase
      .from('disputes')
      .update({
        status: resolution,
        admin_notes: notes,
        resolution_amount: amount ? parseFloat(amount) : 0,
      })
      .eq('id', disputeId);
    if (error) throw new Error(error.message);
    await logAdminAction('dispute:resolve', disputeId, { resolution, notes, amount });
  },

  // ─── Payments ────────────────────────────────────────────────────────────────
  getPayments: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id, amount, deposit_amount, status, payment_method, created_at,
        stripe_payment_intent_id, stripe_session_id,
        booking:bookings!payments_booking_id_fkey(
          id, 
          renter:users!bookings_renter_id_fkey(id, name, email),
          product:products!bookings_product_id_fkey(id, title)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  processRefund: async (payload) => {
    // Mark payment as refunded in DB
    const { error } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', payload.payment_id);
    if (error) throw new Error(error.message);
    await logAdminAction('payment:refund', payload.payment_id, payload);
  },

  // ─── Categories ──────────────────────────────────────────────────────────────
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return data || [];
  },

  createCategory: async (payload) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction('category:create', data.id, payload);
    return data;
  },

  updateCategory: async (id, payload) => {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction('category:update', id, payload);
    return data;
  },

  deleteCategory: async (id) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    await logAdminAction('category:delete', id);
  },

  // ─── Banners ─────────────────────────────────────────────────────────────────
  getBanners: async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('position');
    if (error) throw new Error(error.message);
    return data || [];
  },

  createBanner: async (payload) => {
    const { data, error } = await supabase
      .from('banners')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction('banner:create', data.id, payload);
    return data;
  },

  updateBanner: async (id, payload) => {
    const { data, error } = await supabase
      .from('banners')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction('banner:update', id, payload);
    return data;
  },

  deleteBanner: async (id) => {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    await logAdminAction('banner:delete', id);
  },

  // ─── Notifications ───────────────────────────────────────────────────────────
  sendBulkNotification: async ({ message, target_role, target_city }) => {
    // Fetch target users
    let query = supabase.from('users').select('id, role, location').eq('is_banned', false);
    if (target_role !== 'all') query = query.eq('role', target_role);
    const { data: targetUsers, error } = await query;
    if (error) throw new Error(error.message);

    let filtered = targetUsers || [];
    if (target_city) {
      filtered = filtered.filter(u =>
        u.location?.toLowerCase().includes(target_city.toLowerCase())
      );
    }

    if (filtered.length === 0) {
      throw new Error('No users match the selected filters.');
    }

    // Batch insert notifications
    const notifications = filtered.map(u => ({
      user_id: u.id,
      type: 'admin_broadcast',
      message,
      is_read: false,
    }));

    const BATCH_SIZE = 100;
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase.from('notifications').insert(batch);
      if (insertError) throw new Error(insertError.message);
    }

    await logAdminAction('notification:bulk_send', 'all', { target_role, target_city, count: filtered.length });
    return { sent: filtered.length };
  },

  // ─── Audit Logs ──────────────────────────────────────────────────────────────
  getAuditLogs: async () => {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select(`
        id, action, target_id, details, ip_address, user_agent, created_at,
        admin:users!admin_audit_logs_admin_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data || [];
  },
};
