import { useState } from 'react'
import { AlertOctagon, CheckCircle } from 'lucide-react';
import Button from '../Button';

const AdminDisputes = ({ disputes, onResolveDispute }) => {
  const [resolveNotes, setResolveNotes] = useState({});
  const [resolveAmount, setResolveAmount] = useState({});

  const handleNoteChange = (id, value) => setResolveNotes(prev => ({ ...prev, [id]: value }));
  const handleAmountChange = (id, value) => setResolveAmount(prev => ({ ...prev, [id]: value }));

  const handleSubmit = (id, resolution) => {
    const notes = resolveNotes[id] || '';
    const amount = resolveAmount[id] || '';
    if (!notes) {
      alert("Please enter resolution notes before confirming.");
      return;
    }
    onResolveDispute(id, resolution, notes, amount);
  };

  if (disputes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Open Disputes</h3>
        <p className="text-gray-500">The community is happy and quiet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {disputes.map(d => (
        <div key={d.id} className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Info */}
          <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon size={20} className="text-red-500" />
              <h3 className="font-extrabold text-lg text-gray-900">{d.reason}</h3>
              <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                {d.status.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">Reported by: <strong className="text-gray-900">{d.reporter?.name}</strong></p>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 italic mb-4">
              "{d.description}"
            </div>
            
            {d.evidence_photos && d.evidence_photos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evidence Photos</p>
                <div className="flex gap-2">
                  {d.evidence_photos.map((photo, i) => (
                    <a key={i} href={photo} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden block hover:opacity-80 transition-opacity">
                      <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Resolution Area */}
          <div className="p-6 md:w-1/2 bg-gray-50/50 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resolve this dispute</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes (Required)</label>
                <textarea 
                  value={resolveNotes[d.id] || ''}
                  onChange={(e) => handleNoteChange(d.id, e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y h-20"
                  placeholder="Reasoning for decision..."
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Deduction / Refund Amount ($)</label>
                <input 
                  type="number" 
                  value={resolveAmount[d.id] || ''}
                  onChange={(e) => handleAmountChange(d.id, e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={() => handleSubmit(d.id, 'resolved_renter')} className="text-xs py-2 bg-green-600 hover:bg-green-700">
                Side with Renter
              </Button>
              <Button onClick={() => handleSubmit(d.id, 'resolved_owner')} className="text-xs py-2 bg-blue-600 hover:bg-blue-700">
                Side with Owner
              </Button>
              <Button onClick={() => handleSubmit(d.id, 'resolved_split')} variant="secondary" className="text-xs py-2 border-gray-300">
                Split Cost
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDisputes;
