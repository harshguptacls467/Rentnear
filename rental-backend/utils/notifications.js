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

const sendNotification = async (userId, type, message, bookingId = null, extraData = {}) => {
  try {
    const titleMap = {
      booking_request: 'New Booking Request 📦',
      booking_approved: 'Booking Approved! 🎉',
      booking_rejected: 'Booking Declined ❌',
      booking_cancelled: 'Booking Cancelled ⚠️',
      payment_success: 'Payment Confirmed 💳',
      refund_completed: 'Refund Processed 💸',
      product_saved: 'Item Saved to Wishlist ❤️',
      product_unavailable: 'Item Unavailable ⏳',
      new_message: 'New Message 💬',
      review_received: 'New Review Received ⭐',
      system_announcement: 'System Update 📢',
      admin_notice: 'Security & Moderation Alert 🛡️',
      account_verification: 'Identity Verification Update 🆔'
    };

    const title = extraData.title || titleMap[type] || 'RentNear Alert';

    // Insert database notification for in-app timeline & Realtime WebSocket broadcast
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        data: { bookingId, ...extraData },
        is_read: false
      }]);

    if (error) {
      console.error('Failed to insert in-app notification:', error);
    }

    // Check user notification preferences before sending OneSignal physical device push
    try {
      const { data: prefs } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefs) {
        if (!prefs.push_notifications) return true;
        if (type.startsWith('booking_') && !prefs.booking_notifications) return true;
        if (type === 'new_message' && !prefs.chat_notifications) return true;
        if (type === 'system_announcement' && !prefs.promotions) return true;
      }
    } catch {
      // Proceed if preference lookup is missing or defaults
    }

    // Dispatch OneSignal physical device push
    await sendPersonalPushNotification(userId, title, message, { type, bookingId, ...extraData });

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
