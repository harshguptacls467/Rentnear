import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Sliders, Shield, AlertCircle, 
  CheckCircle2, Download, Printer, Box, Heart, MessageCircle, Star 
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { analyticsService } from '../api/analyticsService';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { Sparkles } from 'lucide-react';
import { pricingService } from '../api/pricingService';
import AiPricingCard from '../components/pricing/AiPricingCard';
import PricingInsights from '../components/pricing/PricingInsights';
import PriceSimulator from '../components/pricing/PriceSimulator';
import RecommendationHistory from '../components/pricing/RecommendationHistory';

const OwnerDashboard = () => {
  const { user, token, isMock } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pricing State
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [applyingPrice, setApplyingPrice] = useState(false);

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
          // Mock data fallback
          setData({
            metrics: {
              totalEarnings: 15400,
              pendingEarnings: 3200,
              securityDepositsHeld: 1500,
              totalBookings: 24,
              activeRentals: 3,
              completedRentals: 19,
              cancelledBookings: 2,
              averageRating: 4.8,
              responseRate: 95,
              acceptanceRate: 92,
              repeatCustomers: 4,
              profileScore: 100
            },
            charts: {
              earnings: [
                { date: 'Jan', amount: 1200 }, { date: 'Feb', amount: 2400 },
                { date: 'Mar', amount: 1800 }, { date: 'Apr', amount: 4500 },
                { date: 'May', amount: 5500 }
              ]
            },
            products: [
              { id: '1', title: 'Sony A7 IV', views: 450, wishlistCount: 23, bookingCount: 15, conversionRate: 3.33, revenue: 9500, insights: ['High demand'] },
              { id: '2', title: 'Bosch Drill', views: 120, wishlistCount: 5, bookingCount: 0, conversionRate: 0, revenue: 0, insights: ['Add more photos'] }
            ],
            actionableInsights: [
              { type: 'warning', message: 'Low response rate on messages. Reply faster to boost rankings.' },
              { type: 'success', message: 'You have repeat customers! Excellent service pays off.' }
            ]
          });
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
  }

  const { metrics, charts, products, actionableInsights } = data;

  // Simple SVG Line Chart generation
  const maxEarning = Math.max(...(charts?.earnings.map(d => d.amount) || [1]));
  const earningsPoints = (charts?.earnings || []).map((d, i, arr) => {
    const x = (i / (arr.length - 1 || 1)) * 500;
    const y = 150 - (d.amount / maxEarning) * 130 - 10;
    return { x, y, ...d };
  });

  const pathD = earningsPoints.reduce((acc, p, idx) => 
    idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );
  const areaD = earningsPoints.length > 0 ? `${pathD} L ${earningsPoints[earningsPoints.length - 1].x} 150 L ${earningsPoints[0].x} 150 Z` : '';

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gray-50/50 pb-20 print:bg-white print:p-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 print:hidden">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-navy">Performance Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Real-time metrics, insights, and earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                <Download size={14} /> Export CSV
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                <Printer size={14} /> Print Report
              </button>
            </div>
          </div>

          {/* Actionable Insights Banner */}
          {actionableInsights && actionableInsights.length > 0 && (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 print:hidden">
              {actionableInsights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-2xl flex items-start gap-3 border ${
                  insight.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  insight.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <div className="mt-0.5">
                    {insight.type === 'warning' && <AlertCircle size={18} />}
                    {insight.type === 'success' && <CheckCircle2 size={18} />}
                    {insight.type === 'suggestion' && <TrendingUp size={18} />}
                  </div>
                  <div className="flex-1 text-sm font-bold leading-tight">
                    {insight.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Level KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Earnings</span>
                <DollarSign size={16} className="text-blue-500" />
              </div>
              <div className="text-2xl font-black text-navy">₹{metrics.totalEarnings.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending (Escrow)</span>
                <Shield size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-navy">₹{metrics.pendingEarnings.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Bookings</span>
                <Calendar size={16} className="text-purple-500" />
              </div>
              <div className="text-2xl font-black text-navy">{metrics.totalBookings}</div>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg. Rating</span>
                <Star size={16} className="text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-black text-navy">{metrics.averageRating} <span className="text-sm font-bold text-gray-400">/ 5.0</span></div>
            </div>
          </div>

          {/* Chart Section */}
          {charts?.earnings && charts.earnings.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black text-navy mb-6">Earnings Trend (YTD)</h3>
              <div className="relative h-64 w-full">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="earnGradDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={i} x1="0" y1={30 * i} x2="500" y2={30 * i} stroke="#f3f4f6" strokeDasharray="3 3" />
                  ))}
                  
                  {/* Data Path */}
                  <path d={areaD} fill="url(#earnGradDash)" />
                  <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Nodes */}
                  {earningsPoints.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-gray-400">
                {earningsPoints.map((p, idx) => (
                  <span key={idx}>{p.date}</span>
                ))}
              </div>
            </div>
          )}

          {/* Product Insights Table */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-base font-black text-navy mb-6">Product Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="p-4 rounded-l-xl">Product</th>
                    <th className="p-4 text-center">Views</th>
                    <th className="p-4 text-center">Bookings</th>
                    <th className="p-4 text-center">Conv. Rate</th>
                    <th className="p-4 text-right rounded-r-xl">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {products?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 font-bold">No products listed yet.</td>
                    </tr>
                  ) : (
                    products?.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900 truncate max-w-[200px]">
                          {p.title}
                          {p.insights && p.insights.length > 0 && (
                            <div className="text-[10px] text-amber-600 font-bold mt-1 flex gap-1 items-center">
                              <AlertCircle size={10} /> {p.insights[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-gray-600">{p.views}</td>
                        <td className="p-4 text-center font-bold text-gray-600">{p.bookingCount}</td>
                        <td className="p-4 text-center font-black text-primary">{p.conversionRate}%</td>
                        <td className="p-4 text-right font-black text-navy">₹{p.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Pricing & Recommendation Section */}
          {products?.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-navy flex items-center gap-2">
                    <Sparkles className="text-indigo-600" size={20} /> AI Dynamic Pricing Engine
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Smart price optimization & revenue simulation for your listings.</p>
                </div>

                {/* Product Select Dropdown */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
                  <span className="text-xs font-bold text-gray-400">Listing:</span>
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
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
      </div>
    </AnimatedPage>
  );
};

export default OwnerDashboard;
