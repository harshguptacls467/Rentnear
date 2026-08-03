import React, { useState, useEffect } from 'react';
import { 
  Terminal, Key, Code, RefreshCw, Trash2, Link2, 
  FileText, Activity, ShieldAlert, CheckCircle, AlertCircle, Copy 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { devService } from '../api/devService';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const DevPortal = () => {
  const { token, isMock } = useAuthStore();
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('keys');

  // Key creation state
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState(['read:products']);
  const [newRawKey, setNewRawKey] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Webhook registration state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['booking.created']);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);

  // Notification Banner
  const [toast, setToast] = useState(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      if (token && !isMock) {
        const [keysRes, webhooksRes, logsRes] = await Promise.all([
          devService.getKeys(token),
          devService.getWebhooks(token),
          devService.getApiLogs(token)
        ]);
        setKeys(keysRes.keys || []);
        setWebhooks(webhooksRes.endpoints || []);
        setLogs(logsRes.logs || []);
      } else {
        // Mock Developer Portal Data Fallback
        setKeys([
          { id: 'k1', name: 'Production Sync Token', key_prefix: 'rn_live_', scopes: ['read:products', 'write:bookings'], status: 'active', created_at: '2026-08-01' }
        ]);
        setWebhooks([
          { id: 'w1', url: 'https://api.logistics-partner.com/v1/rentals', secret: 'whsec_abcdef123456', events: ['booking.created', 'booking.completed'], is_active: true }
        ]);
        setLogs([
          { id: 'l1', endpoint: '/api/v1/products', method: 'GET', status_code: 200, ip_address: '192.168.1.1', duration_ms: 12, created_at: '2026-08-03T10:10:00Z', key: { name: 'Production Sync Token' } },
          { id: 'l2', endpoint: '/api/v1/bookings', method: 'POST', status_code: 201, ip_address: '192.168.1.1', duration_ms: 85, created_at: '2026-08-03T10:11:00Z', key: { name: 'Production Sync Token' } }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [token, isMock]);

  const showToastMsg = (msg, isError = false) => {
    setToast({ text: msg, error: isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyName) return;
    try {
      setGenerating(true);
      if (token && !isMock) {
        const res = await devService.generateKey({ name: keyName, scopes: selectedScopes }, token);
        if (res.success) {
          setNewRawKey(res.key.rawToken);
          setKeys(prev => [...prev, res.key]);
          showToastMsg('API Key Generated Successfully!');
        }
      } else {
        const mockRaw = 'rn_live_mock_' + Math.random().toString(36).substring(2, 15);
        setNewRawKey(mockRaw);
        setKeys(prev => [...prev, {
          id: 'mock-' + Date.now(),
          name: keyName,
          key_prefix: 'rn_live_',
          scopes: selectedScopes,
          status: 'active',
          created_at: new Date().toISOString()
        }]);
        showToastMsg('API Key Generated Successfully! (Mock Mode)');
      }
      setKeyName('');
    } catch (err) {
      showToastMsg(err.message || 'Key generation failed', true);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm('Are you absolutely sure you want to revoke this API Key? Any application using this key will immediately be blocked.')) return;
    try {
      if (token && !isMock) {
        await devService.revokeKey(keyId, token);
      }
      setKeys(prev => prev.filter(k => k.id !== keyId));
      showToastMsg('API Key Revoked successfully.');
    } catch (err) {
      showToastMsg(err.message || 'Revocation failed', true);
    }
  };

  const handleRegisterWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl) return;
    try {
      setRegisteringWebhook(true);
      if (token && !isMock) {
        const res = await devService.createWebhook({ url: webhookUrl, events: webhookEvents }, token);
        if (res.success) {
          setWebhooks(prev => [...prev, res.endpoint]);
          showToastMsg('Webhook Endpoint Registered.');
        }
      } else {
        setWebhooks(prev => [...prev, {
          id: 'wh-' + Date.now(),
          url: webhookUrl,
          secret: 'whsec_mock_' + Math.random().toString(36).substring(2, 15),
          events: webhookEvents,
          is_active: true
        }]);
        showToastMsg('Webhook Endpoint Registered (Mock Mode).');
      }
      setWebhookUrl('');
    } catch (err) {
      showToastMsg(err.message || 'Webhook registration failed', true);
    } finally {
      setRegisteringWebhook(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToastMsg('Copied to clipboard!');
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
        <div className="bg-gradient-to-r from-purple-900 via-violet-950 to-indigo-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Terminal size={32} className="text-purple-400" />
              <h2 className="text-2xl font-black">RentNear Developer Platform</h2>
            </div>
            <p className="text-xs text-purple-200">Generate secure API keys, subscribe to webhook handovers, and monitor query telemetry logs.</p>
          </div>
        </div>

        {/* Toast Alerts */}
        {toast && (
          <div className={`p-4 rounded-2xl flex items-center gap-2 border text-xs font-bold leading-relaxed ${
            toast.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {toast.error ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'keys', label: 'API Key Management', icon: Key },
            { id: 'webhooks', label: 'Webhook Endpoints', icon: Link2 },
            { id: 'logs', label: 'API Telemetry Logs', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all ${
                  active ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-navy'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body Contents */}
        <div className="space-y-6">
          
          {/* Tab 1: API Keys */}
          {activeTab === 'keys' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Key creation form */}
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                <h4 className="font-extrabold text-navy text-sm">Generate API Access Token</h4>
                
                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Key Name</label>
                    <input
                      type="text"
                      required
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="Logistic sync client"
                      className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Scopes</label>
                    <div className="space-y-2 mt-1">
                      {['read:products', 'write:bookings', 'read:organizations'].map(scope => (
                        <label key={scope} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes(prev => [...prev, scope]);
                              } else {
                                setSelectedScopes(prev => prev.filter(s => s !== scope));
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" disabled={generating} className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold border-transparent">
                    {generating ? 'Generating...' : 'Generate Secure Token'}
                  </Button>
                </form>

                {newRawKey && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <ShieldAlert size={14} className="text-amber-700" /> Save your token now!
                    </div>
                    <p className="text-[10px] text-amber-700 leading-normal">For security reasons, this token will NOT be shown again. Copy it safely.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={newRawKey}
                        className="flex-1 text-[10px] font-mono bg-white border border-amber-300 rounded-lg px-2 py-1.5 focus:outline-none text-navy font-bold"
                      />
                      <button
                        onClick={() => handleCopy(newRawKey)}
                        className="bg-white border border-amber-300 rounded-lg px-2.5 flex items-center justify-center hover:bg-amber-100"
                      >
                        <Copy size={12} className="text-amber-700" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active keys list */}
              <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-extrabold text-navy text-sm">Active API Keys</h4>
                
                {keys.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500 italic">No developer keys registered.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {keys.map(key => (
                      <div key={key.id} className="flex justify-between items-center py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900 text-xs">{key.name}</div>
                          <div className="text-[10px] font-mono text-gray-400">Prefix: {key.key_prefix}********************</div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {key.scopes.map(scope => (
                              <span key={scope} className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 font-bold uppercase">{scope}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          title="Revoke Token"
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Webhook endpoints */}
          {activeTab === 'webhooks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Webhook Form */}
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                <h4 className="font-extrabold text-navy text-sm">Register Webhook Endpoint</h4>
                
                <form onSubmit={handleRegisterWebhook} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Target Endpoint URL</label>
                    <input
                      type="url"
                      required
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://yourdomain.com/webhooks/rentnear"
                      className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Subscribe Events</label>
                    <div className="space-y-2 mt-1">
                      {['booking.created', 'booking.completed', 'payment.success'].map(evt => (
                        <label key={evt} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes(evt)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookEvents(prev => [...prev, evt]);
                              } else {
                                setWebhookEvents(prev => prev.filter(v => v !== evt));
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{evt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" disabled={registeringWebhook} className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold border-transparent">
                    {registeringWebhook ? 'Registering...' : 'Add Endpoint'}
                  </Button>
                </form>
              </div>

              {/* Webhooks list */}
              <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-extrabold text-navy text-sm">Configured Webhooks</h4>
                
                {webhooks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500 italic">No webhook endpoints registered.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {webhooks.map(wh => (
                      <div key={wh.id} className="py-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-900 text-xs truncate max-w-sm sm:max-w-md">{wh.url}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-1">Secret Key: {wh.secret}</div>
                          </div>
                          <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">Active</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {wh.events.map(e => (
                            <span key={e} className="text-[9px] bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 font-bold uppercase">{e}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: API Logs */}
          {activeTab === 'logs' && (
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="font-extrabold text-navy text-sm">Request Telemetry Audit</h4>
                  <p className="text-xs text-gray-500 mt-0.5 font-semibold">Real-time metrics tracking latency, status, and request endpoints.</p>
                </div>
                <button onClick={fetchPortalData} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><RefreshCw size={16} /></button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="p-3">Method</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">API Key Name</th>
                      <th className="p-3 text-right">Latency</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="text-gray-700">
                        <td className="p-3"><span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                          log.method === 'POST' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>{log.method}</span></td>
                        <td className="p-3 font-bold text-gray-900">{log.endpoint}</td>
                        <td className="p-3 text-gray-500">{log.key?.name || 'Developer Key'}</td>
                        <td className="p-3 text-right text-gray-600">{log.duration_ms} ms</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.status_code >= 400 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-150'
                          }`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</td>
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

export default DevPortal;
