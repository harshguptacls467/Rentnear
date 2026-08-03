import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Trash2, Calendar, AlertCircle, CheckCircle, 
  MessageSquare, Shield, DollarSign, Star, Settings, X, SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import useAuthStore from '../store/authStore';
import { notificationService } from '../api/notificationService';
import useRealtimeNotifications from '../hooks/useRealtimeNotifications';

const Notifications = () => {
  const { user, token, isMock } = useAuthStore();
  const navigate = useNavigate();

  const [groupedNotifications, setGroupedNotifications] = useState({
    today: [],
    yesterday: [],
    this_week: [],
    earlier: []
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Preference Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [preferences, setPreferences] = useState({
    booking_notifications: true,
    chat_notifications: true,
    promotions: true,
    system_alerts: true,
    email_notifications: true,
    push_notifications: true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (token && !isMock) {
        const res = await notificationService.getNotifications(token);
        if (res.success) {
          setGroupedNotifications(res.grouped || { today: [], yesterday: [], this_week: [], earlier: [] });
          setUnreadCount(res.unread_count || 0);
          setLoading(false);
          return;
        }
      }

      // Mock notifications payload fallback
      const mockItems = [
        { id: '1', type: 'booking_approved', title: 'Booking Approved! 🎉', message: 'Owner Sarah approved your rental for Sony A7 IV Camera.', is_read: false, created_at: new Date().toISOString() },
        { id: '2', type: 'new_message', title: 'New Message 💬', message: 'Alex: "I can meet you at 10 AM for handover."', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'payment_success', title: 'Payment Confirmed 💳', message: 'Security deposit $150.00 placed in escrow.', is_read: true, created_at: new Date(Date.now() - 90000000).toISOString() },
        { id: '4', type: 'review_received', title: 'Review Received ⭐', message: 'You received a 5.0 rating from Michael.', is_read: true, created_at: new Date(Date.now() - 300000000).toISOString() }
      ];

      setGroupedNotifications({
        today: mockItems.slice(0, 2),
        yesterday: [mockItems[2]],
        this_week: [mockItems[3]],
        earlier: []
      });
      setUnreadCount(2);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user, token, isMock, navigate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime notification hook callback
  const handleRealtimeInsert = useCallback((newNotif) => {
    setUnreadCount(prev => prev + 1);
    setGroupedNotifications(prev => ({
      ...prev,
      today: [newNotif, ...prev.today]
    }));
  }, []);

  useRealtimeNotifications(user?.id, handleRealtimeInsert);

  // Fetch Preferences
  const fetchPreferences = async () => {
    if (!token || isMock) return;
    try {
      const res = await notificationService.getPreferences(token);
      if (res.success && res.data) {
        setPreferences(res.data);
      }
    } catch {
      // Ignore
    }
  };

  const handleOpenSettings = () => {
    fetchPreferences();
    setShowSettingsModal(true);
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    if (token && !isMock) {
      try {
        await notificationService.updatePreferences(token, preferences);
      } catch (err) {
        alert(err.message);
      }
    }
    setSavingPrefs(false);
    setShowSettingsModal(false);
  };

  // Mark single as read
  const handleMarkRead = async (id) => {
    setGroupedNotifications(prev => {
      const updateList = (list) => list.map(n => n.id === id ? { ...n, is_read: true } : n);
      return {
        today: updateList(prev.today),
        yesterday: updateList(prev.yesterday),
        this_week: updateList(prev.this_week),
        earlier: updateList(prev.earlier)
      };
    });
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (token && !isMock) {
      try {
        await notificationService.markAsRead(token, id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setGroupedNotifications(prev => {
      const setRead = (list) => list.map(n => ({ ...n, is_read: true }));
      return {
        today: setRead(prev.today),
        yesterday: setRead(prev.yesterday),
        this_week: setRead(prev.this_week),
        earlier: setRead(prev.earlier)
      };
    });
    setUnreadCount(0);

    if (token && !isMock) {
      try {
        await notificationService.markAllAsRead(token);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Clear all
  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    setGroupedNotifications({ today: [], yesterday: [], this_week: [], earlier: [] });
    setUnreadCount(0);

    if (token && !isMock) {
      try {
        await notificationService.clearAll(token);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_request': return <Calendar className="text-blue-500" size={20} />;
      case 'booking_approved': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'booking_rejected':
      case 'booking_cancelled': return <AlertCircle className="text-red-500" size={20} />;
      case 'payment_success':
      case 'refund_completed': return <DollarSign className="text-amber-500" size={20} />;
      case 'new_message': return <MessageSquare className="text-indigo-500" size={20} />;
      case 'review_received': return <Star className="text-amber-400 fill-amber-400" size={20} />;
      case 'admin_notice': return <Shield className="text-red-600" size={20} />;
      default: return <Bell className="text-primary" size={20} />;
    }
  };

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-3 mb-8">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2">{title} ({items.length})</h3>
        <div className="space-y-3">
          {items.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              className={`p-5 rounded-3xl border transition-all flex items-start gap-4 cursor-pointer ${
                !notif.is_read 
                  ? 'bg-white border-primary/30 shadow-md ring-1 ring-primary/10' 
                  : 'bg-white/60 border-gray-100 opacity-85 hover:bg-white'
              }`}
            >
              <div className="p-3 bg-gray-50 rounded-2xl flex-shrink-0">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className={`text-base leading-snug ${!notif.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                    {notif.title || 'RentNear Alert'}
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2" title="Unread" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const totalNotifications = 
    groupedNotifications.today.length + 
    groupedNotifications.yesterday.length + 
    groupedNotifications.this_week.length + 
    groupedNotifications.earlier.length;

  return (
    <AnimatedPage>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-navy to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <Bell size={36} className="text-primary-light animate-bounce" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  Notifications <span className="text-xs font-black bg-primary text-white px-3 py-1 rounded-full">{unreadCount} New</span>
                </h1>
                <p className="text-gray-300 text-sm mt-1">Real-time alerts, booking status, and system updates.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenSettings}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all"
                title="Notification Settings"
              >
                <Settings size={18} />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5"
                >
                  <CheckCheck size={16} /> Mark All Read
                </button>
              )}

              {totalNotifications > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-2xl text-xs font-black transition-all"
                  title="Clear All Notifications"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* Skeletons */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-3xl p-5 border border-gray-100 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-1/3 h-4" />
                    <Skeleton variant="text" className="w-2/3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : totalNotifications === 0 ? (
            <EmptyState
              icon={Bell}
              title="No Notifications Yet"
              message="You're all caught up! New updates on bookings, messages, and platform activity will appear here in real time."
              actionLabel="Explore Catalog"
              onAction={() => navigate('/products')}
            />
          ) : (
            <div>
              {renderSection('📌 Today', groupedNotifications.today)}
              {renderSection('📅 Yesterday', groupedNotifications.yesterday)}
              {renderSection('🗓️ This Week', groupedNotifications.this_week)}
              {renderSection('⏳ Earlier', groupedNotifications.earlier)}
            </div>
          )}

          {/* Notification Preferences Modal */}
          <AnimatePresence>
            {showSettingsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSettingsModal(false)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-6 border border-gray-100"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <SlidersHorizontal className="text-primary" size={20} /> Notification Preferences
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'booking_notifications', title: 'Booking Notifications', desc: 'Approvals, requests, and handover updates' },
                      { key: 'chat_notifications', title: 'Chat & Direct Messages', desc: 'Realtime chat alerts from renters/owners' },
                      { key: 'promotions', title: 'Promotional & Store Credit', desc: 'Discounts, referrals, and festival deals' },
                      { key: 'system_alerts', title: 'Security & System Alerts', desc: 'Account verification and security notices' },
                      { key: 'push_notifications', title: 'Physical Device Push', desc: 'OneSignal mobile & web browser push alerts' },
                      { key: 'email_notifications', title: 'Email Digest Alerts', desc: 'Periodic summary emails to registered address' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.title}</p>
                          <p className="text-[10px] text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[item.key] ?? true}
                            onChange={(e) => setPreferences({ ...preferences, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingPrefs}
                      onClick={handleSavePreferences}
                      className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20"
                    >
                      {savingPrefs ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default Notifications;
