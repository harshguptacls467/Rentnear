import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserCheck, AlertTriangle, ShieldCheck, 
  Settings, UserX, Clock, ChevronRight, Activity, BadgeInfo 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { riskService } from '../api/riskService';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const AdminRiskDashboard = () => {
  const { token, isMock } = useAuthStore();
  const [investigations, setInvestigations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const loadRiskData = async () => {
    try {
      setLoading(true);
      if (token && !isMock) {
        const res = await riskService.getInvestigations(token);
        setInvestigations(res.queue || []);
        // Seed mock alerts stream for display variety
        setAlerts([
          { id: 'a1', type: 'Location Mismatch', user: 'Sarah Jenkins', severity: 'medium', desc: 'Login coordinates shifted from India to Germany within 2 hours.', time: '10 mins ago' },
          { id: 'a2', type: 'Repeated Failed Logins', user: 'Arjun Mehta', severity: 'high', desc: 'Attempted login failed 5 times on Device ID DEV-883.', time: '25 mins ago' }
        ]);
      } else {
        // Mock Risk Dashboard
        setInvestigations([
          { id: 'i1', status: 'open', notes: 'Auto-flagged due to high Risk Score (85/100)', created_at: new Date().toISOString(), user: { name: 'Vikram Singh', email: 'vikram@mock.com', trust_score: 40 } }
        ]);
        setAlerts([
          { id: 'a1', type: 'Location Mismatch', user: 'Sarah Jenkins', severity: 'medium', desc: 'Login coordinates shifted from India to Germany within 2 hours.', time: '10 mins ago' },
          { id: 'a2', type: 'Repeated Failed Logins', user: 'Arjun Mehta', severity: 'high', desc: 'Attempted login failed 5 times on Device ID DEV-883.', time: '25 mins ago' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, [token, isMock]);

  const handleResolve = async (investigationId, decision) => {
    try {
      setResolvingId(investigationId);
      if (token && !isMock) {
        await riskService.resolveInvestigation(investigationId, { status: decision, notes: adminNotes }, token);
      }
      setInvestigations(prev => prev.filter(i => i.id !== investigationId));
      setAdminNotes('');
      alert(`Investigation resolved as: ${decision.replace('_', ' ')}.`);
    } catch (err) {
      alert(err.message || 'Resolution failed.');
    } finally {
      setResolvingId(null);
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
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={32} className="text-red-500" />
              <h2 className="text-2xl font-black">Radar Risk & Fraud Command Center</h2>
            </div>
            <p className="text-xs text-red-200">Real-time threat evaluation, automatic location profiling, and manual overrides for fraud investigations.</p>
          </div>
        </div>

        {/* Dynamic risk grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Manual Investigation Queue */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5"><Clock size={16} /> Manual Investigation Queue ({investigations.length})</h4>
              
              {investigations.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 italic flex flex-col items-center gap-2">
                  <ShieldCheck size={32} className="text-emerald-500" /> All clear! No accounts flagged in the risk audit backlog.
                </div>
              ) : (
                <div className="space-y-4">
                  {investigations.map(item => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{item.user?.name}</div>
                          <div className="text-xs text-gray-400">{item.user?.email}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">Trust Score: {item.user?.trust_score}/100</div>
                        </div>
                        <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1">
                          <AlertTriangle size={12} /> Flagged High Risk
                        </span>
                      </div>

                      <div className="p-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold text-gray-600">
                        {item.notes}
                      </div>

                      {/* Resolution note */}
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <textarea
                          placeholder="Provide audit logs override notes..."
                          rows={2}
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleResolve(item.id, 'resolved_safe')}
                            disabled={resolvingId === item.id}
                            className="bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700 text-[10px] font-black py-1.5 px-3 flex items-center gap-1"
                          >
                            <UserCheck size={12} /> Clear User (Safe)
                          </Button>
                          <Button
                            onClick={() => handleResolve(item.id, 'resolved_fraud')}
                            disabled={resolvingId === item.id}
                            className="bg-red-600 hover:bg-red-700 text-white border-transparent text-[10px] font-black py-1.5 px-3 flex items-center gap-1"
                          >
                            <UserX size={12} /> Restrict Account (Fraud)
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Left Flagged Threat Alert Stream */}
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
            <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5"><Activity size={16} /> Real-Time Risk Alerts</h4>
            
            <div className="space-y-3 divide-y divide-gray-100">
              {alerts.map(alert => (
                <div key={alert.id} className="pt-3 space-y-1 first:pt-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-900">{alert.type}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{alert.severity}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">{alert.desc}</p>
                  <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-1 font-bold">
                    <Clock size={10} /> {alert.time} • User: {alert.user}
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

export default AdminRiskDashboard;
