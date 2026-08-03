const supabase = require('../config/supabase');

const groupNotificationsByDate = (notifications = []) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const startOfWeek = today - (now.getDay() * 86400000);

  const groups = {
    today: [],
    yesterday: [],
    this_week: [],
    earlier: []
  };

  notifications.forEach(item => {
    const itemDate = new Date(item.created_at).getTime();
    if (itemDate >= today) {
      groups.today.push(item);
    } else if (itemDate >= yesterday) {
      groups.yesterday.push(item);
    } else if (itemDate >= startOfWeek) {
      groups.this_week.push(item);
    } else {
      groups.earlier.push(item);
    }
  });

  return groups;
};

const notificationController = {
  // GET /api/notifications
  getNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return res.json({
          success: true,
          unread_count: 0,
          total: 0,
          grouped: { today: [], yesterday: [], this_week: [], earlier: [] },
          raw: []
        });
      }

      const raw = data || [];
      const unreadCount = raw.filter(n => !n.is_read).length;
      const grouped = groupNotificationsByDate(raw);

      res.json({
        success: true,
        unread_count: unreadCount,
        total: raw.length,
        grouped,
        raw
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/notifications/:id/read
  markAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, message: 'Notification marked as read', data });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/notifications/read-all
  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;

      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/notifications/:id
  deleteNotification: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/notifications/clear-all
  clearAll: async (req, res, next) => {
    try {
      const userId = req.user.id;

      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/notifications/preferences
  getPreferences: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      const defaults = {
        user_id: userId,
        booking_notifications: true,
        chat_notifications: true,
        promotions: true,
        system_alerts: true,
        email_notifications: true,
        push_notifications: true
      };

      res.json({ success: true, data: data || defaults });
    } catch {
      res.json({
        success: true,
        data: {
          user_id: req.user.id,
          booking_notifications: true,
          chat_notifications: true,
          promotions: true,
          system_alerts: true,
          email_notifications: true,
          push_notifications: true
        }
      });
    }
  },

  // PUT /api/notifications/preferences
  updatePreferences: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const {
        booking_notifications = true,
        chat_notifications = true,
        promotions = true,
        system_alerts = true,
        email_notifications = true,
        push_notifications = true
      } = req.body;

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .upsert([{
          user_id: userId,
          booking_notifications,
          chat_notifications,
          promotions,
          system_alerts,
          email_notifications,
          push_notifications,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, message: 'Notification preferences updated', data });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;
