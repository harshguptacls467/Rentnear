import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { Printer, ArrowLeft, ShieldCheck, Mail, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        if (!isMock) {
          const { data, error: fetchError } = await supabase
            .from('bookings')
            .select(`
              *,
              product:products(*),
              renter:users!bookings_renter_id_fkey(name, email),
              owner:users!bookings_owner_id_fkey(name, email)
            `)
            .eq('id', id)
            .single();

          if (fetchError || !data) throw fetchError || new Error('Booking not found');
          setBooking(data);
        } else {
          // Mock data fallback
          const localBookings = JSON.parse(localStorage.getItem('rentnear_local_bookings') || '[]');
          const found = localBookings.find(b => b.id === id);
          if (found) {
            const allLocalProds = JSON.parse(localStorage.getItem('rentnear_local_products') || '[]');
            const prod = allLocalProds.find(p => p.id === found.product_id) || { title: 'Camera kit' };
            setBooking({
              ...found,
              product: prod,
              renter: { name: user?.name || 'Renter', email: user?.email || 'renter@demo.app' },
              owner: { name: 'Jane Doe', email: 'owner@demo.app' }
            });
          } else {
            throw new Error('Mock booking not found');
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch invoice details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id, isMock, user]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-20 text-center bg-gray-50">
        <h2 className="text-xl font-bold text-red-500">Error: {error}</h2>
        <Button className="mt-4" onClick={() => navigate('/bookings')}>Back to Bookings</Button>
      </div>
    );
  }

  const days = Math.max(1, Math.ceil(Math.abs(new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)));
  const rentalTotal = (booking.product?.price_per_day || 15) * days;
  const deposit = booking.deposit_amount || 30;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 print:bg-white print:py-0">
      
      {/* Back button and Print utility controls - hidden during native prints */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy"
        >
          <ArrowLeft size={16} /> Back to Bookings
        </button>
        
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-navy-light"
        >
          <Printer size={16} /> Print or Save PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm print:border-0 print:shadow-none print:p-0">
        
        {/* Brand Banner */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-primary text-xl font-black tracking-tight">
              RentNear <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Peer-to-Peer Escrow Receipt</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black text-navy uppercase tracking-widest flex items-center gap-1.5 justify-end">
              <FileText size={18} className="text-primary" /> Invoice
            </h2>
            <p className="text-xs text-gray-550 font-bold mt-1 font-mono">Invoice #{booking.id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>

        {/* Invoice Grid Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Billed To</h4>
            <p className="font-extrabold text-navy text-sm">{booking.renter?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{booking.renter?.email}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fulfilled By</h4>
            <p className="font-extrabold text-navy text-sm">{booking.owner?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{booking.owner?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-gray-100 pt-6">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Details</h4>
            <div className="space-y-1 text-xs text-gray-550">
              <p className="flex items-center gap-1.5"><Calendar size={13}/> Start: {new Date(booking.start_date).toLocaleDateString()}</p>
              <p className="flex items-center gap-1.5"><Calendar size={13}/> Return: {new Date(booking.end_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Status</h4>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-full border border-green-200 w-fit">
              <CheckCircle2 size={13} /> Fully Paid & Verified
            </div>
          </div>
        </div>

        {/* Invoice Table Line Items */}
        <div className="border border-gray-150 rounded-2xl overflow-hidden mb-8 mt-10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="p-4">Item Description</th>
                <th className="p-4 text-center">Days</th>
                <th className="p-4 text-right">Daily Rate</th>
                <th className="p-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              <tr>
                <td className="p-4 font-bold text-gray-900">{booking.product?.title || 'Gear Listing'}</td>
                <td className="p-4 text-center font-bold text-gray-600">{days}</td>
                <td className="p-4 text-right text-gray-900 font-bold">${booking.product?.price_per_day || 15}</td>
                <td className="p-4 text-right font-black text-navy">${rentalTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-gray-900 flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary"/> Escrow Security Deposit (Refundable)</td>
                <td className="p-4 text-center text-gray-500">-</td>
                <td className="p-4 text-right text-gray-500">-</td>
                <td className="p-4 text-right font-black text-navy">${Number(deposit).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Invoice Total */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-3 text-xs text-gray-550">
            <div className="flex justify-between">
              <span>Rental Charges</span>
              <span className="font-bold text-navy">${rentalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Escrow Hold</span>
              <span className="font-bold text-navy">${Number(deposit).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-black text-navy">
              <span>Total Invoice Amount</span>
              <span className="text-primary">${(rentalTotal + Number(deposit)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Disclaimer Footer */}
        <div className="border-t border-gray-100 pt-8 mt-12 text-center text-[10px] text-gray-400 leading-relaxed italic">
          Thank you for renting with RentNear! Renting locally preserves natural resources and supports local communities. This invoice serves as a receipt of authorization for billing transfers securely processed under escrow.
        </div>

      </div>
    </div>
  );
};

export default Invoice;
