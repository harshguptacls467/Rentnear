const supabase = require('../config/supabase');
const { sendNotification } = require('../utils/notifications');

const reviewController = {
  
  // POST /api/reviews
  submitReview: async (req, res, next) => {
    try {
      const { booking_id, reviewee_id, rating, comment } = req.body;
      const reviewer_id = req.user.id;

      if (!booking_id || !reviewee_id || !rating) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Verify the booking involves this user
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (fetchError || !booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'You can only review a booking after it is completed' });
      }

      const isOwner = booking.owner_id === reviewer_id;
      const isRenter = booking.renter_id === reviewer_id;

      if (!isOwner && !isRenter) {
        return res.status(403).json({ message: 'Not authorized to review this booking' });
      }

      const role = isOwner ? 'owner_review' : 'renter_review';

      // Insert the review
      const { data: review, error: insertError } = await supabase
        .from('reviews')
        .insert([{
          booking_id,
          reviewer_id,
          reviewee_id,
          role,
          rating,
          comment: comment ? comment.trim() : null
        }])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          return res.status(409).json({ message: 'You have already submitted a review for this booking' });
        }
        throw insertError;
      }

      // Send notification to the reviewee
      await sendNotification(
        reviewee_id,
        'new_review',
        `You received a ${rating}-star review for a recent booking.`,
        booking_id
      );

      res.status(201).json({ message: 'Review submitted successfully', review });

    } catch (error) {
      next(error);
    }
  },

  // GET /api/reviews/user/:userId
  getUserReviews: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 3;

      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      res.json(data || []);

    } catch (error) {
      next(error);
    }
  }

};

module.exports = reviewController;
