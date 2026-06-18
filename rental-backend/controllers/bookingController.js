const supabase = require('../config/supabase');
const { sendNotification } = require('../utils/notifications');

const bookingController = {
  
  // POST /api/bookings
  createBooking: async (req, res, next) => {
    try {
      const { product_id, start_date, end_date } = req.body;
      // SECURITY: Do NOT trust total_amount from the client — calculate server-side
      const renter_id = req.user.id;

      // Basic date validation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(start_date);
      const end = new Date(end_date);

      if (start < today) {
        return res.status(400).json({ message: 'Start date cannot be in the past' });
      }
      if (end < start) {
        return res.status(400).json({ message: 'End date cannot be before start date' });
      }

      // 1. Fetch Product to get owner_id and deposit_amount
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('owner_id, deposit_amount, is_available, price_per_day')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (!product.is_available) {
        return res.status(400).json({ message: 'Product is currently unavailable' });
      }

      if (product.owner_id === renter_id) {
        return res.status(400).json({ message: 'You cannot book your own product' });
      }

      // 2. Date Conflict Check
      // We check if there are any existing bookings that overlap with the requested dates
      // Overlap formula: (existing.start <= requested.end) AND (existing.end >= requested.start)
      const { data: existingBookings, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('product_id', product_id)
        .in('status', ['pending', 'approved', 'active']) // We consider pending/approved/active bookings as blocking
        .lte('start_date', end_date)
        .gte('end_date', start_date);

      if (conflictError) throw conflictError;

      if (existingBookings && existingBookings.length > 0) {
        return res.status(409).json({ message: 'These dates are already booked or pending' });
      }

      // SECURITY: Calculate price server-side — never trust client input for money
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const rentalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
      const calculatedTotal = parseFloat((rentalDays * product.price_per_day + (product.deposit_amount || 0)).toFixed(2));

      // 3. Create Booking
      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert([{
          product_id,
          renter_id,
          owner_id: product.owner_id,
          start_date,
          end_date,
          total_amount: calculatedTotal,
          deposit_amount: product.deposit_amount,
          message: req.body.message,
          status: 'pending'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send notification to owner
      await sendNotification(
        product.owner_id,
        'booking_request',
        'You have a new booking request!',
        newBooking.id
      );

      res.status(201).json(newBooking);

    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/bookings/:id/status
  updateBookingStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Ensure valid status transitions based on user role (simplified logic)
      const validStatuses = ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'disputed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // First fetch the booking to verify ownership/role
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Security Checks
      const isOwner = booking.owner_id === userId;
      const isRenter = booking.renter_id === userId;

      if (!isOwner && !isRenter) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }

      if (['approved', 'rejected'].includes(status) && !isOwner) {
        return res.status(403).json({ message: 'Only the owner can approve or reject' });
      }

      // Expiration Lock: Pending bookings older than 24 hours cannot be approved/rejected
      if (booking.status === 'pending' && ['approved', 'rejected'].includes(status)) {
        const hoursSinceCreation = (new Date() - new Date(booking.created_at)) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
          // Auto-cancel the booking in the background
          await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
          return res.status(400).json({ message: 'This booking request has expired (older than 24 hours) and was auto-cancelled.' });
        }
      }

      if (status === 'cancelled' && booking.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending bookings can be cancelled freely. Contact the owner or support for active cancellations.' });
      }

      // Update the booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Determine who to notify
      if (status === 'approved') {
        await sendNotification(booking.renter_id, 'booking_approved', 'Your booking request was approved! Please complete payment.', id);
      } else if (status === 'rejected') {
        await sendNotification(booking.renter_id, 'booking_rejected', 'Your booking request was declined by the owner.', id);
      } else if (status === 'cancelled') {
        await sendNotification(booking.owner_id, 'booking_cancelled', 'A booking request was cancelled by the renter.', id);
      }

      res.json(updatedBooking);

    } catch (error) {
      next(error);
    }
  },

  // GET /api/bookings/my
  getMyBookings: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { role } = req.query; // 'renter' or 'owner'

      let query = supabase
        .from('bookings')
        .select('*, product:products(title, images), renter:users!bookings_renter_id_fkey(name, avatar_url), owner:users!bookings_owner_id_fkey(name, avatar_url)')
        .order('created_at', { ascending: false });

      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'renter') {
        query = query.eq('renter_id', userId);
      } else {
        query = query.or(`renter_id.eq.${userId},owner_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);

    } catch (error) {
      next(error);
    }
  },

  // GET /api/bookings/:id
  getBookingById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*, product:products(*), renter:users!bookings_renter_id_fkey(name, email, phone, avatar_url), owner:users!bookings_owner_id_fkey(name, email, phone, avatar_url)')
        .eq('id', id)
        .single();

      if (error || !booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Security Check: Only involved parties can view
      if (booking.renter_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({ message: 'Not authorized to view this booking' });
      }

      res.json(booking);

    } catch (error) {
      next(error);
    }
  },

  // POST /api/bookings/:id/generate-otp
  generateHandoverOtp: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify the user is the owner of the booking and status is approved
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('owner_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.owner_id !== userId) return res.status(403).json({ message: 'Only the owner can generate an OTP' });
      if (booking.status !== 'approved') return res.status(400).json({ message: 'Booking must be approved before handover' });

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Invalidate any previous OTPs for this booking just in case
      await supabase
        .from('handover_otps')
        .update({ used: true })
        .eq('booking_id', id)
        .eq('used', false);

      const { error: insertError } = await supabase
        .from('handover_otps')
        .insert([{
          booking_id: id,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          used: false
        }]);

      if (insertError) throw insertError;

      // Return the OTP to the owner so they can display it
      res.json({ otp: otpCode, expires_at: expiresAt });

    } catch (error) {
      next(error);
    }
  },

  // POST /api/bookings/:id/verify-otp
  verifyHandoverOtp: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;
      const userId = req.user.id;

      if (!otp) return res.status(400).json({ message: 'OTP is required' });

      // Verify the user is the renter of the booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('renter_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.renter_id !== userId) return res.status(403).json({ message: 'Only the renter can verify the OTP' });
      if (booking.status !== 'approved') return res.status(400).json({ message: 'Booking is not awaiting handover' });

      // Get the most recent active OTP for this booking
      const { data: otpRecord, error: otpError } = await supabase
        .from('handover_otps')
        .select('*')
        .eq('booking_id', id)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return res.status(400).json({ message: 'No active handover code found. Ask the owner to generate a new one.' });
      }

      // Check Expiration
      if (new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ message: 'This handover code has expired. Ask the owner to generate a new one.' });
      }

      // Check Match
      if (otpRecord.otp_code !== otp) {
        return res.status(400).json({ message: 'Invalid handover code' });
      }

      // Success! Mark OTP as used AND update booking status to 'active'
      const { error: markUsedError } = await supabase
        .from('handover_otps')
        .update({ used: true })
        .eq('id', otpRecord.id);

      if (markUsedError) throw markUsedError;

      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({ message: 'Handover complete! Rental is now active.', booking: updatedBooking });

    } catch (error) {
      next(error);
    }
  },

  // POST /api/bookings/:id/condition-check
  submitConditionCheck: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { checklist, photos, notes } = req.body;
      const userId = req.user.id;

      if (!photos || photos.length < 3) {
        return res.status(400).json({ message: 'At least 3 photos are required.' });
      }

      // Verify the user is part of the booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.renter_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({ message: 'Not authorized for this booking' });
      }

      // Insert condition check (JSONB for checklist)
      const { data, error: insertError } = await supabase
        .from('condition_checks')
        .insert([{
          booking_id: id,
          submitted_by: userId,
          checklist: checklist || {},
          photos: photos,
          notes: notes
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      res.status(201).json({ message: 'Condition check submitted successfully', condition_check: data });

    } catch (error) {
      next(error);
    }
  },

  // POST /api/bookings/:id/return-check
  submitReturnCheck: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { checklist, photos, notes } = req.body;
      const userId = req.user.id;

      if (!photos || photos.length < 3) {
        return res.status(400).json({ message: 'At least 3 photos are required.' });
      }

      // Verify the user is part of the booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.renter_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({ message: 'Not authorized for this booking' });
      }

      // Insert condition check as a return check
      const { data, error: insertError } = await supabase
        .from('condition_checks')
        .insert([{
          booking_id: id,
          submitted_by: userId,
          checklist: checklist || {},
          photos: photos,
          notes: notes,
          is_return: true
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update booking status to indicate awaiting approval
      // We will reuse the 'pending' status conceptually or just leave it 'active'
      // But the frontend will check for the existence of is_return = true to show "Review Return"

      res.status(201).json({ message: 'Return check submitted successfully', condition_check: data });

    } catch (error) {
      next(error);
    }
  },

  // GET /api/bookings/:id/condition-compare
  getConditionComparison: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Ensure user has access
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('renter_id, owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.renter_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Fetch pre and post checks
      const { data: checks, error: checksError } = await supabase
        .from('condition_checks')
        .select('*')
        .eq('booking_id', id);

      if (checksError) throw checksError;

      const preCheck = checks.find(c => !c.is_return);
      const postCheck = checks.find(c => c.is_return);

      res.json({
        pre_rental: preCheck || null,
        post_return: postCheck || null
      });

    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/bookings/:id/process-return
  processReturnDecision: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'release' or 'dispute'
      const userId = req.user.id;

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.owner_id !== userId) {
        return res.status(403).json({ message: 'Only the owner can process the return decision' });
      }

      const newStatus = action === 'release' ? 'completed' : 'disputed';

      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({ message: `Return processed: ${newStatus}`, booking: updatedBooking });

    } catch (error) {
      next(error);
    }
  },

    }
  }

};

module.exports = bookingController;
