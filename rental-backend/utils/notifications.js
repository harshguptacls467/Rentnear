const supabase = require('../config/supabase');

/**
 * Sends a push notification to all subscribed users via OneSignal.
 */
const sendGlobalPushNotification = async (title, message, data = {}) => {
  const appId = process.env.ONESIGNAL_APP_ID || '109c1bae-e0a1-4b1c-a781-53f1ab90e9ec';
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!apiKey) {
    console.warn('[OneSignal] ONESIGNAL_REST_API_KEY not configured. Skipping global push notification.');
    return false;
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Subscribed Users'],
        headings: { en: title },
        contents: { en: message },
        data: data
      })
    });

    const resJson = await response.json();
    if (!response.ok) {
      console.error('[OneSignal] API Error:', resJson);
      return false;
    }

    console.log('[OneSignal] Global Notification sent successfully:', resJson);
    return true;
  } catch (err) {
    console.error('[OneSignal] Exception sending global notification:', err);
    return false;
  }
};

/**
 * Sends a push notification to a specific user via OneSignal (using external ID).
 */
const sendPersonalPushNotification = async (userId, title, message, data = {}) => {
  const appId = process.env.ONESIGNAL_APP_ID || '109c1bae-e0a1-4b1c-a781-53f1ab90e9ec';
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!apiKey) {
    console.warn('[OneSignal] ONESIGNAL_REST_API_KEY not configured. Skipping personal push.');
    return false;
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: {
          external_id: [userId]
        },
        target_channel: 'push',
        headings: { en: title },
        contents: { en: message },
        data: data
      })
    });

    const resJson = await response.json();
    if (!response.ok) {
      console.error('[OneSignal] Personal API Error:', resJson);
      return false;
    }

    console.log('[OneSignal] Personal notification sent successfully:', resJson);
    return true;
  } catch (err) {
    console.error('[OneSignal] Exception sending personal notification:', err);
    return false;
  }
};

/**
 * Sends an in-app notification to a user by inserting it into the database,
 * and automatically triggers a physical push notification to the user's device.
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
    }
    
    // Auto-trigger push notification
    const titleMap = {
      booking_request: 'New Booking Request',
      booking_approved: 'Booking Approved! 🎉',
      booking_rejected: 'Booking Declined',
      booking_cancelled: 'Booking Cancelled',
      dispute_opened: 'Dispute Raised ⚠️',
      message: 'New Message 💬'
    };
    
    const title = titleMap[type] || 'RentNear Update';
    await sendPersonalPushNotification(userId, title, message, { type, bookingId });
    
    return true;
  } catch (err) {
    console.error('Exception in sendNotification:', err);
    return false;
  }
};

module.exports = {
  sendNotification,
  sendGlobalPushNotification,
  sendPersonalPushNotification
};
