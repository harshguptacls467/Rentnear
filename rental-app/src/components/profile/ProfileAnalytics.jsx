import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Sliders, Shield, Info, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

const ProfileAnalytics = () => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [calcCategory, setCalcCategory] = useState('camera');
  const [calcDailyPrice, setCalcDailyPrice] = useState(1200);
  const [calcDays, setCalcDays] = useState(12);

  // Hardcoded mock monthly earnings
  const monthlyEarnings = [
    { label: 'Jan', value: 1200, bookings: 2 },
    { label: 'Feb', value: 2800, bookings: 4 },
    { label: 'Mar', value: 4500, bookings: 6 },
    { label: 'Apr', value: 3100, bookings: 4 },
    { label: 'May', value: 6800, bookings: 8 },
    { label: 'Jun', value: 8450, bookings: 10 }
  ];

  // Helper to generate SVG coordinate points
  const getSvgPoints = (dataArray, width = 500, height = 150) => {
    const values = dataArray.map(d => d.value);
    const maxVal = Math.max(...values) || 1;
    const stepX = width / (dataArray.length - 1);
    
    return dataArray.map((d, idx) => {
      const x = idx * stepX;
      const y = height - (d.value / maxVal) * (height - 20) - 10;
      return { x, y, ...d };
    });
  };

  const points = getSvgPoints(monthlyEarnings);
  const pathD = points.reduce((acc, p, idx) => 
    idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );
  const areaD = `${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

  // Calculator logic
  const categoryRates = {
    camera: { label: 'Photography & Camera', avgRate: 1500, icon: '📷' },
    tools: { label: 'Power Tools', avgRate: 600, icon: '🔧' },
    camping: { label: 'Camping & Outdoor', avgRate: 500, icon: '⛺' },
    party: { label: 'Party Equipment', avgRate: 2000, icon: '🎈' },
    vehicles: { label: 'Bicycles & Scooters', avgRate: 400, icon: '🚲' }
  };

  const grossEarnings = calcDailyPrice * calcDays;
  const platformFee = Math.round(grossEarnings * 0.10);
  const securityDepositHold = Math.round(grossEarnings * 0.50);
  const netEarnings = grossEarnings - platformFee;

  const mockTransactions = [
    { id: 'tx-104', item: 'Sony Alpha 7 III Mirrorless Camera', renter: 'Rahul Sharma', amount: 3600, status: 'completed', date: 'Jul 18, 2026' },
    { id: 'tx-103', item: 'Bosch Professional Rotary Hammer Drill', renter: 'Amit Patel', amount: 1200, status: 'completed', date: 'Jul 15, 2026' },
    { id: 'tx-102', item: 'Quechua Waterproof 3-Person Tent', renter: 'Neha Gupta', amount: 1500, status: 'escrow', date: 'Jul 12, 2026' },
    { id: 'tx-101', item: 'DJI Mavic Air 2 Drone Fly More Combo', renter: 'Vikram Singh', amount: 8000, status: 'escrow', date: 'Jul 10, 2026' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Total Earnings</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-navy">₹18,450</div>
          <div className="text-[10px] font-bold text-blue-600 mt-1">+14.2% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">In Escrow</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-navy">₹9,500</div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1">Pending renter returns</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Active Rentals</span>
            <Calendar size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-navy">2 Items</div>
          <div className="text-[10px] font-bold text-purple-600 mt-1">Currently in use by neighbors</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Take-home Rate</span>
            <Shield size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-navy">90%</div>
          <div className="text-[10px] font-bold text-amber-600 mt-1">RentNear low commission tier</div>
        </div>
      </div>

      {/* Main Graph & Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Earnings Chart Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-navy">Earnings Progression</h3>
                <p className="text-xs text-gray-500 mt-0.5">Your monthly sharing payouts trajectory</p>
              </div>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                YTD Summary
              </span>
            </div>
            
            {/* SVG Graph Canvas */}
            <div className="relative h-40 w-full mt-6">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="500" y2="30" stroke="#f3f4f6" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f3f4f6" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#f3f4f6" strokeDasharray="3 3" />

                <path d={areaD} fill="url(#earnGrad)" />
                <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />

                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={selectedMonth?.label === p.label ? 6 : 4.5}
                    fill={selectedMonth?.label === p.label ? "#4f46e5" : "#ffffff"}
                    stroke="#4f46e5"
                    strokeWidth="3"
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedMonth(p)}
                  />
                ))}
              </svg>

              {/* Tooltip */}
              {selectedMonth && (
                <div
                  className="absolute bg-navy text-white text-[10px] p-2.5 rounded-xl border border-white/10 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                  style={{ left: `${(points.find(p => p.label === selectedMonth.label).x / 500) * 100}%`, top: `${(points.find(p => p.label === selectedMonth.label).y / 150) * 100}%` }}
                >
                  <div className="font-bold text-[9px] text-gray-400 uppercase">{selectedMonth.label} Earnings</div>
                  <div className="font-black text-primary-light mt-0.5">₹{selectedMonth.value.toLocaleString()}</div>
                  <div className="text-gray-300 text-[9px] mt-0.5">{selectedMonth.bookings} tool bookings</div>
                </div>
              )}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between px-1 text-[10px] font-bold text-gray-400 mt-2">
              {monthlyEarnings.map((m, idx) => (
                <span
                  key={idx}
                  className={`cursor-pointer transition-colors ${selectedMonth?.label === m.label ? 'text-primary' : 'hover:text-gray-600'}`}
                  onClick={() => setSelectedMonth(m)}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Info size={12} /> Click nodes to view details
            </span>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Avg. Payout: ₹4,475
            </span>
          </div>
        </div>

        {/* Dynamic Earning Calculator */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-navy flex items-center gap-1.5">
              <Sliders size={18} className="text-primary animate-pulse" />
              Earning Simulator
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Estimate your monthly payouts by listing gear</p>

            <div className="space-y-5 mt-6">
              {/* Category Picker */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Select Item Type</label>
                <div className="grid grid-cols-5 gap-1 bg-gray-100 p-1 rounded-xl">
                  {Object.keys(categoryRates).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setCalcCategory(key);
                        setCalcDailyPrice(categoryRates[key].avgRate);
                      }}
                      className={`text-center py-2 rounded-lg transition-all text-xs flex flex-col items-center justify-center gap-1 ${
                        calcCategory === key ? 'bg-white text-navy font-bold shadow-sm' : 'text-gray-400 hover:text-navy'
                      }`}
                    >
                      <span className="text-sm">{categoryRates[key].icon}</span>
                      <span className="text-[8px] font-bold tracking-tight uppercase truncate max-w-full px-1">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 1: Daily Price */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Daily Rental Fee</span>
                  <span className="text-xs font-black text-primary">₹{calcDailyPrice.toLocaleString()} / day</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={calcDailyPrice}
                  onChange={(e) => setCalcDailyPrice(Number(e.target.value))}
                  className="w-full accent-primary bg-gray-100 rounded-lg appearance-none cursor-pointer h-2"
                />
              </div>

              {/* Slider 2: Days Rented */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Days Rented Per Month</span>
                  <span className="text-xs font-black text-primary">{calcDays} days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={calcDays}
                  onChange={(e) => setCalcDays(Number(e.target.value))}
                  className="w-full accent-primary bg-gray-100 rounded-lg appearance-none cursor-pointer h-2"
                />
              </div>
            </div>
          </div>

          {/* Calculator Breakdown Results */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-6 space-y-3">
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>Gross Rental Income ({calcDays} days)</span>
              <span className="font-bold text-gray-700">₹{grossEarnings.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1">RentNear platform cut (10%) <Info size={10} className="text-gray-400" /></span>
              <span className="font-bold text-rose-500">- ₹{platformFee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-xs font-medium text-gray-500 border-b border-gray-200/50 pb-2">
              <span className="flex items-center gap-1">Renter Security Deposit (Held temporarily) <Info size={10} className="text-gray-400" /></span>
              <span className="font-bold text-amber-500">₹{securityDepositHold.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Estimated Net Paycheck</span>
                <p className="text-xs text-gray-400 font-medium">Direct bank transfer (UPI)</p>
              </div>
              <span className="text-xl font-black text-green-600">₹{netEarnings.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Transaction Logs */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-black text-navy">Escrow & Payout Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5">Track your rental checks and community transfers</p>
          </div>
          <button className="text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl uppercase tracking-wider transition-all">
            Download Statements (PDF)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="p-4 rounded-l-xl">Rental Item</th>
                <th className="p-4">Renter</th>
                <th className="p-4">Payout Date</th>
                <th className="p-4">Gross Revenue</th>
                <th className="p-4 rounded-r-xl">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {mockTransactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-900 truncate max-w-[200px]">{tx.item}</td>
                  <td className="p-4 font-semibold text-gray-600">{tx.renter}</td>
                  <td className="p-4 text-gray-500 font-bold">{tx.date}</td>
                  <td className="p-4 font-black text-navy">₹{tx.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      tx.status === 'completed' 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {tx.status === 'completed' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {tx.status === 'completed' ? 'Paid to Bank' : 'In Escrow Hold'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ProfileAnalytics;
