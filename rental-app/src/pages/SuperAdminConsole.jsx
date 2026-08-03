import React, { useState, useEffect } from 'react';
import { 
  Globe, Plus, Palette, Settings, Layout, BarChart, 
  Trash2, ShieldCheck, CreditCard, Sparkles, Network, Puzzle, CloudLightning
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const SuperAdminConsole = () => {
  const { token, isMock } = useAuthStore();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Tenant Form State
  const [tenantName, setTenantName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [aiOverride, setAiOverride] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [creating, setCreating] = useState(false);

  const loadTenants = async () => {
    try {
      setLoading(true);
      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tenant/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setTenants(data.tenants || []);
      } else {
        // Mock Tenant List
        setTenants([
          { id: 't1', name: 'Default RentNear', subdomain: 'default', custom_domain: null, branding: { primary_color: '#4f46e5' }, plan: 'enterprise', created_at: '2026-08-01' },
          { id: 't2', name: 'Apex Heavy Gear', subdomain: 'apex', custom_domain: 'rent.apex.com', branding: { primary_color: '#10b981' }, plan: 'pro', created_at: '2026-08-02' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [token, isMock]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!tenantName || !subdomain) return;
    try {
      setCreating(true);
      const payload = {
        name: tenantName,
        subdomain,
        customDomain: customDomain || null,
        branding: { primary_color: primaryColor },
        aiPromptOverride: aiOverride || null,
        plan: selectedPlan
      };

      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tenant/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setTenants(prev => [data.tenant, ...prev]);
        }
      } else {
        setTenants(prev => [{
          id: 'mock-' + Date.now(),
          ...payload,
          created_at: new Date().toISOString()
        }, ...prev]);
      }

      setTenantName('');
      setSubdomain('');
      setCustomDomain('');
      setAiOverride('');
      alert('SaaS Tenant Marketplace initialized successfully!');
    } catch (err) {
      alert(err.message || 'Creation failed.');
    } finally {
      setCreating(false);
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
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe size={32} className="text-indigo-400 animate-pulse" />
              <h2 className="text-2xl font-black">Multi-Tenant SaaS Console</h2>
            </div>
            <p className="text-xs text-indigo-200">Onboard custom white-label marketplaces, scale global plans, configure themes, and audit tenant networks.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/federation')}
              className="bg-white/10 hover:bg-white/20 border-white/10 text-white font-black text-xs py-2.5 px-5 flex items-center gap-1.5"
            >
              <Network size={16} /> Federation Dashboard
            </Button>
            <Button
              onClick={() => navigate('/marketplace')}
              className="bg-white/10 hover:bg-white/20 border-white/10 text-white font-black text-xs py-2.5 px-5 flex items-center gap-1.5"
            >
              <Puzzle size={16} /> App Marketplace
            </Button>
            <Button
              onClick={() => navigate('/rental-os')}
              className="bg-white/10 hover:bg-white/20 border-white/10 text-white font-black text-xs py-2.5 px-5 flex items-center gap-1.5"
            >
              <CloudLightning size={16} /> Rental OS
            </Button>
          </div>
        </div>

        {/* Global SaaS Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Tenant Networks</span>
            <div className="text-2xl font-black text-navy">{tenants.length} marketplaces</div>
          </div>
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Active Subdomains</span>
            <div className="text-2xl font-black text-navy">{tenants.filter(t => t.subdomain).length} registered</div>
          </div>
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Enterprise Clients</span>
            <div className="text-2xl font-black text-navy">{tenants.filter(t => t.plan === 'enterprise' || t.plan === 'pro').length} networks</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tenant Onboarding wizard */}
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
            <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5"><Plus size={16} /> Onboard Tenant Marketplace</h4>
            
            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Apex Heavy Rentals"
                  className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Subdomain</label>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="apex"
                    className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Branding Color</label>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-9 border border-gray-250 rounded-xl p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="rent.apex.com"
                  className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">AI Assistant Custom Prompt Override</label>
                <textarea
                  rows={2}
                  value={aiOverride}
                  onChange={(e) => setAiOverride(e.target.value)}
                  placeholder="e.g. Focus purely on heavy construction equipment queries."
                  className="w-full border border-gray-255 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Subscription Plan Level</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold"
                >
                  <option value="basic">Basic SaaS Marketplace</option>
                  <option value="pro">Pro Workspace Marketplace</option>
                  <option value="enterprise">Custom Enterprise White-Label</option>
                </select>
              </div>

              <Button type="submit" disabled={creating} className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-transparent">
                {creating ? 'Initializing Tenant...' : 'Provision Tenant Network'}
              </Button>
            </form>
          </div>

          {/* Tenants list grid */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-extrabold text-navy text-sm">Provisioned Tenant Networks</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenants.map(tenant => (
                <div key={tenant.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-400 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        {tenant.name}
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tenant.branding?.primary_color || '#4f46e5' }} title="Primary Theme Color" />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Subdomain: <span className="font-mono">{tenant.subdomain}.rentnear.com</span></div>
                      {tenant.custom_domain && (
                        <div className="text-[10px] text-gray-400">Custom Domain: <span className="font-mono">{tenant.custom_domain}</span></div>
                      )}
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded text-[10px] font-black uppercase">
                      {tenant.plan}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold border-t border-gray-100 pt-3">
                    <span>Created: {new Date(tenant.created_at).toLocaleDateString()}</span>
                    <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </AnimatedPage>
  );
};

export default SuperAdminConsole;
