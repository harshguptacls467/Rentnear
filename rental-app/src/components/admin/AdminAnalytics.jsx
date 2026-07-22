import React, { useState } from 'react';
import { AreaChart, BarChart2, Brain, AlertTriangle, ShieldCheck, Zap, Sparkles, HelpCircle, ArrowRight, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30D');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Chart data based on selected time range
  const chartData = {
    '7D': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      revenue: [1200, 1900, 1500, 2200, 3100, 4200, 3800],
      commission: [120, 190, 150, 220, 310, 420, 380],
      bookings: [8, 12, 10, 15, 20, 28, 25]
    },
    '30D': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      revenue: [8500, 12400, 15800, 19400],
      commission: [850, 1240, 1580, 1940],
      bookings: [55, 78, 92, 115]
    },
    '6M': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      revenue: [45000, 52000, 68000, 85000, 112000, 134000],
      commission: [4500, 5200, 6800, 8500, 11200, 13400],
      bookings: [280, 340, 410, 520, 680, 810]
    }
  };

  const currentData = chartData[timeRange];
  const maxRevenue = Math.max(...currentData.revenue);

  // SVG Chart Helper Coordinates
  const getSvgPoints = (dataArray, width = 500, height = 180) => {
    const minVal = 0;
    const maxVal = Math.max(...dataArray) || 1;
    const stepX = width / (dataArray.length - 1);
    
    return dataArray.map((val, idx) => {
      const x = idx * stepX;
      // invert y coordinate for SVG
      const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 20) - 10;
      return { x, y, value: val };
    });
  };

  const revenuePoints = getSvgPoints(currentData.revenue);
  const commissionPoints = getSvgPoints(currentData.commission);

  const revenuePathD = revenuePoints.reduce((acc, p, idx) => 
    idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );
  
  const revenueAreaD = `${revenuePathD} L ${revenuePoints[revenuePoints.length - 1].x} 180 L ${revenuePoints[0].x} 180 Z`;

  const commissionPathD = commissionPoints.reduce((acc, p, idx) => 
    idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );

  const categoryShare = [
    { name: 'Camera & Video Gear', count: 48, percentage: 38, color: 'bg-indigo-600', fill: '#4f46e5' },
    { name: 'Power Tools & Hand Tools', count: 32, percentage: 25, color: 'bg-emerald-600', fill: '#10b981' },
    { name: 'Camping & Outdoor Adventure', count: 24, percentage: 19, color: 'bg-amber-500', fill: '#f59e0b' },
    { name: 'Party Equipment & Decor', count: 12, percentage: 10, color: 'bg-purple-600', fill: '#8b5cf6' },
    { name: 'Miscellaneous Items', count: 10, percentage: 8, color: 'bg-rose-500', fill: '#f43f5e' }
  ];

  const aiInsightsList = [
    {
      type: 'demand',
      icon: Zap,
      color: 'text-amber-500 bg-amber-50 border-amber-100',
      title: 'High Demand Surge Detected',
      desc: 'Tool rentals (Lawn Mowers, Drill Machines) spike 42% in Greater Noida. Recommend onboarding local tool owners to meet capacity.',
      action: 'Notify Potential Owners'
    },
    {
      type: 'risk',
      icon: AlertTriangle,
      color: 'text-rose-500 bg-rose-50 border-rose-100',
      title: 'High Replacement Value Flag',
      desc: '4 unverified user listings exceed ₹35,000 replacement value. Auto-pushed KYC verification prompts to these listings.',
      action: 'View flagged listings'
    },
    {
      type: 'pricing',
      icon: TrendingUp,
      color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
      title: 'Dynamic Pricing Opportunity',
      desc: 'DSLR lenses priced below ₹1,200/day conversion rate is 3.5x higher. Suggested optimal pricing range for new photography listing: ₹1,500.',
      action: 'Apply dynamic hints'
    },
    {
      type: 'security',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
      title: 'Real-time Fraud Shield Triggered',
      desc: 'System auto-locked new listing creation from IP subnet 103.45.XX for suspicious multi-account listing flood behavior.',
      action: 'View Security Audit Log'
    }
  ];

  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    // Simulate AI model processing time and query results
    setTimeout(() => {
      const query = aiPrompt.toLowerCase();
      let answer = '';
      
      if (query.includes('revenue') || query.includes('money') || query.includes('earnings')) {
        answer = `Platform revenue is trending upwards at +14.2% week-over-week. Camera & Video Gear generates the highest commission yield (₹4,890 this month), while Power Tools show the fastest booking velocity. We project active revenue will reach ₹24,000 by the end of next month if current KYC approval trends continue.`;
      } else if (query.includes('risk') || query.includes('dispute') || query.includes('fraud')) {
        answer = `Current risk level is Low. There are 2 open disputes currently under moderation. Average dispute resolution time is 18 hours. One unresolved dispute is due to missing check-in handover photos for an DSLR Camera. Recommend adding compulsory checklists for items > ₹15,000.`;
      } else if (query.includes('tool') || query.includes('popular') || query.includes('category')) {
        answer = `Top Category is "Camera & Video Gear" comprising 38% of total bookings. However, "Power Tools" has the highest utilization rate (84% of listed items are currently booked). Recommend running a targeted referral campaign for community listing of Drilling machines and Garden tools.`;
      } else {
        answer = `RentNear Intelligence Engine Analysis: We detected 12 active users with pending KYC who have drafted listings. Approving these KYC submissions will unlock approximately 18 new rental listings immediately, potentially increasing platform transaction volume by 12.5% this weekend.`;
      }
      
      setAiResponse(answer);
      setAiLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Time Range Selector & Custom SVG Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SVG Area Chart: Platform Revenue & Commission */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-black text-navy">Earnings & Booking Volume</h3>
              <p className="text-xs text-gray-500">Interactive platform cash flow monitoring</p>
            </div>
            
            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
              {['7D', '30D', '6M'].map((range) => (
                <button
                  key={range}
                  onClick={() => { setTimeRange(range); setSelectedPoint(null); }}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                    timeRange === range ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative h-48 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                {/* Revenue Gradient */}
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
                {/* Commission Gradient */}
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f3f4f6" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f3f4f6" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#f3f4f6" strokeDasharray="4 4" strokeWidth="1" />

              {/* Area Fills */}
              <path d={revenueAreaD} fill="url(#revGrad)" />
              
              {/* Lines */}
              <path d={revenuePathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
              <path d={commissionPathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 1" />

              {/* Interactive Hover Nodes */}
              {revenuePoints.map((point, idx) => (
                <g key={`rev-node-${idx}`} className="cursor-pointer" onClick={() => setSelectedPoint({ index: idx, type: 'revenue', ...point })}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={selectedPoint?.index === idx ? 6 : 4}
                    fill="#ffffff"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    className="transition-all hover:r-6"
                  />
                </g>
              ))}

              {commissionPoints.map((point, idx) => (
                <circle
                  key={`comm-node-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
              ))}
            </svg>

            {/* Tooltip Overlay */}
            {selectedPoint && (
              <div
                className="absolute bg-navy text-white text-[10px] p-2.5 rounded-xl border border-white/10 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ left: `${(selectedPoint.x / 500) * 100}%`, top: `${(selectedPoint.y / 180) * 100}%` }}
              >
                <div className="font-bold text-[9px] uppercase text-gray-400">{currentData.labels[selectedPoint.index]}</div>
                <div className="font-black mt-0.5 text-primary-light">Revenue: ₹{selectedPoint.value.toLocaleString()}</div>
                <div className="text-green-400 font-bold mt-0.5">Comm: ₹{currentData.commission[selectedPoint.index].toLocaleString()}</div>
                <div className="text-gray-300 mt-0.5">{currentData.bookings[selectedPoint.index]} Rentals</div>
              </div>
            )}
          </div>

          {/* Legends */}
          <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gross Booking Value</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Platform Take Rate (10%)</span>
              </div>
            </div>
            
            <span className="text-[10px] font-extrabold text-navy uppercase bg-slate-100 px-3 py-1 rounded-lg">
              Trend: +14.2% Upwards
            </span>
          </div>
        </div>

        {/* Category Breakdown (Bar Distribution) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-navy">Category Share</h3>
            <p className="text-xs text-gray-500">Breakdown of listings & booking velocity</p>
          </div>

          <div className="space-y-4 my-4">
            {categoryShare.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span className="truncate">{cat.name}</span>
                  <span className="text-navy">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-gray-400 font-bold text-center border-t border-gray-100 pt-3">
            Active category listings total: 125 items
          </div>
        </div>
      </div>

      {/* RentNear AI Platform Insights & Assistant */}
      <div className="bg-gradient-to-br from-navy via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[60px]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-xs font-bold text-primary-light mb-3">
              <Sparkles size={12} className="animate-spin" />
              <span>POWERED BY RENTNEAR AI DATA ENGINE</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight">AI Optimization & Insight Matrix</h3>
            <p className="text-gray-300 text-xs mt-1">Real-time alerts, pricing triggers, risk monitoring, and action dispatchers.</p>
          </div>
          
          <div className="w-full md:w-auto">
            <form onSubmit={handleAskAi} className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI: 'popular tool', 'risk assessment'..."
                className="bg-white/10 hover:bg-white/15 focus:bg-white focus:text-navy border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none transition-all w-full md:w-64 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="bg-primary text-white font-black text-xs px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1 shrink-0 active:scale-95 shadow-md shadow-primary/20"
              >
                {aiLoading ? 'Thinking...' : 'Analyze'}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic AI Prompt Response */}
        {aiResponse && (
          <div className="mb-8 p-5 bg-white/5 border border-white/10 rounded-2xl flex gap-3 relative z-10 animate-fadeIn">
            <Brain className="text-primary-light shrink-0" size={20} />
            <div>
              <h4 className="text-xs font-black text-primary-light uppercase tracking-wider mb-1">AI Analyst Response</h4>
              <p className="text-xs text-gray-200 leading-relaxed font-medium">{aiResponse}</p>
            </div>
          </div>
        )}

        {/* AI Insight Alerts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {aiInsightsList.map((alert, idx) => {
            const AlertIcon = alert.icon;
            return (
              <div key={idx} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all flex gap-4 group">
                <div className={`p-3 rounded-xl shrink-0 h-fit ${alert.color.split(' ')[0]} bg-white/10 border border-white/10`}>
                  <AlertIcon size={20} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-black text-gray-100">{alert.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">{alert.desc}</p>
                  
                  <button className="text-[10px] font-black text-primary-light uppercase tracking-wider pt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {alert.action} <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
