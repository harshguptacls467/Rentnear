import { CheckCircle, Ban, Users, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import Button from '../Button';

const AdminUsers = ({ users, onBanUser, onChangeRole, onApproveAdmin }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-6">Name</th>
              <th className="p-6">Email</th>
              <th className="p-6">Role</th>
              <th className="p-6">Joined</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Users size={36} className="opacity-40" />
                    <p className="font-semibold text-sm">No users found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-bold text-gray-900">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.kyc_verified && <CheckCircle size={14} className="text-green-500" />}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {u.is_admin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150">
                            <ShieldCheck size={10} /> ADMIN
                          </span>
                        )}
                        {u.admin_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-150">
                            <ShieldAlert size={10} /> PENDING ADMIN
                          </span>
                        )}
                        {u.admin_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-150">
                            <Shield size={10} /> ADMIN REJECTED
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-gray-500 text-sm">{u.email}</td>
                  <td className="p-6">
                    <select 
                      value={u.role} 
                      onChange={(e) => onChangeRole && onChangeRole(u.id, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl font-bold uppercase py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="renter">Renter</option>
                      <option value="owner">Owner</option>
                      <option value="both">Both</option>
                    </select>
                  </td>
                  <td className="p-6 text-gray-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-6">
                    {u.is_banned ? (
                      <span className="text-red-600 font-bold text-sm flex items-center gap-1"><Ban size={14} /> Banned</span>
                    ) : (
                      <span className="text-green-600 font-bold text-sm flex items-center gap-1"><CheckCircle size={14} /> Active</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* Admin Request Approvals */}
                      {u.admin_status === 'pending' && onApproveAdmin && (
                        <>
                          <Button 
                            variant="secondary" 
                            className="text-xs py-1.5 px-3 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => onApproveAdmin(u.id, true)}
                          >
                            Approve Admin
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="text-xs py-1.5 px-3 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => onApproveAdmin(u.id, false)}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {u.is_admin && u.admin_status === 'approved' && onApproveAdmin && (
                        <Button 
                          variant="secondary" 
                          className="text-xs py-1.5 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => onApproveAdmin(u.id, false)}
                        >
                          Revoke Admin
                        </Button>
                      )}

                      <Button 
                        variant="secondary" 
                        className={`text-xs py-1.5 px-3 ${u.is_banned ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
                        onClick={() => onBanUser(u.id, u.is_banned)}
                      >
                        {u.is_banned ? 'Unban User' : 'Ban User'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
