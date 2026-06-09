const supabase = require('../config/supabase');

/**
 * Sends an in-app notification to a user by inserting it into the database.
 * The backend uses the service role key, so it bypasses RLS.
 * 
 * @param {string} userId - The UUID of the user receiving the notification
 * @param {string} type - e.g. 'booking_request', 'booking_approved', 'dispute_opened'
 * @param {string} message - The text to display in the notification
 * @param {string} bookingId - Optional associated booking UUID
 */
const sendNotification = async (userId, type, message, bookingId = null) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        booking_id: bookingId,
      });

    if (error) {
      console.error('Failed to insert notification:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception in sendNotification:', err);
    return false;
  }
};

module.exports = {
  sendNotification,
};
