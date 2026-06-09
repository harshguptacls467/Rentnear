import { Trash2 } from 'lucide-react';
import Button from '../Button';

const AdminProducts = ({ products, onRemoveProduct }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-6">Product Title</th>
              <th className="p-6">Owner</th>
              <th className="p-6">Status</th>
              <th className="p-6">Created</th>
              <th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-900">{p.title}</td>
                <td className="p-6 text-gray-500 text-sm">{p.owner?.name}</td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-bold uppercase tracking-wider">
                    {p.status}
                  </span>
                </td>
                <td className="p-6 text-gray-500 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-6 text-right">
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1.5 px-3 text-red-600 border-red-200"
                    onClick={() => onRemoveProduct(p.id)}
                  >
                    <Trash2 size={14} className="inline mr-1" /> Remove
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

export default AdminProducts;
