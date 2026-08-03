import React from 'react';
import { History, Sparkles, ArrowRight, Calendar } from 'lucide-react';

const RecommendationHistory = ({ history = [] }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 text-gray-700 rounded-2xl">
          <History size={22} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900">Price History Audit Trail</h4>
          <p className="text-xs text-gray-500">Past price changes and AI recommendation application log.</p>
        </div>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-black text-sm text-gray-900">
                <span className="text-gray-400 font-normal line-through">${item.previous_price}</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-primary">${item.new_price}/day</span>
              </div>

              {item.applied_ai_recommendation && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  <Sparkles size={12} /> AI Applied
                </span>
              )}
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationHistory;
