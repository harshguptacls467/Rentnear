import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { Shield, Radio, Users, Package, Clock, AlertOctagon, RefreshCw, Plus, Trash2, Send, FileText, DollarSign, Image as ImageIcon, CheckCircle, XCircle, MessageSquare, Headphones } from 'lucide-react';
import { adminService } from '../api/adminService';
import useRealtimeAdmin from '../hooks/useRealtimeAdmin';

import AdminOverview from '../components/admin/AdminOverview';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminUsers from '../components/admin/AdminUsers';
import AdminProducts from '../components/admin/AdminProducts';
import AdminDisputes from '../components/admin/AdminDisputes';
import AdminKYC from '../components/admin/AdminKYC';
import Button from '../components/Button';

const Admin = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState({
    totalUsers: 120,
    totalProducts: 85,
    bookingsToday: 8,
    openDisputes: 2,
    verifiedUsers: 90,
    activeListings: 78,
    liveRentals: 12,
    completedRentals: 45,
    cancelledRentals: 3,
    revenue: 12450.50,
    platformCommission: 1245.05,
    refunds: 450.00,
    systemHealth: 'Healthy'
  });

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & Inputs
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  // Forms
  const [newCat, setNewCat] = useState({ name: '', slug: '', seo_title: '', icon_url: '' });
  const [newBanner, setNewBanner] = useState({ title: '', image_url: '', link_url: '', position: 1 });
  const [bulkNotif, setBulkNotif] = useState({ message: '', target_role: 'all', target_city: '' });
  const [refundForm, setRefundForm] = useState({ payment_id: '', amount_cents: '', reason: '' });

  const [platformSettings, setPlatformSettings] = useState({
    commissionFee: '10',
    depositThreshold: '100',
    coolingPeriod: '7',
    maintenanceMode: 'false'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.is_admin) return;
    try {
      setLoading(true);
      setError('');
      const [statsData, usersData, productsData, disputesData, kycData, bookingsData, paymentsData, categoriesData, bannersData, auditData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getProducts(),
        adminService.getDisputes(),
        adminService.getKycSubmissions(),
        adminService.getBookings(),
        adminService.getPayments(),
        adminService.getCategories(),
        adminService.getBanners(),
        adminService.getAuditLogs(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setProducts(productsData);
      setDisputes(disputesData);
      setKycSubmissions(kycData);
      setBookings(bookingsData);
      setPayments(paymentsData);
      setCategories(categoriesData);
      setBanners(bannersData);
      setAuditLogs(auditData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);




  // Live Support Chat Sync
  const [liveChats, setLiveChats] = useState([]);
  
  const fetchLiveChats = useCallback(() => {
    const chats = JSON.parse(localStorage.getItem('live_support_chats') || '[]');
    setLiveChats(chats);
  }, []);

  useEffect(() => {
    fetchLiveChats();
    const handleSync = () => fetchLiveChats();
    window.addEventListener('live_chat_update', handleSync);
    const interval = setInterval(fetchLiveChats, 3000);
    return () => {
      window.removeEventListener('live_chat_update', handleSync);
      clearInterval(interval);
    };
  }, [fetchLiveChats]);

  const activeChatsCount = liveChats.filter(c => c.status === 'active').length;

  // Real-time listener
  useRealtimeAdmin({
    setStats,
    setUsers,
    setProducts,
    setBookings,
    setDisputes,
    setKycSubmissions,
    isAdmin: currentUser?.is_admin ?? false
  });

  // Handlers
  const handleBanUser = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserBan(userId, currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveAdmin = async (userId, approve) => {
    const payload = { is_admin: approve, admin_status: approve ? 'approved' : 'rejected' };
    try {
      await adminService.updateUserRole(userId, payload);
      setUsers(users.map(u => u.id === userId ? { ...u, ...payload } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProductStatus = async (productId, status) => {
    try {
      await adminService.updateListingStatus(productId, { status });
      setProducts(products.map(p => p.id === productId ? { ...p, status } : p));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleProductFeature = async (productId, field, currentValue) => {
    const payload = { [field]: !currentValue };
    try {
      await adminService.updateListingStatus(productId, payload);
      setProducts(products.map(p => p.id === productId ? { ...p, ...payload } : p));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProductDetails = async (productId, updatedFields) => {
    try {
      await adminService.updateListingStatus(productId, updatedFields);
      setProducts(products.map(p => p.id === productId ? { ...p, ...updatedFields } : p));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await adminService.updateBookingStatus(bookingId, { status });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    alert("Platform global settings saved successfully!");
  };

  const handleQuickRefund = (pay) => {
    setRefundForm({
      payment_id: pay.id,
      amount_cents: Math.round(pay.amount * 100),
      reason: `Refund requested via Admin Dashboard for booking ${pay.booking_id}`
    });
    const element = document.getElementById('refund-form-card');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await adminService.removeProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      setStats(prev => ({ ...prev, totalProducts: prev.totalProducts - 1 }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Force cancel this booking?')) return;
    try {
      await adminService.updateBookingStatus(bookingId, { status: 'cancelled' });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveDispute = async (disputeId, resolution, notes, amount) => {
    try {
      await adminService.resolveDispute(disputeId, resolution, notes, amount);
      setDisputes(disputes.filter(d => d.id !== disputeId));
      setStats(prev => ({ ...prev, openDisputes: prev.openDisputes - 1 }));
      alert('Dispute resolved successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveKyc = async (id, status, notes) => {
    const kyc = kycSubmissions.find(k => k.id === id);
    try {
      await adminService.resolveKyc(id, status, notes, kyc?.user_id);
      setKycSubmissions(prev => prev.filter(k => k.id !== id));
      if (kyc?.user_id) {
        setUsers(prev => prev.map(u => u.id === kyc.user_id
          ? { ...u, kyc_verified: status === 'approved', kyc_status: status === 'approved' ? 'verified' : status }
          : u
        ));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name || !newCat.slug) return;
    try {
      const data = await adminService.createCategory(newCat);
      setCategories(prev => [...prev, data]);
      setNewCat({ name: '', slug: '', seo_title: '', icon_url: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.image_url) return;
    try {
      const data = await adminService.createBanner(newBanner);
      setBanners(prev => [...prev, data]);
      setNewBanner({ title: '', image_url: '', link_url: '', position: 1 });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await adminService.deleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!bulkNotif.message) return;
    try {
      const result = await adminService.sendBulkNotification(bulkNotif);
      alert(`Notification dispatched to ${result.sent} users.`);
      setBulkNotif({ message: '', target_role: 'all', target_city: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundForm.payment_id) return;
    try {
      await adminService.processRefund(refundForm);
      setPayments(prev => prev.map(p => p.id === refundForm.payment_id ? { ...p, status: 'refunded' } : p));
      alert('Refund processed successfully.');
      setRefundForm({ payment_id: '', amount_cents: '', reason: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendAdminReply = (chatId, text) => {
    const activeChats = JSON.parse(localStorage.getItem('live_support_chats') || '[]');
    const chat = activeChats.find(c => c.id === chatId);
    if (chat) {
      chat.messages.push({
        sender: 'admin',
        text,
        timestamp: new Date().toISOString()
      });
      chat.lastMessageAt = new Date().toISOString();
      localStorage.setItem('live_support_chats', JSON.stringify(activeChats));
      
      // Dispatch sync event
      window.dispatchEvent(new CustomEvent('live_chat_update', { detail: { chatId } }));
      
      // Update local state
      setLiveChats(activeChats);
    }
  };

  const handleCloseChat = (chatId) => {
    const activeChats = JSON.parse(localStorage.getItem('live_support_chats') || '[]');
    const chat = activeChats.find(c => c.id === chatId);
    if (chat) {
      chat.status = 'closed';
      localStorage.setItem('live_support_chats', JSON.stringify(activeChats));
      window.dispatchEvent(new CustomEvent('live_chat_update', { detail: { chatId } }));
      setLiveChats(activeChats);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center bg-gray-50 text-center">
        <Shield size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // Filter lists
  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.title?.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredBookings = bookings.filter(b => b.product?.title?.toLowerCase().includes(bookingSearch.toLowerCase()) || b.renter?.name?.toLowerCase().includes(bookingSearch.toLowerCase()));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-navy via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6 border border-white/5">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
            <Shield size={40} className="text-primary-light animate-pulse" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-black tracking-tight mb-1">Admin Command Center</h1>
            <p className="text-gray-300 text-sm">Real-time moderator panel, verification queue, resolution hub, and logs.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchDashboardData} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 active:scale-95">
              <RefreshCw size={18} />
            </button>
            <span className="flex items-center gap-2 text-xs font-black text-green-400 bg-green-400/10 border border-green-400/30 px-4 py-2.5 rounded-full shadow-sm">
              <Radio size={12} className="animate-ping" /> LIVE OVERWATCH
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'listings', label: 'Listings', icon: Package },
            { id: 'bookings', label: 'Bookings', icon: Clock },
            { id: 'disputes', label: 'Disputes', icon: AlertOctagon, badge: stats.openDisputes },
            { id: 'kyc', label: 'KYC Queue', icon: FileText, badge: kycSubmissions.length },
            { id: 'categories_banners', label: 'Categories & Banners', icon: ImageIcon },
            { id: 'notifications', label: 'Notifications Dispatch', icon: Send },
            { id: 'audits_payments', label: 'Audits & Payments', icon: DollarSign },
            { id: 'chats', label: 'Support Chats', icon: MessageSquare, badge: activeChatsCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'text-primary border-primary font-black' 
                  : 'text-gray-400 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Panels */}
        <div className="transition-all duration-300">
          
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <AdminOverview stats={stats} />
              <AdminAnalytics />
            </div>
          )}

          {/* 2. USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={userSearch} 
                  onChange={(e) => setUserSearch(e.target.value)} 
                  placeholder="Search users by name, email..." 
                  className="flex-1 bg-white border border-gray-200 py-3 px-4 rounded-2xl focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <AdminUsers users={filteredUsers} onBanUser={handleBanUser} onChangeRole={handleChangeRole} onApproveAdmin={handleApproveAdmin} />
            </div>
          )}

          {/* 3. LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={productSearch} 
                  onChange={(e) => setProductSearch(e.target.value)} 
                  placeholder="Search listings by title..." 
                  className="flex-1 bg-white border border-gray-200 py-3 px-4 rounded-2xl focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <AdminProducts 
                products={filteredProducts} 
                onRemoveProduct={handleRemoveProduct} 
                onUpdateStatus={handleUpdateProductStatus}
                onToggleFeature={handleToggleProductFeature}
                onUpdateProductDetails={handleUpdateProductDetails}
              />
            </div>
          )}

          {/* 4. BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={bookingSearch} 
                  onChange={(e) => setBookingSearch(e.target.value)} 
                  placeholder="Search bookings by item, renter..." 
                  className="flex-1 bg-white border border-gray-200 py-3 px-4 rounded-2xl focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-6">Rental Item</th>
                      <th className="p-6">Renter</th>
                      <th className="p-6">Owner</th>
                      <th className="p-6">Dates</th>
                      <th className="p-6">Status</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-400">No bookings match the search criteria.</td>
                      </tr>
                    ) : (
                      filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="p-6 font-bold text-gray-900">{b.product?.title}</td>
                          <td className="p-6 text-gray-500">{b.renter?.name}</td>
                          <td className="p-6 text-gray-500">{b.owner?.name}</td>
                          <td className="p-6 text-gray-400 text-xs">{b.start_date} &bull; {b.end_date}</td>
                          <td className="p-6">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl font-bold uppercase py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="live">Live</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="disputed">Disputed</option>
                            </select>
                          </td>
                          <td className="p-6 text-right">
                            {b.status === 'live' && (
                              <Button variant="outline" className="text-red-600 border-red-100 py-1.5 px-3 hover:bg-red-50" onClick={() => handleCancelBooking(b.id)}>
                                Force Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. DISPUTES */}
          {activeTab === 'disputes' && (
            <AdminDisputes disputes={disputes} onResolveDispute={handleResolveDispute} />
          )}

          {/* 6. KYC QUEUE */}
          {activeTab === 'kyc' && (
            <AdminKYC kycSubmissions={kycSubmissions} onResolveKyc={handleResolveKyc} />
          )}

          {/* 7. CATEGORIES & BANNERS */}
          {activeTab === 'categories_banners' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Editor */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Manage Marketplace Categories</h3>
                    <p className="text-gray-500 text-xs">Create or remove categories visible to users.</p>
                  </div>
                  
                  <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                    <input type="text" placeholder="Category Name" value={newCat.name} onChange={(e) => setNewCat({...newCat, name: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" required />
                    <input type="text" placeholder="Slug" value={newCat.slug} onChange={(e) => setNewCat({...newCat, slug: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" required />
                    <input type="text" placeholder="SEO Title" value={newCat.seo_title} onChange={(e) => setNewCat({...newCat, seo_title: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" />
                    <input type="text" placeholder="Icon URL" value={newCat.icon_url} onChange={(e) => setNewCat({...newCat, icon_url: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" />
                    <button type="submit" className="sm:col-span-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2">
                      <Plus size={14} /> Add Category
                    </button>
                  </form>

                  <div className="divide-y divide-gray-100">
                    {categories.map(c => (
                      <div key={c.id} className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-3">
                          {c.icon_url && <img src={c.icon_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{c.slug}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCategory(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banners Editor */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Homepage Promotional Banners</h3>
                    <p className="text-gray-500 text-xs">Configure hero slide promotional assets.</p>
                  </div>

                  <form onSubmit={handleCreateBanner} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                    <input type="text" placeholder="Banner Title" value={newBanner.title} onChange={(e) => setNewBanner({...newBanner, title: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" required />
                    <input type="text" placeholder="Image URL" value={newBanner.image_url} onChange={(e) => setNewBanner({...newBanner, image_url: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" required />
                    <input type="text" placeholder="Link URL" value={newBanner.link_url} onChange={(e) => setNewBanner({...newBanner, link_url: e.target.value})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" />
                    <input type="number" placeholder="Position" value={newBanner.position} onChange={(e) => setNewBanner({...newBanner, position: parseInt(e.target.value) || 1})} className="p-2 border border-gray-200 rounded-xl bg-white text-sm" />
                    <button type="submit" className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2">
                      <Plus size={14} /> Publish Banner
                    </button>
                  </form>

                  <div className="space-y-4">
                    {banners.map(b => (
                      <div key={b.id} className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                        <img src={b.image_url} alt="" className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between">
                          <span className="self-end bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white font-bold">Pos: {b.position}</span>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-white font-black text-sm">{b.title}</p>
                              <p className="text-gray-300 text-[10px] font-bold">{b.link_url}</p>
                            </div>
                            <button onClick={() => handleDeleteBanner(b.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl active:scale-95 transition-transform">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform Settings */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Platform Global Settings</h3>
                  <p className="text-gray-500 text-xs">Configure the take-rates, security parameters, and overall platform modes.</p>
                </div>
                <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Commission Fee (%)</label>
                    <input 
                      type="number" 
                      value={platformSettings.commissionFee} 
                      onChange={(e) => setPlatformSettings({...platformSettings, commissionFee: e.target.value})} 
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deposit Threshold (%)</label>
                    <input 
                      type="number" 
                      value={platformSettings.depositThreshold} 
                      onChange={(e) => setPlatformSettings({...platformSettings, depositThreshold: e.target.value})} 
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cooling Off Period (Days)</label>
                    <input 
                      type="number" 
                      value={platformSettings.coolingPeriod} 
                      onChange={(e) => setPlatformSettings({...platformSettings, coolingPeriod: e.target.value})} 
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">System Maintenance Mode</label>
                    <select 
                      value={platformSettings.maintenanceMode} 
                      onChange={(e) => setPlatformSettings({...platformSettings, maintenanceMode: e.target.value})} 
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    >
                      <option value="false">Online (Normal Operations)</option>
                      <option value="true">Under Maintenance</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <Button type="submit" variant="primary" className="py-3 px-6">
                      Save Settings
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 8. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div>
                <h3 className="text-lg font-black text-gray-900">Broadcast Notification Dispatcher</h3>
                <p className="text-gray-500 text-xs">Send target alerts (Push, In-App) dynamically based on metadata.</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Roles</label>
                  <select value={bulkNotif.target_role} onChange={(e) => setBulkNotif({...bulkNotif, target_role: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm">
                    <option value="all">All Users</option>
                    <option value="renter">Renters Only</option>
                    <option value="owner">Listers/Owners Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target City (Optional)</label>
                  <input type="text" placeholder="e.g. Delhi, Greater Noida" value={bulkNotif.target_city} onChange={(e) => setBulkNotif({...bulkNotif, target_city: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notification Message</label>
                  <textarea rows={4} value={bulkNotif.message} onChange={(e) => setBulkNotif({...bulkNotif, message: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none resize-none" placeholder="Alert details..." required></textarea>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors active:scale-[0.99]">
                  <Send size={14} /> Dispatch Broadcast Campaign
                </button>
              </form>
            </div>
          )}

          {/* 9. AUDITS & PAYMENTS */}
          {activeTab === 'audits_payments' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Razorpay Refund Action */}
                <div id="refund-form-card" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-1 space-y-4 self-start">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Initiate Razorpay Refund</h3>
                    <p className="text-gray-500 text-xs">Execute refund payload for cancelled orders.</p>
                  </div>
                  
                  <form onSubmit={handleProcessRefund} className="space-y-4">
                    <input type="text" placeholder="Razorpay Payment ID (pay_...)" value={refundForm.payment_id} onChange={(e) => setRefundForm({...refundForm, payment_id: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs" required />
                    <input type="number" placeholder="Amount (in Cents, e.g. 5000 = $50)" value={refundForm.amount_cents} onChange={(e) => setRefundForm({...refundForm, amount_cents: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs" required />
                    <input type="text" placeholder="Reason" value={refundForm.reason} onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs" required />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2">
                      <DollarSign size={14} /> Issue Refund API
                    </button>
                  </form>
                </div>

                {/* Audit Logs & Payments list */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Audit Logs */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-black text-gray-900">System Activity Audit Logs</h3>
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-2">
                      {auditLogs.map(log => (
                        <div key={log.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-gray-900 uppercase">{log.action}</p>
                            <p className="text-gray-400 text-[10px]">
                              Target: {log.target_id} 
                              {log.admin && ` • Admin: ${log.admin.name || log.admin.email}`}
                              {log.ip_address && ` • IP: ${log.ip_address}`}
                            </p>
                          </div>
                          <span className="text-gray-400 font-bold">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transactions list */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-black text-gray-900">Razorpay Transaction Logs</h3>
                    <div className="divide-y divide-gray-100 text-xs">
                      {payments.map(pay => (
                        <div key={pay.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="font-black text-gray-900">{pay.id}</p>
                            <p className="text-gray-400 text-[10px]">Booking: {pay.booking_id} &bull; {new Date(pay.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">${pay.amount}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              pay.status === 'captured' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                            }`}>{pay.status}</span>
                            {pay.status === 'captured' && (
                              <button
                                onClick={() => handleQuickRefund(pay)}
                                className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-100 transition-colors"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. SUPPORT CHATS */}
          {activeTab === 'chats' && (
            <AdminSupportChats liveChats={liveChats} onReply={handleSendAdminReply} onCloseChat={handleCloseChat} />
          )}

        </div>

      </div>
    </div>
  );
};

export default Admin;

const AdminSupportChats = ({ liveChats, onReply, onCloseChat }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const selectedChat = liveChats.find(c => c.id === selectedChatId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;
    onReply(selectedChatId, replyText);
    setReplyText('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[500px] flex flex-col lg:flex-row gap-6">
      {/* Sidebar List */}
      <div className="lg:w-1/3 border-r border-gray-100 pr-0 lg:pr-6 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Radio size={14} className="text-green-500 animate-ping" /> Active Chat Queue
          </h3>
          <p className="text-gray-500 text-[10px]">Real-time visitor and support sessions.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
          {liveChats.length === 0 ? (
            <p className="text-gray-400 text-xs italic p-4 text-center">No active chats in queue.</p>
          ) : (
            liveChats.map(chat => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedChatId === chat.id 
                      ? 'bg-primary/5 border-primary/30 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-gray-800">{chat.userName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      chat.status === 'active' ? 'bg-green-55 text-green-700' : 'bg-gray-150 text-gray-500'
                    }`}>
                      {chat.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mb-2">{chat.email}</p>
                  {lastMsg && (
                    <p className="text-xs text-gray-600 truncate font-semibold">
                      {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.text}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Conversation Pane */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900">{selectedChat.userName}</h4>
                <p className="text-xs text-gray-500">{selectedChat.email} &bull; ID: {selectedChat.id}</p>
              </div>
              {selectedChat.status === 'active' && (
                <button
                  onClick={() => onCloseChat(selectedChat.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all"
                >
                  Resolve & Close Ticket
                </button>
              )}
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] mb-4 p-2 bg-gray-50/50 rounded-2xl border border-gray-100">
              {selectedChat.messages.length === 0 ? (
                <p className="text-gray-400 text-xs italic text-center p-8">No messages yet.</p>
              ) : (
                selectedChat.messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs ${
                      m.sender === 'admin' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none font-semibold'
                    }`}>
                      <p>{m.text}</p>
                      <span className="text-[8px] opacity-75 mt-1 block text-right">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input form */}
            {selectedChat.status === 'active' ? (
              <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Type a real-time reply as support operator..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-xs font-semibold outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                >
                  <Send size={12} /> Send Response
                </button>
              </form>
            ) : (
              <div className="p-4 bg-gray-100 text-gray-500 rounded-2xl text-center text-xs font-bold">
                This support ticket has been solved/closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <MessageSquare size={48} className="text-gray-300 mb-3 animate-bounce" />
            <h4 className="font-bold text-gray-800 text-sm">No Ticket Selected</h4>
            <p className="text-gray-400 text-xs mt-1">Select an active customer support conversation from the sidebar to chat live.</p>
          </div>
        )}
      </div>
    </div>
  );
};
