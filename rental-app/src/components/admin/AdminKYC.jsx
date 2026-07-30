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
              <h3 className="text-lg font-bold text-gray-900">{kyc.user?.name || kyc.user_name || 'Applicant User'}</h3>
              <p className="text-sm text-gray-500">{kyc.user?.email || kyc.user_email || 'User'} &bull; <span className="font-semibold text-gray-700">{kyc.id_type || 'Government ID'}</span> {kyc.id_number ? `(${kyc.id_number})` : ''}</p>
            </div>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Government ID Document Photo</p>
            <a href={kyc.document_signed_url || kyc.front_signed_url} target="_blank" rel="noopener noreferrer">
              <img 
                src={kyc.document_signed_url || kyc.front_signed_url} 
                alt="Government ID Document" 
                className="w-full max-w-md h-64 object-cover rounded-2xl border border-gray-200 hover:opacity-95 transition-opacity shadow-sm" 
              />
            </a>
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
            <div className="flex flex-wrap gap-3">
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
              <Button 
                onClick={() => handleSubmit(kyc.id, 'resubmission_required')}
                variant="secondary"
                className="text-amber-700 border-amber-200 hover:bg-amber-50"
              >
                Request Re-upload
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminKYC;
