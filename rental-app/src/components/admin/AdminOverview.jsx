import { Users, Package, Clock, AlertOctagon } from 'lucide-react';

const AdminOverview = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
          <Users size={28} />
        </div>
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Users</p>
          <p className="text-3xl font-black text-gray-900">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
          <Package size={28} />
        </div>
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Products</p>
          <p className="text-3xl font-black text-gray-900">{stats.totalProducts}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
          <Clock size={28} />
        </div>
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Bookings Today</p>
          <p className="text-3xl font-black text-gray-900">{stats.bookingsToday}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
          <AlertOctagon size={28} />
        </div>
        <div>
          <p className="text-red-500 text-sm font-bold uppercase tracking-wider">Open Disputes</p>
          <p className="text-3xl font-black text-red-600">{stats.openDisputes}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
