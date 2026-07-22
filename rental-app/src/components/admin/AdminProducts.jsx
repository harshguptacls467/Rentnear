import { useState } from 'react';
import { Trash2, Package, Star, TrendingUp, Award, Edit, X, Save } from 'lucide-react';
import Button from '../Button';

const AdminProducts = ({ products, onRemoveProduct, onUpdateStatus, onToggleFeature, onUpdateProductDetails }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: '', is_featured: false, is_trending: false, is_premium: false });

  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title || '',
      status: product.status || 'active',
      is_featured: product.is_featured || false,
      is_trending: product.is_trending || false,
      is_premium: product.is_premium || false
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (onUpdateProductDetails) {
      await onUpdateProductDetails(editingProduct.id, editForm);
    } else if (onUpdateStatus) {
      // Fallback
      await onUpdateStatus(editingProduct.id, editForm.status);
    }
    setEditingProduct(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-6">Product Title</th>
              <th className="p-6">Owner</th>
              <th className="p-6">Status</th>
              <th className="p-6">Badges / Highlights</th>
              <th className="p-6">Created</th>
              <th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Package size={36} className="opacity-40" />
                    <p className="font-semibold text-sm">No products found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-bold text-gray-900">{p.title}</td>
                  <td className="p-6 text-gray-500 text-sm">{p.owner?.name || 'Unknown'}</td>
                  <td className="p-6">
                    <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                      p.status === 'active' ? 'bg-green-50 text-green-700 border border-green-150' :
                      p.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                      p.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-150' :
                      'bg-gray-50 text-gray-700 border border-gray-150'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onToggleFeature && onToggleFeature(p.id, 'is_featured', p.is_featured)}
                        className={`p-1.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${
                          p.is_featured ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star size={12} /> Feat
                      </button>
                      <button 
                        onClick={() => onToggleFeature && onToggleFeature(p.id, 'is_trending', p.is_trending)}
                        className={`p-1.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${
                          p.is_trending ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}
                        title="Toggle Trending"
                      >
                        <TrendingUp size={12} /> Trend
                      </button>
                      <button 
                        onClick={() => onToggleFeature && onToggleFeature(p.id, 'is_premium', p.is_premium)}
                        className={`p-1.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${
                          p.is_premium ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}
                        title="Toggle Premium"
                      >
                        <Award size={12} /> Prem
                      </button>
                    </div>
                  </td>
                  <td className="p-6 text-gray-500 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        variant="secondary" 
                        className="text-xs py-1.5 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => handleStartEdit(p)}
                      >
                        <Edit size={12} className="inline mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="text-xs py-1.5 px-3 text-red-600 border-red-200"
                        onClick={() => onRemoveProduct(p.id)}
                      >
                        <Trash2 size={14} className="inline mr-1" /> Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal Overlay */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Edit Listing</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Listing Title</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Moderation Status</label>
                <select 
                  value={editForm.status} 
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active (Approved)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                  <option value="hidden">Hidden (Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Badges & Highlights</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditForm({ ...editForm, is_featured: !editForm.is_featured })}
                    className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold uppercase transition-all ${
                      editForm.is_featured ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <Star size={16} /> Featured
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditForm({ ...editForm, is_trending: !editForm.is_trending })}
                    className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold uppercase transition-all ${
                      editForm.is_trending ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <TrendingUp size={16} /> Trending
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditForm({ ...editForm, is_premium: !editForm.is_premium })}
                    className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold uppercase transition-all ${
                      editForm.is_premium ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <Award size={16} /> Premium
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 py-3"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="primary" 
                  className="flex-1 py-3 bg-primary text-white flex items-center justify-center gap-1.5"
                >
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
