import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { CreditCard, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Mock Card State
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/26');
  const [cvv, setCvv] = useState('123');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select('*, product:products(title, images)')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        setBooking(data);
      } catch {
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Create order on backend
      const res = await fetch(`${API_URL}/bookings/${id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const orderData = await res.json();
      
      if (orderData.mock_success) {
        // Fallback if Razorpay keys are missing on backend
        navigate('/bookings?payment=success');
        return;
      }

      if (!res.ok) throw new Error(orderData.message || 'Failed to initialize payment');

      // 2. Load Razorpay SDK
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "RentNear",
        description: `Rental: ${orderData.booking?.product?.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // 4. Verify payment on backend
            const verifyRes = await fetch(`${API_URL}/bookings/${id}/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message);
            
            navigate('/bookings?payment=success');
          } catch (err) {
            setError(err.message || 'Payment verification failed.');
            setProcessing(false);
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#4F46E5"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        setError(`Payment Failed: ${response.error.description}`);
        setProcessing(false);
      });
      
      rzp1.open();

    } catch (err) {
      setError(err.message || 'Payment failed.');
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

  if (error && !booking) {
    return <div className="text-center pt-20 text-red-500">{error}</div>;
  }

  const rentalFee = Number(booking.total_amount) - Number(booking.deposit_amount);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Form */}
        <div className="flex-1">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl flex gap-3 shadow-sm">
            <AlertTriangle className="text-yellow-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-800 text-sm">DEMO MODE ACTIVE</h3>
              <p className="text-xs text-yellow-700 mt-1">
                No real payment will be processed. This is a simulation using a test card.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="text-primary" /> Payment Details
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handlePay} className="space-y-6">
              <div className="text-center py-6 text-gray-500">
                <p>You will be securely redirected to Razorpay to complete your payment.</p>
                <p className="mt-2 text-sm">The total amount includes the rental fee and a refundable security deposit.</p>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={processing} 
                  className="w-full py-4 text-lg flex items-center justify-center gap-2 shadow-xl"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={18} /> Proceed to Secure Checkout
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:w-80">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Order Summary</h3>
            
            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
              <img src={booking.product?.images[0]} alt="product" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
              <div>
                <p className="font-bold text-gray-900 line-clamp-2 leading-tight">{booking.product?.title}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Rental Fee</span>
                <span className="font-medium text-gray-900">${rentalFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><ShieldAlert size={14}/> Refundable Deposit</span>
                <span className="font-medium text-gray-900">${Number(booking.deposit_amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-3xl font-black text-primary">${Number(booking.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Payment;
