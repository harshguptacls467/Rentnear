import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import AIChatbot from './AIChatbot';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

const Layout = () => {
  const { showToast } = useToast();

  useEffect(() => {
    // Subscribe to real-time additions of new products in public.products
    const channel = supabase
      .channel('public-products-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          const newProduct = payload.new;
          if (newProduct && newProduct.title) {
            showToast(
              `🎉 New rental listed nearby: "${newProduct.title}" is now available!`,
              'success'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* 4. APP FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8 mt-auto border-t-4 border-primary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">
              Rent<span className="text-primary">Near</span>
            </h2>
            <p className="max-w-sm text-sm text-gray-400 leading-relaxed">
              The premier neighborhood rental marketplace. Empowering communities to share more, spend less, and reduce waste.
            </p>
          </div>
          
          {/* Links Col 1 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products" className="hover:text-primary transition-colors">Browse Items</Link></li>
              <li><Link to="/list-product" className="hover:text-primary transition-colors">List an Item</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">How it Works</Link></li>
            </ul>
          </div>
          
          {/* Links Col 2 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/support#trust-safety" className="hover:text-primary transition-colors">Trust & Safety</Link></li>
              <li><Link to="/support#contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright Bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-sm text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} RentNear Marketplace. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating AI Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default Layout;
