import React from 'react';
import { Info, CheckCircle2, TrendingUp, MapPin, Eye, Award } from 'lucide-react';

const PricingInsights = ({ recommendation }) => {
  if (!recommendation) return null;

  const { rationale = [], market_stats = {} } = recommendation;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Info size={22} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900">Pricing Rationale & Insights</h4>
          <p className="text-xs text-gray-500">Key signals driving your AI price calculation.</p>
        </div>
      </div>

      {/* Rationale Bullet List */}
      <div className="space-y-3">
        {rationale.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">{reason}</span>
          </div>
        ))}
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1.5 mb-1">
            <MapPin size={14} /> Nearby Listings
          </div>
          <div className="text-xl font-black text-gray-900">{market_stats.similarListingsCount || 0}</div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} /> Category Avg
          </div>
          <div className="text-xl font-black text-gray-900">${market_stats.categoryAvgPrice || 0}/day</div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1.5 mb-1">
            <Eye size={14} /> Page Views
          </div>
          <div className="text-xl font-black text-gray-900">{market_stats.viewsCount || 0}</div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1.5 mb-1">
            <Award size={14} /> Bookings
          </div>
          <div className="text-xl font-black text-gray-900">{market_stats.completedBookings || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default PricingInsights;
