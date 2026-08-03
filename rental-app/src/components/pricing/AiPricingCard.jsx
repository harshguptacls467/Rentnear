import React from 'react';
import { Sparkles, TrendingUp, CheckCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import Button from '../Button';

const AiPricingCard = ({ recommendation, currentPrice, onApply, applying }) => {
  if (!recommendation) return null;

  const {
    suggested_daily_price,
    suggested_weekly_price,
    suggested_monthly_price,
    price_min,
    price_max,
    demand_level,
    competitiveness_score
  } = recommendation;

  const isCurrentOptimal = Math.abs(currentPrice - suggested_daily_price) < 1;

  const getDemandColor = (level) => {
    switch (level) {
      case 'peak': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'high': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">AI Price Recommendation</h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getDemandColor(demand_level)}`}>
                  {demand_level} demand
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">Optimized for maximum booking volume and rental yields.</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right self-start sm:self-auto">
            <div className="text-[10px] uppercase font-extrabold text-indigo-300">Competitiveness</div>
            <div className="text-xl font-black text-emerald-400">{competitiveness_score}%</div>
          </div>
        </div>

        {/* Price Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 hover:border-indigo-400/50 transition-all">
            <div className="text-xs font-bold text-indigo-200 uppercase flex items-center gap-1.5 mb-1">
              <DollarSign size={14} /> Suggested Daily
            </div>
            <div className="text-3xl font-black text-white">${suggested_daily_price}</div>
            <div className="text-[11px] text-indigo-300 mt-1">Range: ${price_min} - ${price_max}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 hover:border-indigo-400/50 transition-all">
            <div className="text-xs font-bold text-indigo-200 uppercase flex items-center gap-1.5 mb-1">
              <Calendar size={14} /> Suggested Weekly
            </div>
            <div className="text-3xl font-black text-indigo-100">${suggested_weekly_price}</div>
            <div className="text-[11px] text-indigo-300 mt-1">~5.5x Daily rate</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 hover:border-indigo-400/50 transition-all">
            <div className="text-xs font-bold text-indigo-200 uppercase flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} /> Suggested Monthly
            </div>
            <div className="text-3xl font-black text-indigo-100">${suggested_monthly_price}</div>
            <div className="text-[11px] text-indigo-300 mt-1">~18x Daily rate</div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="text-xs text-indigo-200">
            Current Price: <span className="font-bold text-white">${currentPrice}/day</span>
            {isCurrentOptimal && <span className="ml-2 text-emerald-400 font-bold inline-flex items-center gap-1"><CheckCircle size={12}/> Optimal</span>}
          </div>

          <Button
            onClick={() => onApply(suggested_daily_price, true)}
            disabled={applying || isCurrentOptimal}
            variant="primary"
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold border-transparent px-6 rounded-xl shadow-lg shadow-emerald-500/20"
          >
            {applying ? 'Applying...' : isCurrentOptimal ? 'Already Optimal' : `Apply AI Price ($${suggested_daily_price})`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiPricingCard;
