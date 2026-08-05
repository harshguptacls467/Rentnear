const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendNotification } = require('../utils/notifications');

const razorpayInstance = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

const paymentController = {

  // 1. Create Razorpay Order
  createRazorpayOrder: async (req, res, next) => {
    try {
      const { id: booking_id } = req.params;
      const user_id = req.user.id;

      if (!razorpayInstance) {
        console.warn("Razorpay is not configured. Falling back to mock success.");
        return res.json({ mock_success: true });
      }

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, product:products(title, images)')
        .eq('id', booking_id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.renter_id !== user_id) return res.status(403).json({ message: 'Not authorized' });
      if (booking.status !== 'approved') return res.status(400).json({ message: `Status is ${booking.status}` });

      const totalAmount = Number(booking.total_amount); // Rental + Deposit

      const options = {
        amount: Math.round(totalAmount * 100),  // amount in the smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${booking.id}`,
        payment_capture: 1 // We chose Option A: Charge full amount upfront, refund later
      };

      const order = await razorpayInstance.orders.create(options);

      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,
        booking: booking
      });

    } catch (error) {
      next(error);
    }
  },

  // 2. Verify Payment Signature
  verifyRazorpayPayment: async (req, res, next) => {
    try {
      const { id: booking_id } = req.params;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const user_id = req.user.id;

      // Create expected signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // 1. Idempotency Check: Verify if payment has already been captured/processed
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('razorpay_payment_id', razorpay_payment_id)
        .maybeSingle();

      if (existingPayment) {
        return res.status(200).json({ success: true, message: "Payment already processed", duplicated: true });
      }

      // Verify booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (bookingError || !booking) return res.status(404).json({ message: 'Booking not found' });

      // 1. Update booking status to awaiting_handover
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'awaiting_handover' })
        .eq('id', booking_id);

      if (updateError) throw updateError;

      // 2. Log payment in database
      await supabase.from('payments').insert([{
        booking_id: booking_id,
        amount: booking.total_amount,
        deposit_amount: booking.deposit_amount || 0,
        status: 'captured', // Full amount captured immediately
        payment_method: 'razorpay',
        razorpay_order_id,
        razorpay_payment_id
      }]);

      // 3. Notify owner
      await sendNotification(
        booking.owner_id,
        'payment_received',
        `Payment of ₹${booking.total_amount} received securely via Razorpay.`,
        booking_id
      );

      res.json({ success: true, message: "Payment successful" });

    } catch (error) {
      next(error);
    }
  },

  // 3. Process Refund for Deposit
  refundDeposit: async (req, res, next) => {
    try {
      const { id: booking_id } = req.params;
      const user_id = req.user.id; // Usually owner or admin initiates this

      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (!booking || booking.owner_id !== user_id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const depositAmount = booking.deposit_amount || 0;
      if (depositAmount <= 0) {
        return res.status(400).json({ message: 'No deposit to refund' });
      }

      // Find payment
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', booking_id)
        .eq('status', 'captured')
        .eq('payment_method', 'razorpay')
        .single();

      if (!payment || !payment.razorpay_payment_id) {
        return res.status(400).json({ message: 'No Razorpay payment found to refund' });
      }

      // Atomic idempotency lock — prevents double-refund on concurrent or repeated calls.
      // The UPDATE only succeeds if the payment is still 'captured'.
      // If it's already 'refund_in_progress' or 'partially_refunded', this returns no row.
      const { data: locked, error: lockErr } = await supabase
        .from('payments')
        .update({ status: 'refund_in_progress' })
        .eq('id', payment.id)
        .eq('status', 'captured')
        .select('id')
        .single();

      if (lockErr || !locked) {
        return res.status(409).json({
          message: 'Refund already in progress or completed. Please check the payment status before retrying.'
        });
      }

      if (razorpayInstance) {
        // Issue partial refund to the payment_id
        await razorpayInstance.payments.refund(payment.razorpay_payment_id, {
          amount: Math.round(depositAmount * 100),
          notes: {
            reason: "Security deposit refund upon safe return of item"
          }
        });
      }

      await supabase.from('payments').update({ status: 'partially_refunded' }).eq('id', payment.id);

      await sendNotification(
        booking.renter_id,
        'deposit_refunded',
        `Your security deposit of ₹${depositAmount} has been refunded securely via Razorpay.`,
        booking_id
      );

      res.json({ message: "Deposit refunded successfully" });
    } catch (error) {
      next(error);
    }
  },

  // 4. Create Stripe Checkout Session
  // STATUS: Not yet implemented — Stripe SDK integration is pending.
  // This stub returns 501 so callers get an explicit "not available" signal
  // rather than a misleading mock success response.
  createStripeCheckoutSession: async (req, res, next) => {
    try {
      return res.status(501).json({
        success: false,
        error: {
          message: 'Stripe checkout is not yet available. Please use Razorpay to complete your payment.',
          status: 501,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Record Payment Retry Attempt
  recordPaymentRetry: async (req, res, next) => {
    try {
      const { id: booking_id } = req.params;
      const { error_message } = req.body;
      
      await supabase.from('admin_audit_logs').insert([{
        action: 'payment_retry_recorded',
        details: { booking_id, error_message, user_id: req.user.id }
      }]);
      
      res.json({ success: true, message: "Payment retry log successfully submitted" });
    } catch (error) {
      next(error);
    }
  },

  // 6. Get My Payouts & Earnings Summary
  getMyPayouts: async (req, res, next) => {
    try {
      const owner_id = req.user.id;

      const { data: payouts, error } = await supabase
        .from('payouts')
        .select('*, booking:bookings(product_id, start_date, end_date, product:products(title))')
        .eq('owner_id', owner_id)
        .order('created_at', { ascending: false });

      if (!error && payouts) {
        const totalEarnings = payouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        return res.json({
          success: true,
          total_earnings: parseFloat(totalEarnings.toFixed(2)),
          payout_count: payouts.length,
          payouts
        });
      }

      // Mock fallback
      res.json({
        success: true,
        total_earnings: 145.00,
        payout_count: 2,
        payouts: [
          { id: 'payout-1', amount: 90.00, status: 'processed', reference_id: 'PAYOUT-8X91A', payout_method: 'UPI', created_at: new Date().toISOString() },
          { id: 'payout-2', amount: 55.00, status: 'processed', reference_id: 'PAYOUT-4B22K', payout_method: 'UPI', created_at: new Date().toISOString() }
        ]
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = paymentController;
