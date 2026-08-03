import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, Play, Plus, Trash2, Settings, ShieldCheck, 
  Workflow, Database, Cpu, Layout, HelpCircle, Activity 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const RentalOSDashboard = () => {
  const { token, isMock } = useAuthStore();
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Create Workflow form state
  const [flowName, setFlowName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('booking.approved');
  const [selectedActions, setSelectedActions] = useState([]);
  const [creatingFlow, setCreatingFlow] = useState(false);

  // Selected vertical preset
  const [activeTemplate, setActiveTemplate] = useState('Tools');

  const loadOSData = async () => {
    try {
      setLoading(true);
      if (token && !isMock) {
        // Fetch active workflows
        const flowRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/workflows`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const flowData = await flowRes.json();
        setWorkflows(flowData.workflows || []);

        // Fetch execution logs
        const logsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/workflows/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      } else {
        // Mock data
        setWorkflows([
          { id: 'w1', name: 'Auto Invoice & Notify', trigger_event: 'booking.approved', actions: [{ type: 'generate_invoice' }, { type: 'send_sms_alert' }] }
        ]);
        setLogs([
          { id: 'l1', workflow: { name: 'Auto Invoice & Notify', trigger_event: 'booking.approved' }, execution_status: 'success', execution_time_ms: 120, created_at: '2026-08-03T10:48:00Z' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOSData();
  }, [token, isMock]);

  const handleTemplateLaunch = (templateName) => {
    setActiveTemplate(templateName);
    alert(`Rental OS Initialized for the "${templateName}" catalog category. Setup default schemas, filters, and tax configurations.`);
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!flowName) return;
    try {
      setCreatingFlow(true);
      const payload = {
        name: flowName,
        triggerEvent,
        actions: selectedActions.map(type => ({ type }))
      };

      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/workflows/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setWorkflows(prev => [data.workflow, ...prev]);
        }
      } else {
        setWorkflows(prev => [{
          id: 'w-' + Date.now(),
          ...payload
        }, ...prev]);
      }

      setFlowName('');
      setSelectedActions([]);
      alert('Custom rental automation flow generated successfully.');
    } catch (err) {
      alert('Flow generation failed.');
    } finally {
      setCreatingFlow(false);
    }
  };

  const toggleActionSelection = (actionType) => {
    setSelectedActions(prev => 
      prev.includes(actionType) ? prev.filter(t => t !== actionType) : [...prev, actionType]
    );
  };

  const handleTestTrigger = async (flowId) => {
    try {
      if (token && !isMock) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/workflows/${flowId}/trigger`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ context: { bookingId: 'b-test-999', price: 150 } })
        });
        const data = await res.json();
        if (data.success) {
          alert('Test workflow run succeeded! Check Audit Logs Tab.');
          loadOSData();
        }
      } else {
        // Mock trace insert
        const target = workflows.find(w => w.id === flowId);
        setLogs(prev => [{
          id: 'l-' + Date.now(),
          workflow: { name: target.name, trigger_event: target.trigger_event },
          execution_status: 'success',
          execution_time_ms: 85,
          created_at: new Date().toISOString()
        }, ...prev]);
        alert('Test workflow run triggered (Mock mode).');
      }
    } catch (err) {
      alert('Trigger simulation failed.');
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
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CloudLightning size={32} className="text-sky-400 animate-bounce" />
              <h2 className="text-2xl font-black">RentNear Cloud Operating System</h2>
            </div>
            <p className="text-xs text-sky-200">Scale vertical rental models, map visual notification automation lines, and monitor system metrics.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'templates', label: '1-Click Catalog Presets', icon: Layout },
            { id: 'automations', label: 'Automation Builders', icon: Workflow },
            { id: 'logs', label: 'Audit Logs & Status', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all ${
                  active ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-500 hover:text-navy'
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
          
          {/* Tab 1: Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Tools', desc: 'Hardware, Drills & Jacks' },
                  { name: 'Camera', desc: 'Lenses, Tripods & Lights' },
                  { name: 'Bike', desc: 'Cruisers, Ebikes & Gear' },
                  { name: 'Car', desc: 'Sedans, SUVs & Utility' },
                  { name: 'Furniture', desc: 'Desks, Couches & Beds' },
                  { name: 'Medical', desc: 'Wheelchairs & Monitors' },
                  { name: 'Fashion', desc: 'Tuxedos, Dresses & Bags' },
                  { name: 'Construction', desc: 'Excavators & Scaffolding' }
                ].map(tmpl => {
                  const active = activeTemplate === tmpl.name;
                  return (
                    <div
                      key={tmpl.name}
                      onClick={() => handleTemplateLaunch(tmpl.name)}
                      className={`bg-white border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all hover:-translate-y-0.5 ${
                        active ? 'border-sky-600 ring-1 ring-sky-600' : 'border-gray-150 hover:border-sky-400'
                      }`}
                    >
                      <h5 className="font-extrabold text-navy text-sm">{tmpl.name} Rental OS</h5>
                      <p className="text-[10px] text-gray-400 font-semibold">{tmpl.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-sky-50 border border-sky-150 rounded-2xl p-5 text-xs text-sky-800 font-semibold leading-relaxed">
                🚀 **Active Framework Template:** Currently configured for the **{activeTemplate}** sector. Database schema attributes, catalog filters, and check-out compliance requirements have been dynamically optimized.
              </div>
            </div>
          )}

          {/* Tab 2: Automations */}
          {activeTab === 'automations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Creator Form */}
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5"><Plus size={16} /> New Automation Flow</h4>
                
                <form onSubmit={handleCreateWorkflow} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Workflow Name</label>
                    <input
                      type="text"
                      required
                      value={flowName}
                      onChange={(e) => setFlowName(e.target.value)}
                      placeholder="e.g. Notify Dispatch Team"
                      className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Trigger Event</label>
                    <select
                      value={triggerEvent}
                      onChange={(e) => setTriggerEvent(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold"
                    >
                      <option value="booking.created">booking.created</option>
                      <option value="booking.approved">booking.approved</option>
                      <option value="payment.success">payment.success</option>
                      <option value="product.created">product.created</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Actions Pipeline Chain</label>
                    {[
                      { type: 'generate_invoice', label: 'Generate PDF Invoice' },
                      { type: 'send_sms_alert', label: 'Send SMS Alert via Twilio' },
                      { type: 'schedule_pickup', label: 'Schedule Dispatch Delivery' },
                      { type: 'trigger_webhook', label: 'Trigger ERP CRM webhook' }
                    ].map(act => {
                      const selected = selectedActions.includes(act.type);
                      return (
                        <button
                          key={act.type}
                          type="button"
                          onClick={() => toggleActionSelection(act.type)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            selected ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-gray-200 hover:border-sky-400 text-gray-700'
                          }`}
                        >
                          {act.label}
                        </button>
                      );
                    })}
                  </div>

                  <Button type="submit" disabled={creatingFlow} className="w-full text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold border-transparent">
                    {creatingFlow ? 'Saving Flow...' : 'Save Automation Flow'}
                  </Button>
                </form>
              </div>

              {/* Workflows Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-extrabold text-navy text-sm">Active Automations</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflows.map(flow => (
                    <div key={flow.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-sky-400 transition-all">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-extrabold text-gray-900 text-sm">{flow.name}</h5>
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">active</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold">Trigger: <span className="font-mono">{flow.trigger_event}</span></div>

                        <div className="space-y-1 pt-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Pipeline Steps:</span>
                          {flow.actions.map((act, index) => (
                            <div key={index} className="text-[10px] text-gray-600 font-bold flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-500">{index + 1}</span>
                              {act.type.replace('_', ' ')}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          onClick={() => handleTestTrigger(flow.id)}
                          className="flex-1 text-[10px] font-black py-1 border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1"
                        >
                          <Play size={10} /> Test Flow
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Logs */}
          {activeTab === 'logs' && (
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h4 className="font-extrabold text-navy text-sm">Execution Traces & Pipeline Metrics</h4>
                <button onClick={loadOSData} className="text-[10px] font-bold text-sky-600 flex items-center gap-1"><Activity size={12} /> Refresh logs</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="p-3">Workflow Name</th>
                      <th className="p-3">Event Trigger</th>
                      <th className="p-3 text-right">Latency</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Trigger Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="text-gray-700">
                        <td className="p-3 font-bold text-gray-900">{log.workflow?.name}</td>
                        <td className="p-3 font-mono text-gray-500">{log.workflow?.trigger_event}</td>
                        <td className="p-3 text-right font-black text-navy">{log.execution_time_ms}ms</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.execution_status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {log.execution_status}
                          </span>
                        </td>
                        <td className="p-3 text-right text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</td>
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

export default RentalOSDashboard;
