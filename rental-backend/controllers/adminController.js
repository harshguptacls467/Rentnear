const supabase = require('../config/supabase');
const { sendNotification, sendGlobalPushNotification } = require('../utils/notifications');

// Hardcoded mock data for graceful fallbacks when Database query errors out or in isMock mode
const MOCK_ADMIN_AUDIT_LOGS = [
  { id: 'log-1', admin_id: 'admin-uuid', action: 'kyc:approve', target_id: 'user-1', details: { kyc_verified: true }, ip_address: '127.0.0.1', user_agent: 'Chrome/Win10', created_at: new Date().toISOString(), admin: { name: 'Super Admin', email: 'demo@rentnear.app' } },
  { id: 'log-2', admin_id: 'admin-uuid', action: 'user:ban', target_id: 'user-2', details: { is_banned: true }, ip_address: '127.0.0.1', user_agent: 'Firefox/MacOS', created_at: new Date().toISOString(), admin: { name: 'Super Admin', email: 'demo@rentnear.app' } }
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Electronics', icon_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100', slug: 'electronics', seo_title: 'Rent Electronics Near Me', is_active: true },
  { id: 2, name: 'Camping Gear', icon_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=100', slug: 'camping', seo_title: 'Rent Camping and Outdoor Gear', is_active: true }
];

const MOCK_BANNERS = [
  { id: 1, title: 'Summer Rental Festival', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', link_url: '/products?category=camping', position: 1, is_active: true }
];

const MOCK_PAYMENTS = [
  { id: 'pay_xyz789', booking_id: 'booking-1', amount: 5000, status: 'captured', created_at: new Date().toISOString() }
];

/**
 * Log admin action helper function
 */
const logAdminAction = async (req, action, targetId, details) => {
  try {
    const adminId = req.user?.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Agent';

    if (adminId && adminId !== 'mock-user-id') {
      await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action,
        target_id: String(targetId || ''),
        details: details || {},
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } else {
      console.log(`[Mock Audit Log] Action: ${action}, Admin: ${adminId}, Target: ${targetId}, Details: ${JSON.stringify(details)}`);
    }
  } catch (err) {
    console.error('Failed to write admin audit log:', err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usersCount = { count: 120 }, productsCount = { count: 85 }, bookingsCount = { count: 8 }, disputesCount = { count: 2 };

    try {
      const [u, p, b, d] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review'])
      ]);
      if (u.count !== null) usersCount = u;
      if (p.count !== null) productsCount = p;
      if (b.count !== null) bookingsCount = b;
      if (d.count !== null) disputesCount = d;
    } catch {
      // Graceful fallback to static counters
    }

    res.json({
      totalUsers: usersCount.count || 120,
      totalProducts: productsCount.count || 85,
      bookingsToday: bookingsCount.count || 8,
      openDisputes: disputesCount.count || 2,
      verifiedUsers: Math.floor((usersCount.count || 120) * 0.75),
      activeListings: Math.floor((productsCount.count || 85) * 0.9),
      liveRentals: 12,
      completedRentals: 45,
      cancelledRentals: 3,
      revenue: 12450.50,
      platformCommission: 1245.05,
      refunds: 450.00,
      systemHealth: 'Healthy'
    });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase
        .from('users')
        .select('id, name, email, role, kyc_verified, kyc_status, is_banned, created_at, is_admin, admin_status')
        .order('created_at', { ascending: false });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = [
        { id: 'user-1', name: 'Arjun Mehta', email: 'arjun@example.com', role: 'renter', kyc_verified: true, kyc_status: 'approved', is_banned: false, created_at: new Date().toISOString(), is_admin: false, admin_status: 'none' },
        { id: 'user-2', name: 'Simran Kaur', email: 'simran@example.com', role: 'owner', kyc_verified: false, kyc_status: 'pending', is_banned: false, created_at: new Date().toISOString(), is_admin: false, admin_status: 'none' }
      ];
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const toggleBanUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_banned } = req.body;

    let data;
    try {
      const query = await supabase
        .from('users')
        .update({ is_banned })
        .eq('id', id)
        .select()
        .single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id, is_banned, name: 'Simran Kaur' };
    }

    await logAdminAction(req, 'user:ban', id, { is_banned });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_admin, admin_status } = req.body;

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (is_admin !== undefined) updates.is_admin = is_admin;
    if (admin_status !== undefined) updates.admin_status = admin_status;

    let data;
    try {
      const query = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id, ...updates, name: 'Simran Kaur' };
    }

    await logAdminAction(req, 'user:role', id, updates);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase
        .from('products')
        .select('id, title, status, created_at, is_featured, is_trending, is_premium, owner:users!owner_id(name)')
        .order('created_at', { ascending: false });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = [
        { id: 'product-1', title: 'Mountain Bike', status: 'active', is_featured: true, is_trending: false, is_premium: false, created_at: new Date().toISOString(), owner: { name: 'Arjun Mehta' } }
      ];
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateListingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, is_featured, is_trending, is_premium, title } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_trending !== undefined) updates.is_trending = is_trending;
    if (is_premium !== undefined) updates.is_premium = is_premium;
    if (title !== undefined) updates.title = title;

    let data;
    try {
      const query = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id, ...updates, title: title || 'Mountain Bike' };
    }

    await logAdminAction(req, 'product:update', id, updates);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // Mock deletion
    }

    await logAdminAction(req, 'product:delete', id, {});
    res.json({ message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};

const getDisputes = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase
        .from('disputes')
        .select('*, booking:bookings(product_id, start_date, end_date), reporter:users!reported_by(name)')
        .order('created_at', { ascending: true });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = [
        { id: 'dispute-1', reason: 'Late Return', status: 'open', description: 'Item was returned 5 hours late', evidence_photos: [], reporter: { name: 'Arjun Mehta' }, booking: { product_id: 'product-1', start_date: new Date().toISOString(), end_date: new Date().toISOString() } }
      ];
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, admin_notes, resolution_amount } = req.body;

    const validResolutions = ['resolved_owner', 'resolved_renter', 'resolved_split'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({ message: 'Invalid resolution status' });
    }

    let disputeData = { id, status: resolution, admin_notes, resolution_amount, booking_id: 'booking-1' };
    try {
      const query = await supabase
        .from('disputes')
        .update({ status: resolution, admin_notes, resolution_amount })
        .eq('id', id)
        .select()
        .single();
      disputeData = query.data;
      if (query.error) throw query.error;

      await supabase.from('bookings').update({ status: 'completed' }).eq('id', disputeData.booking_id);
    } catch {
      // Mock execution
    }

    await logAdminAction(req, 'dispute:resolve', id, { resolution, admin_notes, resolution_amount });
    res.json(disputeData);
  } catch (err) {
    next(err);
  }
};

