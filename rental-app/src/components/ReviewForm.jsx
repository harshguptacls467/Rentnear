import { useState } from 'react'
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from './Button';
import { Star, X } from 'lucide-react';

const ReviewForm = ({ booking, isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isOwner = booking.owner_id === user.id;
  const revieweeId = isOwner ? booking.renter_id : booking.owner_id;
  const role = isOwner ? 'owner_review' : 'renter_review';
  const targetPerson = isOwner ? booking.renter : booking.owner;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const { session } = useAuthStore.getState();
      const token = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: booking.id,
          reviewee_id: revieweeId,
          rating: rating,
          comment: comment.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw { code: '23505' }; // Preserve existing error handling
        }
        throw new Error(errorData.message || 'Failed to submit review');
      }

      onSuccess();
      onClose();
    } catch (err) {
      if (err.code === '23505') { // Postgres unique violation code
        setError('You have already submitted a review for this booking.');
      } else {
        setError('Failed to submit review: ' + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Rate your experience</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-2">How was your interaction with</p>
            <h3 className="text-xl font-black text-gray-900">{targetPerson?.name || 'this user'}?</h3>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transform transition-transform hover:scale-110"
              >
                <Star 
                  size={40} 
                  fill={(hoverRating || rating) >= star ? "#FBBF24" : "transparent"} 
                  className={`${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Leave a comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details of your experience..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none h-28"
            ></textarea>
          </div>

          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-4 text-lg shadow-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
