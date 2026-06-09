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

      // Verify booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (bookingError || !booking) return res.status(404).json({ message: 'Booking not found' });

      // 1. Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'paid' })
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
  }
};

module.exports = paymentController;