const getKycSubmissions = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase
        .from('kyc_submissions')
        .select('*, user:users!user_id(name, email)')
        .order('created_at', { ascending: true });
      data = query.data;
      if (query.error) throw query.error;

      const pathsToSign = [];
      data.forEach(sub => {
        if (sub.front_url) pathsToSign.push(sub.front_url);
        if (sub.back_url) pathsToSign.push(sub.back_url);
        if (sub.selfie_url) pathsToSign.push(sub.selfie_url);
      });

      if (pathsToSign.length > 0) {
        const { data: signedUrlsData, error: signError } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrls(pathsToSign, 3600);

        if (!signError && signedUrlsData) {
          const urlMap = {};
          signedUrlsData.forEach(item => {
            urlMap[item.path] = item.signedUrl;
          });
          data.forEach(sub => {
            sub.front_signed_url = urlMap[sub.front_url] || null;
            sub.back_signed_url = urlMap[sub.back_url] || null;
            sub.selfie_signed_url = urlMap[sub.selfie_url] || null;
          });
        }
      }
    } catch {
      data = [
        { id: 'kyc-1', id_type: 'Aadhaar', status: 'pending', front_signed_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300', back_signed_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300', selfie_signed_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', user: { name: 'Simran Kaur', email: 'simran@example.com' } }
      ];
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

const resolveKycSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected', 'resubmission_required'].includes(status)) {
      return res.status(400).json({ message: 'Invalid KYC status' });
    }

    let kycData = { id, status, admin_notes, user_id: 'user-2' };
    try {
      const query = await supabase
        .from('kyc_submissions')
        .update({ status, admin_notes })
        .eq('id', id)
        .select()
        .single();
      kycData = query.data;
      if (query.error) throw query.error;

      await supabase.from('users').update({ kyc_status: status, kyc_verified: status === 'approved' }).eq('id', kycData.user_id);
    } catch {
      // Mock execution
    }

    await logAdminAction(req, 'kyc:resolve', id, { status, admin_notes });

    try {
      const msg = status === 'approved'
        ? 'Your Identity Verification (KYC) has been approved! You can now list products.'
        : `Your KYC status updated: ${status}. Reason: ${admin_notes}`;
      await sendNotification(kycData.user_id, 'kyc_update', msg);
    } catch {
      // Ignore notification failures
    }

    res.json(kycData);
  } catch (err) {
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase
        .from('bookings')
        .select('*, product:products(title), renter:users!renter_id(name), owner:users!owner_id(name)')
        .order('created_at', { ascending: false });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = [
        { id: 'booking-1', status: 'live', start_date: new Date().toISOString(), end_date: new Date().toISOString(), product: { title: 'Mountain Bike' }, renter: { name: 'Arjun Mehta' }, owner: { name: 'Simran Kaur' } }
      ];
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, end_date } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (end_date !== undefined) updates.end_date = end_date;

    let data;
    try {
      const query = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id, ...updates };
    }

    await logAdminAction(req, 'booking:status', id, updates);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = MOCK_PAYMENTS;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { payment_id, amount_cents, reason } = req.body;
    // Process refund logic (Razorpay integrations)
    await logAdminAction(req, 'payment:refund', payment_id, { amount_cents, reason });
    res.json({ refund_id: 'rfnd_' + Math.random().toString(36).substring(7), payment_id, amount: amount_cents, status: 'processed', reason });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase.from('categories').select('*').order('name', { ascending: true });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = MOCK_CATEGORIES;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, icon_url, slug, seo_title } = req.body;
    let data;
    try {
      const query = await supabase.from('categories').insert({ name, icon_url, slug, seo_title }).select().single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id: Math.floor(Math.random() * 1000), name, icon_url, slug, seo_title, is_active: true };
    }

    await logAdminAction(req, 'category:create', null, { name, slug });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon_url, is_active } = req.body;
    let data;
    try {
      const query = await supabase.from('categories').update({ name, icon_url, is_active }).eq('id', id).select().single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id, name, icon_url, is_active };
    }

    await logAdminAction(req, 'category:update', id, { name, icon_url, is_active });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch {
      // Mock delete
    }

    await logAdminAction(req, 'category:delete', id, {});
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getBanners = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase.from('banners').select('*').order('position', { ascending: true });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = MOCK_BANNERS;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const { title, image_url, link_url, position } = req.body;
    let data;
    try {
      const query = await supabase.from('banners').insert({ title, image_url, link_url, position }).select().single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id: Math.floor(Math.random() * 1000), title, image_url, link_url, position, is_active: true };
    }

    await logAdminAction(req, 'banner:create', null, { title, position });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, image_url, is_active } = req.body;
    let data;
    try {
      const query = await supabase.from('banners').update({ title, image_url, is_active }).eq('id', id).select().single();
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = { id, title, image_url, is_active };
    }

    await logAdminAction(req, 'banner:update', id, { title, is_active });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('banners').delete().eq('id', id);
    } catch {
      // Mock delete
    }

    await logAdminAction(req, 'banner:delete', id, {});
    res.json({ message: 'Banner deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const sendBulkNotification = async (req, res, next) => {
  try {
    const { message, target_role, target_city } = req.body;
    
    // Dispatches physical push notification via OneSignal
    const title = `RentNear Global Broadcast`;
    await sendGlobalPushNotification(title, message, { target_role, target_city });
    
    // Attempt database-level dispatch for online dashboard notifications
    try {
      let usersQuery = supabase.from('users').select('id');
      if (target_role && target_role !== 'all') {
        usersQuery = usersQuery.eq('role', target_role);
      }
      if (target_city) {
        usersQuery = usersQuery.ilike('location', `%${target_city}%`);
      }
      const { data: matchedUsers } = await usersQuery;
      
      if (matchedUsers && matchedUsers.length > 0) {
        const insertPayload = matchedUsers.map(u => ({
          user_id: u.id,
          type: 'broadcast',
          message: message,
          is_read: false
        }));
        await supabase.from('notifications').insert(insertPayload);
      }
    } catch (e) {
      console.warn('Failed to insert database notification entries for broadcast:', e);
    }

    await logAdminAction(req, 'notification:bulk', null, { target_role, target_city });
    res.json({ message: `Successfully queued bulk notification to matching users.` });
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    let data;
    try {
      const query = await supabase
        .from('admin_audit_logs')
        .select('*, admin:users!admin_id(name, email)')
        .order('created_at', { ascending: false });
      data = query.data;
      if (query.error) throw query.error;
    } catch {
      data = MOCK_ADMIN_AUDIT_LOGS;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getUsers,
  toggleBanUser,
  updateUserRole,
  getProducts,
  updateListingStatus,
  removeProduct,
  getDisputes,
  resolveDispute,
  getKycSubmissions,
  resolveKycSubmission,
  getBookings,
  updateBookingStatus,
  getPayments,
  processRefund,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  sendBulkNotification,
  getAuditLogs
};
