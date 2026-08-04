import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Sliders, Shield, AlertCircle, 
  CheckCircle2, Download, Printer, Box, Heart, MessageCircle, Star,
  Sparkles, Clock, User, Moon, Sun, FileText, PieChart, Bell, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { analyticsService } from '../api/analyticsService';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { pricingService } from '../api/pricingService';
import AiPricingCard from '../components/pricing/AiPricingCard';
import PricingInsights from '../components/pricing/PricingInsights';
import PriceSimulator from '../components/pricing/PriceSimulator';
import RecommendationHistory from '../components/pricing/RecommendationHistory';
import { localGetOwnerBIDashboard } from '../utils/localDb';

const OwnerDashboard = () => {
  const { user, token, isMock } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BI and Theme States
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  const [toastAlert, setToastAlert] = useState(null);

  // Pricing State
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [applyingPrice, setApplyingPrice] = useState(false);

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (token && !isMock) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const res = await fetch(`${API_BASE_URL}/api/analytics/owner/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success) setNotifications(json.notifications || []);
        } else {
          setNotifications([
            { id: 'n1', title: 'Revenue Milestone Reached!', message: 'Congratulations! Your business net revenue crossed ₹10,000 this month.', read: false, created_at: new Date().toISOString() },
            { id: 'n2', title: 'High Demand Warning', message: 'Cameras & photo equipment searches are up 48% in your city. Consider increasing prices or listing more items.', read: false, created_at: new Date().toISOString() }
          ]);
        }
      } catch (e) {
        console.debug('Failed to fetch notifications:', e);
      }
    };
    if (user?.id) fetchNotifications();
  }, [user, token, isMock]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      try {
        if (token && !isMock) {
          const res = await analyticsService.getOwnerDashboard(token);
          if (res.success) {
            setData(res);
          }
        } else {
          // Local offline/mock calculations fallback
          const localData = localGetOwnerBIDashboard(user.id);
          setData(localData);
        }
      } catch (err) {
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, token, isMock]);

  // Set default selected product once data is loaded
  useEffect(() => {
    if (data?.products?.length > 0 && !selectedProductId) {
      setSelectedProductId(data.products[0].id);
    }
  }, [data, selectedProductId]);

  // Fetch Pricing Recommendation & History when selected product changes
  useEffect(() => {
    const fetchPricingData = async () => {
      if (!selectedProductId) return;
      try {
        setPricingLoading(true);
        if (token && !isMock) {
          const [recRes, histRes] = await Promise.all([
            pricingService.getRecommendation(selectedProductId, token).catch(() => null),
            pricingService.getHistory(selectedProductId, token).catch(() => null)
          ]);
          if (recRes?.success) setRecommendation(recRes.recommendation);
          if (histRes?.success) setPricingHistory(histRes.history || []);
        } else {
          // Mock Pricing Data Fallback
          setRecommendation({
            suggested_daily_price: 65,
            suggested_weekly_price: 357.5,
            suggested_monthly_price: 1170,
            price_min: 55,
            price_max: 82,
            demand_level: 'high',
            competitiveness_score: 92,
            rationale: [
              'Based on 8 similar listings in Cameras category (avg $60.00/day).',
              'High booking conversion detected (+8% demand headroom).',
              'Verified Trust Score (100) allows a +15% premium quality markup.'
            ],
            market_stats: {
              similarListingsCount: 8,
              categoryAvgPrice: 60.0,
              viewsCount: 450,
              completedBookings: 15
            }
          });
          setPricingHistory([
            { id: 'h1', previous_price: 50, new_price: 65, applied_ai_recommendation: true, created_at: new Date().toISOString() }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch pricing recommendation:', err);
      } finally {
        setPricingLoading(false);
      }
    };

    fetchPricingData();
  }, [selectedProductId, token, isMock]);

  // Handle Apply Price
  const handleApplyPrice = async (newPrice, appliedAi = false) => {
    if (!selectedProductId) return;
    try {
      setApplyingPrice(true);
      if (token && !isMock) {
        const res = await pricingService.applyPrice(selectedProductId, newPrice, appliedAi, token);
        if (res.success) {
          // Update product in dashboard state
          setData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === selectedProductId ? { ...p, price_per_day: newPrice } : p)
          }));
          // Refresh history
          const histRes = await pricingService.getHistory(selectedProductId, token);
          if (histRes?.success) setPricingHistory(histRes.history || []);
        }
      } else {
        // Mock apply update
        setData(prev => ({
          ...prev,
          products: (prev.products || []).map(p => p.id === selectedProductId ? { ...p, price_per_day: newPrice } : p)
        }));
        setPricingHistory(prev => [
          { id: Date.now().toString(), previous_price: recommendation?.suggested_daily_price || 50, new_price: newPrice, applied_ai_recommendation: appliedAi, created_at: new Date().toISOString() },
          ...prev
        ]);
      }
    } catch (err) {
      alert(err.message || 'Failed to update price.');
    } finally {
      setApplyingPrice(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data?.products) return;
    const headers = ['Product Title,Views,Wishlist Count,Bookings,Conversion Rate (%),Revenue'];
    const rows = data.products.map(p => 
      `"${p.title.replace(/"/g, '""')}",${p.views},${p.wishlistCount},${p.bookingCount},${p.conversionRate},${p.revenue}`
    );
    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RentNear_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <EmptyState
            icon={AlertCircle}
            title="Unable to Load Dashboard"
            message={error}
            actionLabel="Retry"
            onAction={() => window.location.reload()}
          />
        </div>
      </AnimatedPage>
    );
  }  const { metrics, charts, products, bookingStats, customerAnalytics, inventoryHealth, revenueMoMGrowth } = data;

  // Simple SVG Line Chart generation for Revenue
  const maxEarning = Math.max(...(charts?.earnings.map(d => d.amount) || [1]));
  const earningsPoints = (charts?.earnings || []).map((d, i, arr) => {
    const x = (i / (arr.length - 1 || 1)) * 500;
    const y = 150 - (d.amount / maxEarning) * 110 - 20;
    return { x, y, ...d };
  });

  const pathD = earningsPoints.reduce((acc, p, idx) => 
    idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );
  const areaD = earningsPoints.length > 0 ? `${pathD} L ${earningsPoints[earningsPoints.length - 1].x} 150 L ${earningsPoints[0].x} 150 Z` : '';

  // Theme helper classes
  const modeClass = (light, dark) => (theme === 'dark' ? dark : light);

  // Trigger local simulations
  const handleSimulateAlert = (type) => {
    let alertMsg = {};
    if (type === 'milestone') {
      alertMsg = { title: '🎉 Revenue Milestone Reached!', message: 'Congratulations! Your RentNear gross earnings crossed ₹10,000 this month.' };
    } else if (type === 'demand') {
      alertMsg = { title: '⚡ High Demand Detected', message: 'DSLR Cameras & photo accessories searches spiked 50% nearby. Increase prices to maximize payout.' };
    } else {
      alertMsg = { title: '💸 Payout Disbursed', message: 'RentNear has successfully disbursed ₹3,200 to your registered bank account.' };
    }
    setToastAlert(alertMsg);
    setNotifications(prev => [
      { id: Date.now().toString(), ...alertMsg, read: false, created_at: new Date().toISOString() },
      ...prev
    ]);
    setTimeout(() => setToastAlert(null), 5000);
  };

  // Mark notification read
  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (token && !isMock) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        await fetch(`${API_BASE_URL}/api/analytics/owner/notifications/${id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }
  };

  // Download financial report CSVs
  const handleDownloadReport = async (reportType) => {
    if (token && !isMock) {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      window.open(`${API_BASE_URL}/api/analytics/owner/reports/download?type=${reportType}&Authorization=Bearer ${token}`);
    } else {
      // Simulate download locally
      let csv = '';
      if (reportType === 'revenue') {
        csv = 'Date,Item Title,Total Billing (INR),GST (18%),Platform Commission (10%),Net Payoff\n08/01/2026,"Sony Alpha Camera",5000.00,900.00,500.00,4500.00\n08/03/2026,"DeWalt Drill",2200.00,396.00,220.00,1980.00';
      } else if (reportType === 'tax_gst') {
        csv = 'Tax Period,Gross Bookings,GST Service Tax Collected (18%)\nAugust 2026,7200.00,1296.00';
      } else if (reportType === 'payouts') {
        csv = 'Disbursement Date,Payout Reference ID,Status,Amount Paid (INR)\n08/01/2026,PAY-9918231-MOCK,Completed,5200.00\n08/03/2026,PAY-9918239-MOCK,Completed,3400.00';
      } else {
        csv = 'Booking Date,Renter Name,Status,Total Paid (INR)\n08/01/2026,"Harsh Gupta",Completed,5000.00\n08/03/2026,"Aarav Sharma",Completed,2200.00';
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RentNear_BI_${reportType}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <AnimatedPage>
      <div className={`min-h-screen pb-24 transition-all duration-300 ${modeClass('bg-[#F8FAFC]', 'bg-[#0f172a]')}`}>
        
        {/* Toast alert simulator banner */}
        <AnimatePresence>
          {toastAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20"
            >
              <Bell className="animate-bounce" size={16} />
              <div>
                <span className="block font-black">{toastAlert.title}</span>
                <span className="block text-[10px] text-white/95 mt-0.5">{toastAlert.message}</span>
              </div>
              <button onClick={() => setToastAlert(null)} className="text-white/80 hover:text-white ml-2"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150/40 pb-6 print:hidden">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-primary bg-primary/10 uppercase mb-2">
                <PieChart size={10} /> Owner Intelligence Platform
              </span>
              <h1 className={`text-3xl font-black tracking-tight leading-none ${modeClass('text-navy', 'text-white')}`}>Business Command Center</h1>
              <p className={`text-sm mt-1.5 ${modeClass('text-gray-500', 'text-gray-400')}`}>Detailed analytical telemetry, dynamic price suggestions, and GST tax ledger controls.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${modeClass('bg-white border-gray-250 hover:bg-gray-50 text-navy', 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-white')}`}
                title="Switch Theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors">
                <Printer size={14} /> Print Audit
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex gap-2 border-b border-gray-150/45 pb-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Sliders },
              { id: 'inventory', label: 'Inventory Health', icon: Box },
              { id: 'customers', label: 'Customer Analytics', icon: User },
              { id: 'reports', label: 'Financial Reports', icon: FileText }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-2xl transition-all border-b-2 outline-none flex-shrink-0 ${
                    isActive 
                      ? 'border-primary text-primary bg-primary/5 font-black'
                      : modeClass('border-transparent text-gray-500 hover:text-navy', 'border-transparent text-gray-400 hover:text-white')
                  }`}
                >
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab rendering */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Telemetry Simulator controls */}
              <div className={`p-4 border rounded-2xl flex flex-wrap items-center justify-between gap-4 ${modeClass('bg-indigo-50/50 border-indigo-100', 'bg-indigo-950/20 border-indigo-900/40')}`}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span className={`text-xs font-bold ${modeClass('text-indigo-800', 'text-indigo-300')}`}>TELEMETRY ALERTS SIMULATOR:</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSimulateAlert('milestone')} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow-sm">₹10K Revenue Milestone</button>
                  <button onClick={() => handleSimulateAlert('demand')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg shadow-sm">High Demand detected</button>
                  <button onClick={() => handleSimulateAlert('payout')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-sm">Disburse Payout</button>
                </div>
              </div>

              {/* Milestone & alerts list */}
              {notifications.filter(n => !n.read).length > 0 && (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {notifications.filter(n => !n.read).map(n => (
                    <div key={n.id} className={`p-4 border rounded-2xl flex items-start justify-between gap-3 ${modeClass('bg-amber-50/60 border-amber-200/80 text-amber-800', 'bg-amber-950/15 border-amber-900/30 text-amber-300')}`}>
                      <div className="flex gap-3">
                        <Bell className="mt-0.5 animate-pulse text-amber-500" size={18} />
                        <div>
                          <span className="block text-xs font-black">{n.title}</span>
                          <span className="block text-[11px] mt-0.5 leading-relaxed">{n.message}</span>
                        </div>
                      </div>
                      <button onClick={() => handleMarkRead(n.id)} className="text-xs font-black hover:underline hover:opacity-80">Dismiss</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Level KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, color: 'text-blue-500', icon: DollarSign, sub: `+${revenueMoMGrowth}% MoM Growth` },
                  { label: 'Monthly Revenue', value: `₹${metrics.monthlyRevenue.toLocaleString()}`, color: 'text-purple-500', icon: DollarSign, sub: 'Current Calendar Month' },
                  { label: 'Active Rentals', value: metrics.activeRentals, color: 'text-amber-500', icon: Clock, sub: 'Currently Out on Handover' },
                  { label: 'Booking Success', value: `${metrics.bookingSuccessRate}%`, color: 'text-emerald-500', icon: CheckCircle2, sub: `Cancellation: ${metrics.cancellationRate}%` },
                  { label: 'Pending Payouts', value: `₹${metrics.pendingPayouts.toLocaleString()}`, color: 'text-blue-400', icon: Shield, sub: 'Held in Escrow' },
                  { label: 'Completed Payouts', value: `₹${metrics.completedPayouts.toLocaleString()}`, color: 'text-green-500', icon: CheckCircle2, sub: 'Disbursed to Bank' },
                  { label: 'Avg Rating Given', value: `${metrics.averageRating} / 5.0`, color: 'text-yellow-500', icon: Star, sub: 'Trust Index Score: 100%' },
                  { label: 'Repeat Customers', value: metrics.repeatCustomers, color: 'text-indigo-500', icon: User, sub: 'Renters with >= 2 Bookings' }
                ].map((kpi, idx) => {
                  const KpiIcon = kpi.icon;
                  return (
                    <div key={idx} className={`p-6 border rounded-3xl shadow-sm transition-all duration-300 hover:scale-[1.01] ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{kpi.label}</span>
                        <KpiIcon size={16} className={kpi.color} />
                      </div>
                      <div className={`text-2xl font-black leading-none ${modeClass('text-navy', 'text-white')}`}>{kpi.value}</div>
                      <div className="text-[10px] font-bold text-gray-450 mt-2 block">{kpi.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* YTD Earnings SVG Trend Chart */}
              {charts?.earnings && charts.earnings.length > 0 && (
                <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                  <h3 className={`text-base font-black mb-6 ${modeClass('text-navy', 'text-white')}`}>Business Earnings Trajectory (YTD YTD)</h3>
                  <div className="relative h-64 w-full">
                    <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="biEarnGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {[0, 1, 2, 3, 4].map(i => (
                        <line key={i} x1="0" y1={30 * i} x2="500" y2={30 * i} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} strokeDasharray="3 3" />
                      ))}
                      <path d={areaD} fill="url(#biEarnGrad)" />
                      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      {earningsPoints.map((p, idx) => (
                        <circle key={idx} cx={p.x} cy={p.y} r="4.5" fill={theme === 'dark' ? '#1e293b' : '#ffffff'} stroke="#4f46e5" strokeWidth="2.5" />
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between mt-3 px-1 text-[10px] font-black text-gray-400">
                    {earningsPoints.map((p, idx) => (
                      <span key={idx}>{p.date}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Product list performance table */}
              <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                <h3 className={`text-base font-black mb-6 ${modeClass('text-navy', 'text-white')}`}>Product Listing Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${modeClass('bg-gray-50 border-gray-100 text-gray-400', 'bg-[#334155]/20 border-slate-700 text-gray-300')}`}>
                        <th className="p-4 rounded-l-xl">Listing Item</th>
                        <th className="p-4 text-center">Views</th>
                        <th className="p-4 text-center">Bookings</th>
                        <th className="p-4 text-center">Conversion</th>
                        <th className="p-4 text-right rounded-r-xl">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/10 text-sm">
                      {products?.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-450 font-bold">No active listings under command.</td>
                        </tr>
                      ) : (
                        products?.map(p => (
                          <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/40' : ''}`}>
                            <td className="p-4 font-black truncate max-w-[220px]">
                              {p.title}
                              {p.insights && p.insights.length > 0 && (
                                <div className="text-[10px] text-amber-500 font-bold mt-1.5 flex gap-1 items-center">
                                  <AlertCircle size={10} /> {p.insights[0]}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-gray-400">{p.views}</td>
                            <td className="p-4 text-center font-bold text-gray-400">{p.bookingCount}</td>
                            <td className="p-4 text-center font-black text-primary">{p.conversionRate}%</td>
                            <td className="p-4 text-right font-black">₹{p.revenue.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Pricing optimization engine integration */}
              {products?.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-gray-100/10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className={`text-xl font-black flex items-center gap-2 ${modeClass('text-navy', 'text-white')}`}>
                        <Sparkles className="text-indigo-500" size={20} /> AI Dynamic Pricing Engine
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Optimized rate simulator and revenue maximizers.</p>
                    </div>

                    <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl shadow-sm ${modeClass('bg-white border-gray-250', 'bg-slate-800 border-slate-700')}`}>
                      <span className="text-xs font-bold text-gray-400">Listing:</span>
                      <select
                        value={selectedProductId || ''}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id} className={theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {pricingLoading ? (
                    <Skeleton className="h-64 w-full rounded-3xl" />
                  ) : (
                    <>
                      <AiPricingCard
                        recommendation={recommendation}
                        currentPrice={products.find(p => p.id === selectedProductId)?.price_per_day || 50}
                        onApply={handleApplyPrice}
                        applying={applyingPrice}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <PricingInsights recommendation={recommendation} />
                        <PriceSimulator
                          productId={selectedProductId}
                          currentPrice={products.find(p => p.id === selectedProductId)?.price_per_day || 50}
                          suggestedPrice={recommendation?.suggested_daily_price || 50}
                          token={token}
                          onApply={handleApplyPrice}
                          applying={applyingPrice}
                        />
                      </div>

                      <RecommendationHistory history={pricingHistory} />
                    </>
                  )}
                </div>
              )}

            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Inventory Health KPI metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Inventory', value: inventoryHealth.totalProductsCount, color: 'text-blue-500', sub: 'Total listings added' },
                  { label: 'Occupancy Rate', value: `${bookingStats.occupancyRate}%`, color: 'text-indigo-500', sub: 'Listing booking utilization' },
                  { label: 'Out of Stock / Rented', value: inventoryHealth.currentlyRentedCount, color: 'text-purple-500', sub: 'Currently active rentals' },
                  { label: 'Low Performing Listings', value: inventoryHealth.lowPerformingCount, color: 'text-red-500', sub: 'Conversion rate < 2%' }
                ].map((kpi, idx) => (
                  <div key={idx} className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-2">{kpi.label}</span>
                    <span className={`text-2xl font-black leading-none block ${kpi.color}`}>{kpi.value}</span>
                    <span className="text-[10px] font-bold text-gray-450 mt-1 block">{kpi.sub}</span>
                  </div>
                ))}
              </div>

              {/* AI Suggestions for Improvement Section */}
              <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                <h3 className={`text-base font-black mb-6 flex items-center gap-2 ${modeClass('text-navy', 'text-white')}`}>
                  <Sparkles className="text-primary" size={18} /> AI Recommendations & Suggestions
                </h3>
                <div className="space-y-4">
                  {inventoryHealth.aiSuggestions.map((sug, idx) => (
                    <div key={idx} className={`p-4 border rounded-2xl flex items-start gap-3.5 ${
                      sug.type === 'warning' ? modeClass('bg-amber-50/50 border-amber-200 text-amber-900', 'bg-amber-950/10 border-amber-900/30 text-amber-300') :
                      sug.type === 'success' ? modeClass('bg-emerald-50/50 border-emerald-200 text-emerald-900', 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300') :
                      modeClass('bg-blue-50/50 border-blue-200 text-blue-900', 'bg-blue-950/10 border-blue-900/30 text-blue-300')
                    }`}>
                      <div className="mt-0.5"><Sparkles size={16} /></div>
                      <div>
                        <span className="block font-black text-xs uppercase tracking-wider">{sug.action}</span>
                        <span className="block text-xs mt-1 leading-relaxed opacity-90">{sug.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Listing stats details list */}
              <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                <h3 className={`text-base font-black mb-6 ${modeClass('text-navy', 'text-white')}`}>Booking Activity Logs</h3>
                <div className="space-y-4">
                  {bookingStats.upcomingBookings.length === 0 ? (
                    <p className="text-xs text-gray-450 italic py-4">No upcoming bookings scheduled.</p>
                  ) : (
                    bookingStats.upcomingBookings.map((b) => (
                      <div key={b.id} className={`p-4 border rounded-2xl flex justify-between items-center ${modeClass('bg-gray-50/50 border-gray-100', 'bg-slate-800/40 border-slate-700/60')}`}>
                        <div>
                          <span className="block font-black text-sm">{b.productTitle}</span>
                          <span className="block text-[10px] text-gray-400 font-bold mt-1">Renter: {b.renterName} • {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}</span>
                        </div>
                        <span className="text-sm font-black text-primary">₹{b.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Customer summary row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Repeat Customer telemetry */}
                <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                  <h3 className={`text-base font-black mb-4 ${modeClass('text-navy', 'text-white')}`}>Customer Loyalty Index</h3>
                  <div className="text-center py-6">
                    <span className="block text-4xl font-black text-primary mb-1">{customerAnalytics.repeatCustomersCount}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Repeat Customers</span>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">Renters returning for 2 or more booking completions on your listings catalog.</p>
                  </div>
                </div>

                {/* SVG Cumulative Customer Growth Simulation */}
                <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                  <h3 className={`text-base font-black mb-6 ${modeClass('text-navy', 'text-white')}`}>Active Customers Growth</h3>
                  <div className="h-32 w-full mt-4">
                    <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9e75" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0d9e75" stopOpacity="0.0" />
                      </linearGradient>
                      <path d="M 0 100 L 100 85 L 200 65 L 300 45 L 400 35 L 500 15 L 500 120 L 0 120 Z" fill="url(#growthGrad)" />
                      <path d="M 0 100 L 100 85 L 200 65 L 300 45 L 400 35 L 500 15" fill="none" stroke="#0d9e75" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Renter detail table */}
              <div className={`p-6 border rounded-3xl shadow-sm ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                <h3 className={`text-base font-black mb-6 ${modeClass('text-navy', 'text-white')}`}>Top Rental Renters</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${modeClass('bg-gray-50 border-gray-100 text-gray-400', 'bg-[#334155]/20 border-slate-700 text-gray-300')}`}>
                        <th className="p-4 rounded-l-xl">Renter profile</th>
                        <th className="p-4 text-center">Bookings</th>
                        <th className="p-4 text-right rounded-r-xl">Lifetime Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/10 text-sm">
                      {customerAnalytics.topCustomers?.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-gray-450 font-bold">No customer records yet.</td>
                        </tr>
                      ) : (
                        customerAnalytics.topCustomers?.map((c, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/40' : ''}`}>
                            <td className="p-4 font-black flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-150 overflow-hidden">
                                <img src={c.avatar_url || 'https://via.placeholder.com/50'} alt="renter" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="block">{c.name}</span>
                                <span className="block text-[10px] text-gray-400 font-bold mt-0.5">{c.email}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center font-bold text-gray-400">{c.bookingsCount} Completed</td>
                            <td className="p-4 text-right font-black text-primary">₹{c.totalSpend.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Financial reports collection cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Revenue & Net Payout Report', desc: 'Breakdown of bookings subtotal, platform commissions (10%), and net payoffs.', type: 'revenue' },
                  { title: 'Booking Activity Ledger', desc: 'Complete historical logs of bookings dates, statuses, and pricing details.', type: 'bookings' },
                  { title: 'Disbursement & Payouts Ledger', desc: 'Disbursement reference receipts and payout transactions records.', type: 'payouts' },
                  { title: 'GST Tax Summary (18% Collected)', desc: 'Service GST ledger reports matching local tax audits.', type: 'tax_gst' },
                  { title: 'Platform Profit & Loss Statement', desc: 'Aggregated revenue totals subtracting operational commissions.', type: 'profit_loss' }
                ].map((rep, idx) => (
                  <div key={idx} className={`p-6 border rounded-3xl shadow-sm flex flex-col justify-between ${modeClass('bg-white border-gray-100', 'bg-[#1e293b] border-slate-800')}`}>
                    <div>
                      <span className="inline-flex p-2.5 bg-primary/10 rounded-xl text-primary mb-4"><FileText size={20} /></span>
                      <h4 className={`text-base font-black mb-2 ${modeClass('text-navy', 'text-white')}`}>{rep.title}</h4>
                      <p className="text-xs text-gray-450 leading-relaxed mb-6">{rep.desc}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadReport(rep.type)}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs py-3 rounded-xl transition-all"
                    >
                      <Download size={14} /> Download CSV / Excel
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
};

export default OwnerDashboard;
