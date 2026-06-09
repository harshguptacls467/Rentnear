import { useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReviewModal = ({ isOpen, onClose, booking, currentUser }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const isOwner = currentUser.id === booking.owner_id;
  const revieweeId = isOwner ? booking.renter_id : booking.owner_id;
  const revieweeName = isOwner ? booking.renter?.name : booking.owner?.name;
  const role = isOwner ? 'owner_review' : 'renter_review';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await supabase.from('reviews').insert([
        {
          booking_id: booking.id,
          reviewer_id: currentUser.id,
          reviewee_id: revieweeId,
          role: role,
          rating: rating,
          comment: comment.trim()
        }
      ]);

      if (submitError) {
        if (submitError.code === '23505') {
          throw new Error('You have already reviewed this user for this booking.');
        }
        throw submitError;
      }

      onClose();
      // Optionally trigger a re-fetch of bookings or show a toast
      window.location.reload(); 
    } catch (err) {
      setError(err.message || 'Failed to submit review');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate your experience</h2>
          <p className="text-gray-500 mb-6">How was your experience with {revieweeName} for the <span className="font-bold text-gray-700">{booking.product?.title}</span>?</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    size={40} 
                    className={`${(hoveredRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} transition-colors`}
                  />
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Write a review (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details of your experience..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-32"
              ></textarea>
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-lg shadow-lg"
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
