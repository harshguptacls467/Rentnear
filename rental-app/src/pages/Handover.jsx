import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { KeyRound, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config/api';

const Handover = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Owner States
  const [otpCode, setOtpCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Renter States
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);

  // Fetch Booking Details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select('*, product:products(title, images), renter:users!bookings_renter_id_fkey(name), owner:users!bookings_owner_id_fkey(name)')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        setBooking(data);
      } catch {
        setError('Failed to load handover details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();

    // Set up Realtime listener to detect when status changes to 'active' instantly
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new.status === 'active') {
            setBooking((prev) => ({ ...prev, status: 'active' }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Countdown Timer Logic
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const distance = expiration - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(0);
        setOtpCode(null); // Force regenerate
      } else {
        setTimeLeft(Math.floor(distance / 1000)); // seconds
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isOwner = booking?.owner_id === user?.id;
  const isRenter = booking?.renter_id === user?.id;

  // --- OWNER LOGIC ---
  const handleGenerateOtp = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${API_URL}/bookings/${id}/generate-otp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setOtpCode(data.otp);
      setExpiresAt(data.expires_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENTER LOGIC ---
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1); // Only allow 1 char
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...enteredOtp];
    newOtp[index] = value;
    setEnteredOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = enteredOtp.join('');
    if (code.length !== 6) return setError('Please enter all 6 digits.');

    try {
      setVerifying(true);
      setError('');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${API_URL}/bookings/${id}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ otp: code })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Success! Realtime listener will catch the status change, 
      // but we can proactively set it too just in case.
      setBooking({ ...booking, status: 'active' });

    } catch (err) {
      setError(err.message);
      setEnteredOtp(['', '', '', '', '', '']); // clear on failure
      document.getElementById('otp-input-0')?.focus();
    } finally {
      setVerifying(false);
    }
  };


  if (loading && !booking) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen pt-20 text-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Oops! {error}</h2>
      </div>
    );
  }

  // Formatting timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        
        {/* Header Banner */}
        <div className={`p-6 text-center ${booking.status === 'active' ? 'bg-green-500' : 'bg-navy'}`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            {booking.status === 'active' ? (
              <CheckCircle2 size={32} className="text-white" />
            ) : (
              <KeyRound size={32} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">
            {booking.status === 'active' ? 'Handover Complete' : 'Secure Handover'}
          </h1>
          <p className="text-white/80 text-sm">
            {booking.product?.title}
          </p>
        </div>

        <div className="p-8">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start animate-fade-in-up">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {booking.status === 'active' ? (
            // SUCCESS STATE FOR BOTH
            <div className="text-center animate-fade-in-up">
              <p className="text-gray-600 mb-6">
                The secure handover has been successfully verified! Before you begin using the item, please complete the mandatory Condition Check.
              </p>
              <Button onClick={() => navigate(`/bookings/${booking.id}/condition`)} className="w-full">
                Proceed to Condition Check
              </Button>
            </div>
          ) : (
            <>
              {/* --- OWNER VIEW --- */}
              {isOwner && (
                <div className="text-center animate-fade-in-up">
                  <p className="text-sm text-gray-500 mb-6">
                    You are handing this item over to <strong>{booking.renter?.name}</strong>. Generate a code and ask them to type it into their app to verify the exchange.
                  </p>
                  
                  {otpCode ? (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Verification Code</p>
                      <div className="text-5xl font-black text-gray-900 tracking-[0.2em] mb-4 font-mono">
                        {otpCode}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-red-500">
                        <Clock size={16} /> 
                        Expires in {minutes}:{seconds.toString().padStart(2, '0')}
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleGenerateOtp} disabled={loading} className="w-full py-4 text-lg">
                      {loading ? 'Generating...' : 'Generate Handover Code'}
                    </Button>
                  )}
                </div>
              )}

              {/* --- RENTER VIEW --- */}
              {isRenter && (
                <div className="text-center animate-fade-in-up">
                  <p className="text-sm text-gray-500 mb-6">
                    You are receiving this item from <strong>{booking.owner?.name}</strong>. Ask them to generate a handover code on their app and enter it below.
                  </p>
                  
                  <div className="flex justify-center gap-2 mb-8">
                    {enteredOtp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-black bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    ))}
                  </div>

                  <Button 
                    onClick={handleVerifyOtp} 
                    disabled={verifying || enteredOtp.join('').length !== 6} 
                    className="w-full py-4 text-lg"
                  >
                    {verifying ? 'Verifying...' : 'Verify & Accept Item'}
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Handover;
