import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, MapPin, Inbox, Filter } from 'lucide-react';
import Input from '../components/Input';
import Select from '../components/Select';

const CATEGORIES = ['All', 'Cameras', 'Tools', 'Bikes', 'Electronics', 'Books', 'Speakers', 'Gaming', 'Sports', 'Other'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  // Note: 'nearest' would require browser geolocation and PostGIS/RPC. We will default to Newest.
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // DEBOUNCE EFFECT: Wait 400ms after the user stops typing to update `debouncedQuery`
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    // Cleanup function: If the user types again BEFORE 400ms, the previous timer is cancelled
    return () => clearTimeout(handler);
  }, [searchQuery]);


  // DATA FETCHING EFFECT: Triggers whenever debouncedQuery, category, or sortBy changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');

      try {
        // Start building the Supabase query
        let query = supabase.from('products').select('*');

        // 1. Filter by Category (Server-Side)
        if (category !== 'All') {
          query = query.eq('category', category);
        }

        // 2. Filter by Search Query (Server-Side using text search)
        if (debouncedQuery.trim() !== '') {
          // ilike is case-insensitive pattern matching in Postgres
          query = query.ilike('title', `%${debouncedQuery}%`);
        }

        // 3. Sort Results (Server-Side)
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'price_asc') {
          query = query.order('price_per_day', { ascending: true });
        } else if (sortBy === 'price_desc') {
          query = query.order('price_per_day', { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setProducts(data || []);

      } catch (err) {
        setError('Failed to fetch products. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedQuery, category, sortBy]);


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Discover Gear</h1>
            <p className="text-gray-500 mt-2">Find exactly what you need, exactly when you need it.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="w-full sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input 
                placeholder="Search rentals..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10" // Make room for the absolute icon
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select 
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-8 hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
                category === cat 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium mb-8">
            {error}
          </div>
        )}

        {/* Loading State (Skeletons) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between items-end mt-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm mt-8">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Inbox size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find any items matching your current filters or search query. Try adjusting your search!
            </p>
            <button 
              onClick={() => { setCategory('All'); setSearchQuery(''); }}
              className="mt-6 text-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => {
              const image = product.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image';
              return (
                <Link key={product.id} to={`/products/${product.id}`} className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  
                  {/* Image Container */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                    <img 
                      src={image} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {!product.is_available && (
                      <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                        Rented
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{product.category}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.title}</h3>
                    
                    {/* Location Mock */}
                    <div className="flex items-center text-gray-400 text-xs mt-1 mb-4">
                      <MapPin size={12} className="mr-1" />
                      <span>{product.location || 'Local Area'}</span>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">${product.price_per_day}</span>
                        <span className="text-xs text-gray-500 font-medium">/day</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
