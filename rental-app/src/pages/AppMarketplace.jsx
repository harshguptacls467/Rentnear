import React, { useState, useEffect } from 'react';
import { 
  Puzzle, Plus, ShieldCheck, CreditCard, Settings, 
  Trash2, ToggleLeft, ToggleRight, ArrowRight, DownloadCloud 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const AppMarketplace = () => {
  const { token, isMock } = useAuthStore();
  const [plugins, setPlugins] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  
  // Settings modal state
  const [editingInstall, setEditingInstall] = useState(null);
  const [apiKeyVal, setApiKeyVal] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/plugins/marketplace`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPlugins(data.plugins || []);
      } else {
        // Mock App store data
        setPlugins([
          { id: 'app1', name: 'Razorpay Pro checkout', description: 'Enable UPI and card checkout instantly on your RentNear marketplace.', category: 'payment', price: 15.00, developer: { name: 'Razorpay Team' } },
          { id: 'app2', name: 'DHL logistics tracker', description: 'Auto dispatch handovers to DHL logistics carriers on bookings confirmation.', category: 'logistics', price: 0.00, developer: { name: 'DHL Devs' } }
        ]);
        setInstallations([
          { id: 'i1', plugin_id: 'app2', status: 'enabled', settings: { apiKey: 'dhl_prod_key_xyz123' }, plugin: { name: 'DHL logistics tracker', category: 'logistics' } }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [token, isMock]);

  const handleInstall = async (pluginId) => {
    try {
      const payload = {
        pluginId,
        tenantId: '00000000-0000-0000-0000-000000000000', // default fallback context
        settings: {}
      };

      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/plugins/install`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          const targetPlugin = plugins.find(p => p.id === pluginId);
          setInstallations(prev => [...prev, { ...data.installation, plugin: targetPlugin }]);
          alert('Plugin installed successfully!');
        }
      } else {
        const targetPlugin = plugins.find(p => p.id === pluginId);
        setInstallations(prev => [...prev, {
          id: 'i-' + Date.now(),
          plugin_id: pluginId,
          status: 'enabled',
          settings: {},
          plugin: targetPlugin
        }]);
        alert('Plugin installed successfully! (Mock Mode)');
      }
    } catch (err) {
      alert('Installation failed.');
    }
  };

  const handleToggleStatus = async (installId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
      if (token && !isMock) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/plugins/installations/${installId}/toggle`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: nextStatus })
        });
      }
      setInstallations(prev => prev.map(i => i.id === installId ? { ...i, status: nextStatus } : i));
    } catch (err) {
      alert('Toggle status failed.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editingInstall) return;
    try {
      setSavingSettings(true);
      const updatedSettings = { ...editingInstall.settings, apiKey: apiKeyVal };

      if (token && !isMock) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/plugins/installations/${editingInstall.id}/settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ settings: updatedSettings })
        });
      }

      setInstallations(prev => prev.map(i => i.id === editingInstall.id ? { ...i, settings: updatedSettings } : i));
      setEditingInstall(null);
      setApiKeyVal('');
      alert('Application configuration updated.');
    } catch (err) {
      alert('Save failed.');
    } finally {
      setSavingSettings(false);
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
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Puzzle size={32} className="text-teal-400" />
              <h2 className="text-2xl font-black">App Marketplace & Plugin store</h2>
            </div>
            <p className="text-xs text-teal-200">Scale marketplace configurations, connect CRM/ERP pipelines, and configure third-party payment gateways.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'browse', label: 'Browse App Marketplace', icon: DownloadCloud },
            { id: 'installed', label: 'Installed Extensions', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all ${
                  active ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-navy'
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
          
          {/* Tab 1: Browse store */}
          {activeTab === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plugins.map(app => {
                const installed = installations.some(i => i.plugin_id === app.id);
                return (
                  <div key={app.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 hover:border-teal-400 transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">{app.category}</span>
                        <span className="text-xs font-extrabold text-navy">{app.price === 0 ? 'Free' : `$${app.price}/mo`}</span>
                      </div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{app.name}</h4>
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed">{app.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                      <span className="text-[10px] text-gray-400 font-bold">Dev: {app.developer?.name}</span>
                      <Button
                        onClick={() => handleInstall(app.id)}
                        disabled={installed}
                        className={`text-[10px] font-black py-1 px-4 ${
                          installed ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white border-transparent'
                        }`}
                      >
                        {installed ? 'Installed' : 'Install App'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Installed Apps */}
          {activeTab === 'installed' && (
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-extrabold text-navy text-sm">Installed Integration Extensions</h4>
              
              {installations.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 italic">No plugins configured yet. Go to Browse store to add apps.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {installations.map(inst => (
                    <div key={inst.id} className="py-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                          {inst.plugin?.name}
                          <span className="bg-gray-50 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 text-[8px] font-black uppercase">{inst.plugin?.category}</span>
                        </div>
                        <div className="text-[10px] text-gray-400">Settings: {inst.settings?.apiKey ? 'API Key Saved' : 'No credentials input'}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Configure setting button */}
                        <button
                          onClick={() => { setEditingInstall(inst); setApiKeyVal(inst.settings?.apiKey || ''); }}
                          title="Configure Credentials"
                          className="p-2 hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-500"
                        >
                          <Settings size={14} />
                        </button>

                        {/* Enable/Disable Toggle button */}
                        <button onClick={() => handleToggleStatus(inst.id, inst.status)}>
                          {inst.status === 'enabled' ? (
                            <ToggleRight className="text-teal-600" size={32} />
                          ) : (
                            <ToggleLeft className="text-gray-300" size={32} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Editing Settings Modal overlay */}
        {editingInstall && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 animate-zoom-in">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Configure Application Settings</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{editingInstall.plugin?.name}</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Provider API Key Credentials</label>
                  <input
                    type="text"
                    required
                    value={apiKeyVal}
                    onChange={(e) => setApiKeyVal(e.target.value)}
                    placeholder="Enter api access token..."
                    className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" onClick={() => setEditingInstall(null)} className="flex-1 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingSettings} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold border-transparent">
                    {savingSettings ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AnimatedPage>
  );
};

export default AppMarketplace;
