import React, { useState, useEffect } from 'react';
import { 
  Network, Search, Globe, Landmark, Settings, 
  ArrowRight, ShieldCheck, DollarSign, RefreshCw 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const GlobalFederationPortal = () => {
  const { token, isMock } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('discovery');
  const [reconcilingId, setReconcilingId] = useState(null);

  const fetchSettlements = async () => {
    try {
      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/federation/settlements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSettlements(data.settlements || []);
      } else {
        // Mock Settlements
        setSettlements([
          { id: 's1', from_tenant: { name: 'Apex Heavy Gear' }, to_tenant: { name: 'Default RentNear' }, net_amount: 85.00, fee_amount: 15.00, status: 'pending', created_at: '2026-08-03' }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    try {
      setSearching(true);
      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/federation/search?query=${searchQuery}`);
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        // Mock Federated Search
        setProducts([
          { id: 'p1', title: 'Industrial Generator', category: 'Heavy Machinery', price_per_day: 120, tenant: { name: 'Apex Heavy Gear', subdomain: 'apex' } },
          { id: 'p2', title: 'Camping Tent Pro', category: 'Outdoors', price_per_day: 15, tenant: { name: 'Default RentNear', subdomain: 'default' } }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([handleSearch(), fetchSettlements()]);
      setLoading(false);
    };
    init();
  }, [token, isMock]);

  const handleReconcile = async (settlementId) => {
    try {
      setReconcilingId(settlementId);
      if (token && !isMock) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/federation/settlements/reconcile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ settlementId })
        });
      }
      setSettlements(prev => prev.map(s => s.id === settlementId ? { ...s, status: 'cleared' } : s));
      alert('Cross-tenant payout cleared successfully.');
    } catch (err) {
      alert('Reconciliation failed.');
    } finally {
      setReconcilingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Network size={32} className="text-emerald-400" />
              <h2 className="text-2xl font-black">Global Federation Portal</h2>
            </div>
            <p className="text-xs text-emerald-200">Cross-marketplace discovery, franchise return logs, and automated wallet splits between partner nodes.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'discovery', label: 'Network Discovery', icon: Globe },
            { id: 'settlements', label: 'Partner Settlements', icon: Landmark }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all ${
                  active ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-navy'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="space-y-6">
          
          {/* Tab 1: Discovery */}
          {activeTab === 'discovery' && (
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products across entire federated network..."
                    className="w-full pl-11 bg-white border border-gray-250 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-transparent px-6">
                  Search Network
                </Button>
              </form>

              {searching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 italic">No products found in federated search.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex justify-between items-center hover:border-emerald-400 transition-all">
                      <div>
                        <div className="font-extrabold text-navy text-sm">{product.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{product.category}</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-2">
                          Price: <span className="text-emerald-600">${product.price_per_day}/day</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1.5">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider">
                          Provider: {product.tenant?.name}
                        </span>
                        <Button className="w-full text-[10px] py-1 px-3 mt-1.5 flex items-center justify-center gap-1">
                          Rent Now <ArrowRight size={10} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Settlements */}
          {activeTab === 'settlements' && (
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h4 className="font-extrabold text-navy text-sm">Cross-Marketplace Wallet Splits</h4>
                <button onClick={fetchSettlements} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><RefreshCw size={16} /></button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="p-3">Source Marketplace</th>
                      <th className="p-3">Provider Marketplace</th>
                      <th className="p-3 text-right">Net Amount</th>
                      <th className="p-3 text-right">Commission (Fee)</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settlements.map(set => (
                      <tr key={set.id} className="text-gray-700">
                        <td className="p-3 font-bold text-gray-900">{set.from_tenant?.name}</td>
                        <td className="p-3 font-bold text-gray-900">{set.to_tenant?.name}</td>
                        <td className="p-3 text-right font-black text-navy">${set.net_amount.toFixed(2)}</td>
                        <td className="p-3 text-right text-emerald-600">${set.fee_amount.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            set.status === 'cleared' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {set.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {set.status === 'pending' ? (
                            <Button
                              onClick={() => handleReconcile(set.id)}
                              disabled={reconcilingId === set.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent text-[10px] font-black py-1 px-3.5 flex items-center gap-1"
                            >
                              <DollarSign size={10} /> Clear Payout
                            </Button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1"><ShieldCheck size={12} className="text-green-500" /> Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </AnimatedPage>
  );
};

export default GlobalFederationPortal;
