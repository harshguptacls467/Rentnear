const supabase = require('../config/supabase');
const { sendNotification } = require('../utils/notifications');

const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [usersCount, productsCount, bookingsCount, disputesCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review'])
    ]);

    res.json({
      totalUsers: usersCount.count || 0,
      totalProducts: productsCount.count || 0,
      bookingsToday: bookingsCount.count || 0,
      openDisputes: disputesCount.count || 0
    });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, kyc_verified, is_banned, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const toggleBanUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_banned } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ is_banned })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, status, created_at, owner:users!owner_id(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // For safety, we might just mark it as deleted or hidden instead of full delete
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};

const getDisputes = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*, booking:bookings(product_id, start_date, end_date), reporter:users!reported_by(name)')
      .in('status', ['open', 'under_review'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, admin_notes, resolution_amount } = req.body;

    // Validate resolution
    const validResolutions = ['resolved_owner', 'resolved_renter', 'resolved_split'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({ message: 'Invalid resolution status' });
    }

    // 1. Update Dispute
    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .update({ 
        status: resolution,
        admin_notes,
        resolution_amount
      })
      .eq('id', id)
      .select()
      .single();

    if (disputeError) throw disputeError;

    // 2. Update Booking Status to Completed
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', disputeData.booking_id)
      .select('owner_id, renter_id')
      .single();

    if (bookingError) throw bookingError;

    // 3. Send Notifications
    if (bookingData) {
      const msg = `Your dispute has been resolved by Admin. Resolution: ${resolution}`;
      await sendNotification(bookingData.owner_id, 'dispute_resolved', msg, disputeData.booking_id);
      await sendNotification(bookingData.renter_id, 'dispute_resolved', msg, disputeData.booking_id);
    }

    res.json(disputeData);
  } catch (err) {
    next(err);
  }
};

const getKycSubmissions = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*, user:users!user_id(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Generate signed URLs for private bucket in ONE bulk call to prevent N+1 queries
    const pathsToSign = [];
    data.forEach(sub => {
      pathsToSign.push(sub.front_url, sub.back_url, sub.selfie_url);
    });

    if (pathsToSign.length > 0) {
      const { data: signedUrlsData, error: signError } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrls(pathsToSign, 3600);

      if (!signError && signedUrlsData) {
        // Create a map of path -> signedUrl for fast lookup
        const urlMap = {};
        signedUrlsData.forEach(item => {
          urlMap[item.path] = item.signedUrl;
        });

        // Map the URLs back to the submissions
        data.forEach(sub => {
          sub.front_signed_url = urlMap[sub.front_url] || null;
          sub.back_signed_url = urlMap[sub.back_url] || null;
          sub.selfie_signed_url = urlMap[sub.selfie_url] || null;
        });
      }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

const resolveKycSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid KYC status' });
    }

    // 1. Update KYC Submission
    const { data: kycData, error: kycError } = await supabase
      .from('kyc_submissions')
      .update({ status, admin_notes })
      .eq('id', id)
      .select()
      .single();

    if (kycError) throw kycError;

    // 2. Update User
    const isVerified = status === 'approved';
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        kyc_status: status,
        kyc_verified: isVerified
      })
      .eq('id', kycData.user_id);

    if (userError) throw userError;

    // 3. Send Notification
    const msg = status === 'approved' 
      ? 'Your Identity Verification (KYC) has been approved! You can now list products.'
      : `Your KYC was rejected. Reason: ${admin_notes}`;
    
    await sendNotification(kycData.user_id, status === 'approved' ? 'kyc_approved' : 'kyc_rejected', msg);

    res.json(kycData);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getUsers,
  toggleBanUser,
  getProducts,
  removeProduct,
  getDisputes,
  resolveDispute,
  getKycSubmissions,
  resolveKycSubmission
};
