import React, { useState, useEffect } from 'react';
import { Sliders, DollarSign, Calendar, TrendingUp, Zap } from 'lucide-react';
import Button from '../Button';
import { pricingService } from '../../api/pricingService';

const PriceSimulator = ({ productId, currentPrice = 50, suggestedPrice = 50, token, onApply, applying }) => {
  const [targetPrice, setTargetPrice] = useState(currentPrice);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTargetPrice(currentPrice);
  }, [currentPrice]);

  useEffect(() => {
    const runSimulation = async () => {
      try {
        setLoading(true);
        if (token && productId) {
          const res = await pricingService.simulateRevenue(productId, targetPrice, token);
          if (res.success) {
            setSimulation(res.simulation);
          }
        } else {
          // Instant Fallback Simulation math
          const ratio = targetPrice / Math.max(1, suggestedPrice);
          const elasticity = ratio > 1 ? Math.max(0.2, 1 - (ratio - 1) * 1.2) : Math.min(1.8, 1 + (1 - ratio) * 0.9);
          const days = Math.max(1, Math.min(30, Math.round(10 * elasticity)));
          const rev = Math.round(days * targetPrice * 100) / 100;
          const occ = Math.min(100, Math.round((days / 30) * 100));

          setSimulation({
            simulatedPrice: targetPrice,
            estimatedDaysBooked: days,
            estimatedMonthlyRevenue: rev,
            occupancyPercentage: occ,
            demandImpact: elasticity >= 1 ? 'positive' : elasticity >= 0.7 ? 'neutral' : 'negative'
          });
        }
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(runSimulation, 200);
    return () => clearTimeout(timer);
  }, [productId, targetPrice, suggestedPrice, token]);

  const minSlider = Math.max(5, Math.round(suggestedPrice * 0.5));
  const maxSlider = Math.round(suggestedPrice * 2.0);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
            <Sliders size={22} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900">Revenue & Occupancy Simulator</h4>
            <p className="text-xs text-gray-500">Test custom price points to project estimated earnings.</p>
          </div>
        </div>

        {simulation?.demandImpact && (
          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
            simulation.demandImpact === 'positive' ? 'bg-green-50 text-green-700 border-green-200' :
            simulation.demandImpact === 'neutral' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {simulation.demandImpact} demand impact
          </span>
        )}
      </div>

      {/* Price Input & Slider */}
      <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Simulated Daily Rate</label>
          <div className="flex items-center gap-1 text-2xl font-black text-gray-900">
            $<input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-24 border-b-2 border-primary bg-transparent text-2xl font-black text-gray-900 focus:outline-none text-right"
            />
            <span className="text-xs text-gray-400 font-normal">/day</span>
          </div>
        </div>

        <input
          type="range"
          min={minSlider}
          max={maxSlider}
          step="1"
          value={targetPrice}
          onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div className="flex justify-between text-[11px] font-bold text-gray-400">
          <span>Min: ${minSlider}</span>
          <span>Suggested: ${suggestedPrice}</span>
          <span>Max: ${maxSlider}</span>
        </div>
      </div>

      {/* Simulated Results Display */}
      {simulation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1 mb-1">
              <DollarSign size={14} /> Est. Monthly Revenue
            </div>
            <div className="text-2xl font-black text-emerald-900">${simulation.estimatedMonthlyRevenue}</div>
            <div className="text-[11px] text-emerald-700 mt-1">Based on projected bookings</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
            <div className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1 mb-1">
              <Calendar size={14} /> Est. Days Booked
            </div>
            <div className="text-2xl font-black text-indigo-900">{simulation.estimatedDaysBooked} days/mo</div>
            <div className="text-[11px] text-indigo-700 mt-1">Out of 30 days</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="text-xs font-bold text-purple-800 uppercase flex items-center gap-1 mb-1">
              <Zap size={14} /> Est. Occupancy Rate
            </div>
            <div className="text-2xl font-black text-purple-900">{simulation.occupancyPercentage}%</div>
            <div className="text-[11px] text-purple-700 mt-1">Listing utilization</div>
          </div>
        </div>
      )}

      {/* Save / Apply Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => onApply(targetPrice, false)}
          disabled={applying || targetPrice === currentPrice}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          {applying ? 'Saving...' : `Set Custom Price ($${targetPrice}/day)`}
        </Button>
      </div>
    </div>
  );
};

export default PriceSimulator;
