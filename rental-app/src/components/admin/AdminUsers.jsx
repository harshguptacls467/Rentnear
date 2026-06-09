import { CheckCircle, Ban } from 'lucide-react';
import Button from '../Button';

const AdminUsers = ({ users, onBanUser }) => {
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
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-900">
                  {u.name} {u.kyc_verified && <CheckCircle size={14} className="inline text-green-500 ml-1" />}
                </td>
                <td className="p-6 text-gray-500 text-sm">{u.email}</td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-bold uppercase tracking-wider">
                    {u.role}
                  </span>
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
                  <Button 
                    variant="secondary" 
                    className={`text-xs py-1.5 px-3 ${u.is_banned ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
                    onClick={() => onBanUser(u.id, u.is_banned)}
                  >
                    {u.is_banned ? 'Unban User' : 'Ban User'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
