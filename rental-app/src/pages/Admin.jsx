import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { Shield } from 'lucide-react';
import { adminService } from '../api/adminService';

import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminProducts from '../components/admin/AdminProducts';
import AdminDisputes from '../components/admin/AdminDisputes';
import AdminKYC from '../components/admin/AdminKYC';

const Admin = () => {
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, bookingsToday: 0, openDisputes: 0 });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = session.access_token;

      // Fetch all data in parallel using the new API service layer
      const [statsData, usersData, productsData, disputesData, kycData] = await Promise.all([
        adminService.getStats(token),
        adminService.getUsers(token),
        adminService.getProducts(token),
        adminService.getDisputes(token),
        adminService.getKycSubmissions(token)
      ]);

      setStats(statsData);
      setUsers(usersData);
      setProducts(productsData);
      setDisputes(disputesData);
      setKycSubmissions(kycData);

    } catch (err) {
      setError(err.message || 'Access Denied. Ensure you are an Admin.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      Promise.resolve().then(() => {
        fetchDashboardData();
      });
    }
  }, [session, fetchDashboardData]);

  const handleBanUser = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserBan(userId, currentStatus, session.access_token);
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to remove this listing permanently?")) return;
    try {
      await adminService.removeProduct(productId, session.access_token);
      setProducts(products.filter(p => p.id !== productId));
      setStats(prev => ({ ...prev, totalProducts: prev.totalProducts - 1 }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveDispute = async (disputeId, resolution, notes, amount) => {
    try {
      await adminService.resolveDispute(disputeId, resolution, notes, amount, session.access_token);
      setDisputes(disputes.filter(d => d.id !== disputeId));
      setStats(prev => ({ ...prev, openDisputes: prev.openDisputes - 1 }));
      alert("Dispute resolved successfully.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveKyc = async (id, status, notes) => {
    try {
      await adminService.resolveKyc(id, status, notes, session.access_token);
      setKycSubmissions(prev => prev.filter(k => k.id !== id));
      
      // Update users list if they were verified
      if (status === 'approved') {
        const kyc = kycSubmissions.find(k => k.id === id);
        if (kyc) {
          setUsers(prev => prev.map(u => u.id === kyc.user_id ? { ...u, kyc_verified: true } : u));
        }
      }
    } catch (err) {
      alert(err.message);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-navy rounded-3xl p-8 text-white shadow-xl flex items-center gap-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Shield size={40} className="text-primary-light" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Admin Command Center</h1>
            <p className="text-gray-300">System management, moderation, and dispute resolution.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('listings')} 
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'listings' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Listings
          </button>
          <button 
            onClick={() => setActiveTab('disputes')} 
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'disputes' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Disputes
            {stats.openDisputes > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.openDisputes}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('kyc')} 
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'kyc' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-700'}`}
          >
            KYC Reviews
            {kycSubmissions.length > 0 && (
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{kycSubmissions.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="animate-fade-in-up">
          {activeTab === 'overview' && <AdminOverview stats={stats} />}
          {activeTab === 'users' && <AdminUsers users={users} onBanUser={handleBanUser} />}
          {activeTab === 'listings' && <AdminProducts products={products} onRemoveProduct={handleRemoveProduct} />}
          {activeTab === 'disputes' && <AdminDisputes disputes={disputes} onResolveDispute={handleResolveDispute} />}
          {activeTab === 'kyc' && <AdminKYC kycSubmissions={kycSubmissions} onResolveKyc={handleResolveKyc} />}
        </div>
      </div>
    </div>
  );
};

export default Admin;
