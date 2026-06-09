import { useState } from 'react'
import { FileCheck } from 'lucide-react';
import Button from '../Button';

const AdminKYC = ({ kycSubmissions, onResolveKyc }) => {
  const [adminNotes, setAdminNotes] = useState({});

  const handleNoteChange = (id, value) => setAdminNotes(prev => ({ ...prev, [id]: value }));

  const handleSubmit = (id, status) => {
    const note = adminNotes[id] || '';
    if (status === 'rejected' && !note) {
      alert('Please provide a reason for rejection in the admin notes.');
      return;
    }
    onResolveKyc(id, status, note);
  };

  if (kycSubmissions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
        <FileCheck size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900">No Pending KYCs</h3>
        <p className="text-gray-500 mt-2">All identity verifications have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {kycSubmissions.map((kyc) => (
        <div key={kyc.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{kyc.user.name}</h3>
              <p className="text-sm text-gray-500">{kyc.user.email} &bull; ID Type: {kyc.id_type}</p>
            </div>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">ID Front</p>
              <a href={kyc.front_signed_url} target="_blank" rel="noopener noreferrer">
                <img src={kyc.front_signed_url} alt="ID Front" className="w-full h-48 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
              </a>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">ID Back</p>
              <a href={kyc.back_signed_url} target="_blank" rel="noopener noreferrer">
                <img src={kyc.back_signed_url} alt="ID Back" className="w-full h-48 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
              </a>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Selfie</p>
              <a href={kyc.selfie_signed_url} target="_blank" rel="noopener noreferrer">
                <img src={kyc.selfie_signed_url} alt="Selfie" className="w-full h-48 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
              </a>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes (Required for rejection)</label>
            <input 
              type="text" 
              placeholder="Reason for rejection or internal notes..."
              className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
              value={adminNotes[kyc.id] || ''}
              onChange={(e) => handleNoteChange(kyc.id, e.target.value)}
            />
            <div className="flex gap-3">
              <Button 
                onClick={() => handleSubmit(kyc.id, 'approved')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve Identity
              </Button>
              <Button 
                onClick={() => handleSubmit(kyc.id, 'rejected')}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminKYC;
