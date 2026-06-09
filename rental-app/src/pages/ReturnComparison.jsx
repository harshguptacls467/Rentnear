import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Check, X, ShieldAlert, BadgeDollarSign, ArrowRightLeft, Clock, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config/api';

const CheckColumn = ({ title, checkData, badgeColor }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex-1">
    <div className={`p-4 text-center font-bold text-white uppercase tracking-wider text-sm ${badgeColor}`}>
      {title}
    </div>
    
    {!checkData ? (
      <div className="p-12 text-center text-gray-400">
        <Clock size={48} className="mx-auto mb-4 opacity-50" />
        <p>Awaiting submission...</p>
      </div>
    ) : (
      <div className="p-6">
        {/* Photos grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {checkData.photos.slice(0, 4).map((photo, i) => (
            <a key={i} href={photo} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-100 block hover:opacity-80 transition-opacity">
              <img src={photo} alt="condition" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
        
        {/* Checklist */}
        <div className="space-y-2 mb-6">
          {Object.entries(checkData.checklist).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600 truncate mr-2">{key.replace('_', ' ')}</span>
              {value ? <Check size={16} className="text-green-500 flex-shrink-0" /> : <X size={16} className="text-red-500 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Notes */}
        {checkData.notes && (
          <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <span className="font-bold block mb-1">Notes:</span>
            {checkData.notes}
          </div>
        )}
      </div>
    )}
  </div>
);

const ReturnComparison = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [preCheck, setPreCheck] = useState(null);
  const [postCheck, setPostCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: bookingData, error: dbError } = await supabase
          .from('bookings')
          .select('*, product:products(title, category)')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        setBooking(bookingData);

        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${API_URL}/bookings/${id}/condition-compare`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        const comparisonData = await res.json();
        if (!res.ok) throw new Error(comparisonData.message);

        setPreCheck(comparisonData.pre_rental);
        setPostCheck(comparisonData.post_return);

      } catch {
        setError('Failed to load comparison data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDecision = async (action) => {
    if (action === 'dispute' && !window.confirm("Are you sure you want to report damage? This will open a formal dispute.")) return;
    if (action === 'release' && !window.confirm("Are you sure you want to release the deposit? This completes the rental.")) return;

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${API_URL}/bookings/${id}/process-return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      navigate('/bookings');

    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !booking) {
    return <div className="text-center pt-20 text-red-500">{error}</div>;
  }

  const isOwner = booking.owner_id === user?.id;
  const isRenter = booking.renter_id === user?.id;
  const isComplete = booking.status === 'completed' || booking.status === 'disputed';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-4">
            Return Comparison <ArrowRightLeft className="text-gray-400" />
          </h1>
          <p className="text-gray-500 mt-2">Review the condition of <strong>{booking.product?.title}</strong> before and after the rental.</p>
        </div>

        {/* Status Banners */}
        {isRenter && !isComplete && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-center mb-8 font-medium shadow-sm">
            Awaiting Owner Confirmation. The deposit will auto-release in 48 hours if no action is taken.
          </div>
        )}
        
        {booking.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center mb-8 font-medium shadow-sm flex items-center justify-center gap-2">
            <BadgeDollarSign /> Deposit Released - Rental Completed!
          </div>
        )}

        {booking.status === 'disputed' && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-center mb-8 font-medium shadow-sm flex items-center justify-center gap-2">
            <ShieldAlert /> Return Disputed - Awaiting Support Team Mediation.
          </div>
        )}

        {/* Comparison Views */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <CheckColumn title="Pre-Rental Condition" checkData={preCheck} badgeColor="bg-gray-800" />
          <CheckColumn title="Post-Return Condition" checkData={postCheck} badgeColor="bg-blue-600" />
        </div>

        {/* Owner Action Buttons */}
        {isOwner && !isComplete && postCheck && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Final Return Decision</h3>
            <p className="text-gray-500 mb-6">Review the photos carefully. Does the item match the original condition?</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => handleDecision('release')} 
                disabled={processing}
                className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 shadow-green-500/30 flex items-center justify-center gap-2 text-lg"
              >
                <CheckCircle2 size={20} /> Release Deposit
              </Button>
              <Button 
                variant="secondary"
                onClick={() => navigate(`/bookings/${id}/dispute-form`)} 
                className="w-full sm:w-auto px-8 py-4 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 text-lg"
              >
                <ShieldAlert size={20} /> Report Damage
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReturnComparison;
