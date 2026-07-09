import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Calendar, Package, AlertCircle, CheckCircle2, XCircle, SearchX, MessageSquare, Star, ShieldAlert, Radio } from 'lucide-react';
import ReviewForm from '../components/ReviewForm';
import EmptyState from '../components/EmptyState';
import { API_URL } from '../config/api';
import { MOCK_BOOKINGS } from '../data/mockData';
import useRealtimeBookings from '../hooks/useRealtimeBookings';

import { getLocalBookings, saveLocalBookings } from '../utils/localDb';

const Bookings = () => {
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
  
  // High-level View Mode ('renter' or 'owner')
  const [viewMode, setViewMode] = useState(user?.role === 'owner' ? 'owner' : 'renter');
  
  // Tabs for Renter View
  const [renterTab, setRenterTab] = useState('pending'); // pending, active, past, cancelled

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isMock) {
        const localBookings = getLocalBookings();
        const myBookings = localBookings.filter(b => b.renter_id === user?.id || b.owner_id === user?.id);
        setBookings(myBookings);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) throw new Error('no session');

      const res = await fetch(`${API_URL}/bookings/my`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
      
      if (data.length > 0) {
        setBookings(data);
      } else {
        const isDemoUser = user?.email === 'demo@rentnear.app';
        setBookings(isDemoUser ? MOCK_BOOKINGS : []);
      }
    } catch (err) {
      const isDemoUser = user?.email === 'demo@rentnear.app';
      setBookings(isDemoUser ? MOCK_BOOKINGS : []);
      setError(err.message);
      console.warn('Using mock bookings:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isMock]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchBookings();
    });
  }, [fetchBookings]);

  // Real-time booking updates — patches state on status change
  useRealtimeBookings(setBookings, user, isMock);

  const updateBookingStatus = async (bookingId, newStatus, reason = '') => {
    try {
      if (isMock) {
        const localBookings = getLocalBookings();
        const updated = localBookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
        saveLocalBookings(updated);
        const myBookings = updated.filter(b => b.renter_id === user?.id || b.owner_id === user?.id);
        setBookings(myBookings);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (reason) {
         console.log(`Rejecting because: ${reason}`);
      }

      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }

      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = (id) => updateBookingStatus(id, 'approved');
  
  const handleReject = (id) => {
    const reason = window.prompt("Why are you rejecting this request? (Optional)");
    if (reason !== null) { // User didn't click Cancel
      updateBookingStatus(id, 'rejected', reason);
    }
  };

  const handleCancel = (id) => {
    if (window.confirm("Are you sure you want to cancel this booking request?")) {
      updateBookingStatus(id, 'cancelled');
    }
  };

  // derived state
  const myRenterBookings = bookings.filter(b => b.renter_id === user?.id);
  const myOwnerBookings = bookings.filter(b => b.owner_id === user?.id);

  // Filter renter bookings based on active tab
  const getFilteredRenterBookings = () => {
    switch (renterTab) {
      case 'pending':
        return myRenterBookings.filter(b => b.status === 'pending');
      case 'active':
        return myRenterBookings.filter(b => b.status === 'approved' || b.status === 'active');
      case 'past':
        return myRenterBookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return myRenterBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected');
      default:
        return myRenterBookings;
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      disputed: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header & Role Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-900">Manage Bookings</h1>
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <Radio size={10} className="animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-gray-500 mt-1">Keep track of what you're renting and listing.</p>
          </div>
          
          {/* Only show the switcher if their role is 'both', or if we just want to let everyone toggle for demo purposes */}
          {(user?.role === 'both' || user?.role === 'owner' || user?.role === 'renter') && (
            <div className="flex bg-gray-200 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setViewMode('renter')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'renter' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                As a Renter
              </button>
              {(user?.role === 'both' || user?.role === 'owner') && (
                <button 
                  onClick={() => setViewMode('owner')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'owner' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  As an Owner
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* ----------------- RENTER VIEW ----------------- */}
        {viewMode === 'renter' && (
          <div>
            {/* Renter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {['pending', 'active', 'past', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setRenterTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-colors ${
                    renterTab === tab ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Renter Bookings List */}
            <div className="space-y-4">
              {getFilteredRenterBookings().length === 0 ? (
                <EmptyState 
                  icon={SearchX}
                  title={`No ${renterTab} bookings found`}
                  message="You don't have any bookings in this category right now."
                  actionLabel="Browse Products"
                  onAction={() => navigate('/products')}
                />
              ) : (
                getFilteredRenterBookings().map((booking) => (
                  <div key={booking.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                    
                    {/* Product Image */}
                    <div className="w-full sm:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={booking.product?.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'} 
                        alt={booking.product?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Booking Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-extrabold text-gray-900">{booking.product?.title || 'Unknown Product'}</h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                          <Calendar size={14} /> 
                          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold text-gray-900">Total: ${booking.total_amount}</p>
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <Button variant="secondary" onClick={() => navigate(`/chat/${booking.id}`)} className="text-sm py-2 px-3 flex items-center justify-center border-gray-200 text-gray-600 hover:text-primary">
                          <MessageSquare size={18} />
                        </Button>
                        {booking.status === 'pending' && (
                          <Button variant="secondary" onClick={() => handleCancel(booking.id)} className="text-sm py-2">
                            Cancel Request
                          </Button>
                        )}
                        {booking.status === 'approved' && (
                          <Button onClick={() => navigate(`/bookings/${booking.id}/pay`)} className="text-sm py-2 bg-green-500 hover:bg-green-600">
                            Pay Now
                          </Button>
                        )}
                        {booking.status === 'awaiting_handover' && (
                          <Button onClick={() => navigate(`/bookings/${booking.id}/handover`)} className="text-sm py-2 bg-primary">
                            Verify Handover
                          </Button>
                        )}
                        {booking.status === 'active' && (
                          <div className="flex flex-col gap-2">
                            <Button onClick={() => navigate(`/bookings/${booking.id}/return`)} className="text-sm py-2 bg-blue-600 hover:bg-blue-700">
                              Initiate Return
                            </Button>
                            <Button onClick={() => navigate(`/bookings/${booking.id}/compare`)} variant="secondary" className="text-sm py-2">
                              View Condition
                            </Button>
                          </div>
                        )}
                        {(booking.status === 'completed' || booking.status === 'disputed') && (
                          <>
                            {booking.status === 'completed' && (
                              <Button 
                                onClick={() => {
                                  setSelectedReviewBooking(booking);
                                  setReviewModalOpen(true);
                                }} 
                                className="text-sm py-2 bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30 flex items-center gap-2"
                              >
                                <Star size={16} fill="currentColor" /> Leave Review
                              </Button>
                            )}
                            {booking.status === 'disputed' && (
                              <Button 
                                onClick={() => navigate(`/bookings/${booking.id}/dispute`)} 
                                className="text-sm py-2 bg-red-600 hover:bg-red-700 shadow-red-600/30 text-white flex items-center gap-2"
                              >
                                <ShieldAlert size={16} /> View Dispute
                              </Button>
                            )}
                            <Button onClick={() => navigate(`/bookings/${booking.id}/compare`)} variant="secondary" className="text-sm py-2">
                              View Return Details
                            </Button>
                          </>
                        )}
                        <Button className="text-sm py-2" variant={booking.status === 'approved' ? 'secondary' : 'primary'}>View Details</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* ----------------- OWNER VIEW ----------------- */}
        {viewMode === 'owner' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Incoming Requests</h2>
            
            {myOwnerBookings.length === 0 ? (
               <EmptyState 
                 icon={Package}
                 title="No incoming requests"
                 message="When someone wants to rent your gear, it will show up here."
               />
            ) : (
              myOwnerBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-6 relative overflow-hidden">
                  
                  {/* Left Edge Color indicator based on status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    booking.status === 'pending' ? 'bg-yellow-400' : 
                    booking.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  <div className="flex-1 space-y-4 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Request for {booking.product?.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <Calendar size={14} /> 
                          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    {/* Renter Info */}
                    <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-4 border border-gray-100">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {booking.renter?.avatar_url ? (
                          <img src={booking.renter.avatar_url} alt="Renter" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-lg text-primary bg-primary/10">
                            {booking.renter?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Renter</p>
                            <h4 className="font-extrabold text-gray-900 leading-none">{booking.renter?.name || 'Unknown User'}</h4>
                          </div>
                          <Button variant="secondary" onClick={() => navigate(`/chat/${booking.id}`)} className="text-xs py-1.5 px-3 flex items-center gap-2 border-gray-200 text-gray-600 hover:text-primary">
                            <MessageSquare size={14} /> Message
                          </Button>
                        </div>
                        
                        {booking.message && (
                          <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 italic bg-white p-3 rounded-lg border border-gray-200">
                            <MessageSquare size={16} className="text-primary mt-0.5 flex-shrink-0" />
                            <p>"{booking.message}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Only show if pending) */}
                  {booking.status === 'pending' && (
                    <div className="lg:w-48 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                      <div className="text-center mb-2">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Potential Earnings</p>
                        <p className="text-2xl font-black text-primary">${booking.total_amount}</p>
                      </div>
                      <Button onClick={() => handleApprove(booking.id)} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30">
                        <CheckCircle2 size={18} /> Approve
                      </Button>
                      <Button variant="secondary" onClick={() => handleReject(booking.id)} className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border-red-200">
                        <XCircle size={18} /> Reject
                      </Button>
                    </div>
                  )}

                  {/* Handover Actions for Approved/Active */}
                  {(booking.status === 'approved' || booking.status === 'awaiting_handover' || booking.status === 'active' || booking.status === 'completed' || booking.status === 'disputed') && (
                    <div className="lg:w-48 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                      <div className="text-center mb-2">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Earnings</p>
                        <p className="text-2xl font-black text-gray-900">${booking.total_amount}</p>
                      </div>
                      
                      {booking.status === 'approved' && (
                        <Button variant="secondary" className="w-full flex items-center justify-center gap-2 cursor-not-allowed opacity-70">
                          Awaiting Payment
                        </Button>
                      )}

                      {booking.status === 'awaiting_handover' && (
                        <Button onClick={() => navigate(`/bookings/${booking.id}/handover`)} className="w-full flex items-center justify-center gap-2 bg-primary">
                          Start Handover
                        </Button>
                      )}

                      {booking.status === 'active' && (
                        <Button onClick={() => navigate(`/bookings/${booking.id}/compare`)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                          Review Return
                        </Button>
                      )}

                      {(booking.status === 'completed' || booking.status === 'disputed') && (
                        <>
                          {booking.status === 'completed' && (
                            <Button 
                              onClick={() => {
                                setSelectedReviewBooking(booking);
                                setReviewModalOpen(true);
                              }} 
                              className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 text-white"
                            >
                              <Star size={18} fill="currentColor" /> Leave Review
                            </Button>
                          )}
                          {booking.status === 'disputed' && (
                            <Button 
                              onClick={() => navigate(`/bookings/${booking.id}/dispute`)} 
                              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 text-white"
                            >
                              <ShieldAlert size={18} /> View Dispute
                            </Button>
                          )}
                          <Button variant="secondary" onClick={() => navigate(`/bookings/${booking.id}/compare`)} className="w-full flex items-center justify-center gap-2">
                            View Receipt
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}

      </div>
      {/* Modals */}
      <ReviewForm 
        isOpen={reviewModalOpen} 
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedReviewBooking(null);
        }}
        booking={selectedReviewBooking}
        onSuccess={() => {
          // Could refresh bookings to show a "Reviewed" status if we wanted to
          alert("Review submitted successfully!");
        }}
      />
    </div>
  );
};

export default Bookings;
