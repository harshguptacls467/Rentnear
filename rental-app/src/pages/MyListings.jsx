import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Edit, Trash2, Power, AlertCircle, Package } from 'lucide-react';
import { MOCK_MY_LISTINGS } from '../data/mockData';
import { getLocalProducts, saveLocalProducts } from '../utils/localDb';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const MyListings = () => {
  const { user, isMock } = useAuthStore();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for Delete Modal
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isMock) {
          const allProducts = getLocalProducts();
          const myProducts = allProducts.filter(p => p.owner_id === user.id);
          setProducts(myProducts);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          const isDemoUser = user?.email === 'demo@rentnear.app';
          setProducts(isDemoUser ? MOCK_MY_LISTINGS : []);
        }
      } catch (err) {
        const isDemoUser = user?.email === 'demo@rentnear.app';
        setProducts(isDemoUser ? MOCK_MY_LISTINGS : []);
        setError(err.message);
        console.warn('Using mock listings:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMyListings();
    else {
      setProducts([]);
      setLoading(false);
    }
  }, [user, isMock]);

  // Handle Availability Toggle (Optimistic UI Update)
  const toggleAvailability = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    setProducts(currentProducts => 
      currentProducts.map(p => p.id === productId ? { ...p, is_available: newStatus } : p)
    );

    if (isMock) {
      const allProducts = getLocalProducts();
      const updated = allProducts.map(p => p.id === productId ? { ...p, is_available: newStatus } : p);
      saveLocalProducts(updated);
      return;
    }

    // 2. Perform the actual backend/database update
    const { error } = await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', productId)
      .eq('owner_id', user.id); // Security check

    // 3. Rollback if the server fails
    if (error) {
      alert("Failed to update status. Reverting changes.");
      setProducts(currentProducts => 
        currentProducts.map(p => p.id === productId ? { ...p, is_available: currentStatus } : p)
      );
    }
  };

  // Handle Delete execution
  const executeDelete = async () => {
    if (!productToDelete) return;
    
    // Optimistic Update: Remove from UI instantly
    const idToRemove = productToDelete;
    setProductToDelete(null);
    setProducts(current => current.filter(p => p.id !== idToRemove));

    if (isMock) {
      const allProducts = getLocalProducts();
      const updated = allProducts.filter(p => p.id !== idToRemove);
      saveLocalProducts(updated);
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', idToRemove)
      .eq('owner_id', user.id); // Security check

    if (error) {
      alert("Failed to delete product.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Listings</h1>
            <p className="text-gray-500 mt-2">Manage your inventory, prices, and availability.</p>
          </div>
          <Button onClick={() => navigate('/list-product')} className="flex items-center gap-2">
            <Package size={18} /> Add New Item
          </Button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-xl flex items-start text-red-600 font-medium">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm mt-8">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              You haven't listed any items for rent. Start earning passive income today!
            </p>
            <Button onClick={() => navigate('/list-product')}>Create your first listing</Button>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {products.map(product => (
              <motion.div variants={fadeUp} key={product.id} className="h-full">
                <TiltCard scaleOnHover={1.02}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 h-full">
                
                {/* Image & Badge */}
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'} 
                    alt={product.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                      product.is_available ? 'bg-green-500/90 text-white' : 'bg-gray-800/90 text-white'
                    }`}>
                      {product.is_available ? 'Available' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{product.title}</h3>
                  <p className="text-lg font-black text-primary mb-4">${product.price_per_day} <span className="text-xs text-gray-500 font-medium">/ day</span></p>
                  
                  {/* Actions Container pushes to bottom */}
                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                    <button 
                      onClick={() => navigate(`/list-product/${product.id}`)}
                      className="flex flex-col items-center justify-center py-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={18} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase">Edit</span>
                    </button>
                    
                    <button 
                      onClick={() => toggleAvailability(product.id, product.is_available)}
                      className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors ${
                        product.is_available 
                          ? 'text-gray-500 hover:text-orange-500 hover:bg-orange-50' 
                          : 'text-green-600 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <Power size={18} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase">{product.is_available ? 'Pause' : 'Activate'}</span>
                    </button>
                    
                    <button 
                      onClick={() => setProductToDelete(product.id)}
                      className="flex flex-col items-center justify-center py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
              </TiltCard>
            </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete this listing?</h3>
            <p className="text-center text-gray-500 text-sm mb-8">This action cannot be undone. All photos and booking history for this item will be lost.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" onClick={() => setProductToDelete(null)}>Cancel</Button>
              <button 
                onClick={executeDelete}
                className="bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </AnimatedPage>
  );
};

export default MyListings;
