import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { 
  Calendar, Package, AlertCircle, CheckCircle2, XCircle, SearchX, MessageSquare, 
  Star, ShieldAlert, Radio, ChevronDown, ChevronUp, ShieldCheck, Clock, Plus, HelpCircle
} from 'lucide-react';
import ReviewForm from '../components/ReviewForm';
import EmptyState from '../components/EmptyState';
import { API_URL } from '../config/api';
import { MOCK_BOOKINGS } from '../data/mockData';
import useRealtimeBookings from '../hooks/useRealtimeBookings';
import { getLocalBookings, saveLocalBookings } from '../utils/localDb';
import { motion, AnimatePresence } from 'framer-motion';

const safeFormatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};

const Bookings = () => {
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Collapsed states for individual bookings details
  const [expandedBookingIds, setExpandedBookingIds] = useState(new Set());

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
  
  // Extension Modal State
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionBooking, setExtensionBooking] = useState(null);
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionLoading, setExtensionLoading] = useState(false);
  const [extensionSuccess, setExtensionSuccess] = useState(false);

  // View Mode ('renter' or 'owner')
  const [viewMode, setViewMode] = useState(user?.role === 'owner' ? 'owner' : 'renter');
  
  // Tabs for Renter View
  const [renterTab, setRenterTab] = useState('pending'); // pending, active, past, cancelled

  const fetchBookings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      if (isMock) {
        const localBookings = getLocalBookings();
        const myBookings = localBookings.filter(b => b.renter_id === user.id || b.owner_id === user.id);
        setBookings(myBookings);
        return;
      }

      // Direct Supabase query executes in ~100ms (avoids 50s Render backend cold start delay)
      const { data: directData, error: dbErr } = await supabase
        .from('bookings')
        .select(`
          *,
          product:products(*)
        `)
        .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!dbErr && directData) {
        setBookings(directData);
      } else {
        const localBookings = getLocalBookings().filter(b => b.renter_id === user.id || b.owner_id === user.id);
        const isDemoUser = user?.email === 'demo@rentnear.app';
        setBookings(localBookings.length > 0 ? localBookings : (isDemoUser ? MOCK_BOOKINGS : []));
      }
    } catch {
      const localBookings = getLocalBookings().filter(b => b.renter_id === user?.id || b.owner_id === user?.id);
      const isDemoUser = user?.email === 'demo@rentnear.app';
      setBookings(localBookings.length > 0 ? localBookings : (isDemoUser ? MOCK_BOOKINGS : []));
    } finally {
      setLoading(false);
    }
  }, [user, isMock]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useRealtimeBookings(setBookings, user, isMock);

  const toggleExpand = (id) => {
    const next = new Set(expandedBookingIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedBookingIds(next);
  };

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
    if (reason !== null) {
      updateBookingStatus(id, 'rejected', reason);
    }
  };

  const handleCancel = (id) => {
    if (window.confirm("Are you sure you want to cancel this booking request?")) {
      updateBookingStatus(id, 'cancelled');
    }
  };

  // Submit booking date extension request
  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!extensionDate) return;
    setExtensionLoading(true);
    try {
      // Create a mocked extension or notify through database
      if (!isMock) {
        // Send a custom chat message or flag status in Supabase database
        await supabase.from('admin_audit_logs').insert([{
          action: 'booking_extension_requested',
          details: { booking_id: extensionBooking.id, new_end_date: extensionDate, requested_by: user.id }
        }]);
      }
      setExtensionSuccess(true);
      
      // Patch local bookings state to show visual indicator
      const local = getLocalBookings();
      const updated = local.map(b => b.id === extensionBooking.id ? { ...b, extension_requested: extensionDate } : b);
      saveLocalBookings(updated);
      setBookings(updated.filter(b => b.renter_id === user?.id || b.owner_id === user?.id));
    } catch (err) {
      alert('Extension failed to send.');
    } finally {
      setExtensionLoading(false);
    }
  };

  // Derived bookings datasets
  const myRenterBookings = bookings.filter(b => b.renter_id === user?.id);
  const myOwnerBookings = bookings.filter(b => b.owner_id === user?.id);

  const getFilteredRenterBookings = () => {
    switch (renterTab) {
      case 'pending':
        return myRenterBookings.filter(b => b.status === 'pending');
      case 'active':
        return myRenterBookings.filter(b => ['approved', 'awaiting_handover', 'active'].includes(b.status));
      case 'past':
        return myRenterBookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return myRenterBookings.filter(b => ['cancelled', 'rejected'].includes(b.status));
      default:
        return myRenterBookings;
    }
  };

  // Get active step index for booking timeline
  const getTimelineStep = (status) => {
    const steps = ['pending', 'approved', 'awaiting_handover', 'active', 'completed'];
    return steps.indexOf(status);
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      awaiting_handover: 'bg-purple-100 text-purple-700 border-purple-200',
      active: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      disputed: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status] || styles.pending}`}>
        {status?.replace('_', ' ')}
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
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Title Bar & Role Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-navy tracking-tight">Your Rentals</h1>
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <Radio size={10} className="animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-gray-500 mt-1">Track payments, handovers, returns, and disputes.</p>
          </div>
          
          {user && (
            <div className="flex bg-gray-200 p-1.5 rounded-full w-fit">
              <button 
                onClick={() => setViewMode('renter')}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'renter' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
              >
                Renting
              </button>
              {(user?.role === 'both' || user?.role === 'owner') && (
                <button 
                  onClick={() => setViewMode('owner')}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'owner' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                >
                  Listing
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

        {/* ----------------- RENTER DASHBOARD VIEW ----------------- */}
        {viewMode === 'renter' && (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              {[
                { id: 'pending', label: 'Requested' },
                { id: 'active', label: 'Active Rentals' },
                { id: 'past', label: 'Past Trips' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRenterTab(tab.id)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-colors ${
                    renterTab === tab.id 
                      ? 'bg-navy text-white shadow-md' 
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {getFilteredRenterBookings().length === 0 ? (
                <EmptyState 
                  icon={SearchX}
                  title={`No ${renterTab} bookings`}
                  message="You don't have any bookings in this section."
                  actionLabel="Browse Products"
                  onAction={() => navigate('/products')}
                />
              ) : (
                getFilteredRenterBookings().map((booking) => {
                  const isExpanded = expandedBookingIds.has(booking.id);
                  const activeStep = getTimelineStep(booking.status);
                  
                  return (
                    <div key={booking.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      
                      {/* Booking Card Header row */}
                      <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="w-24 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          <img src={booking.product?.images?.[0] || 'https://via.placeholder.com/400'} alt={booking.product?.title} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-extrabold text-navy text-lg truncate">{booking.product?.title}</h3>
                            <StatusBadge status={booking.status} />
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-1 font-medium">
                            Reservation: {safeFormatDate(booking.start_date)} - {safeFormatDate(booking.end_date)}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm font-black text-gray-900">Total Charged: ${booking.total_amount}</span>
                            <button 
                              onClick={() => toggleExpand(booking.id)}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline ml-auto"
                            >
                              {isExpanded ? <><ChevronUp size={14} /> Collapse Detail</> : <><ChevronDown size={14} /> Show Timeline & Tools</>}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible details panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50 border-t border-gray-100 p-6 space-y-6 overflow-hidden text-sm"
                          >
                            
                            {/* Booking Timeline Tracker */}
                            {activeStep >= 0 && (
                              <div className="space-y-4">
                                <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Booking Timeline</h4>
                                <div className="flex items-center justify-between relative mt-2">
                                  <div className="absolute top-1/2 left-2 right-2 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                                  <div 
                                    className="absolute top-1/2 left-2 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-700" 
                                    style={{ width: `${(activeStep / 4) * 100}%` }}
                                  ></div>
                                  
                                  {['Reserved', 'Approved', 'Paid', 'Active', 'Returned'].map((label, stepIdx) => (
                                    <div key={label} className="relative z-10 flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center font-bold text-xs transition-colors ${
                                        activeStep >= stepIdx 
                                          ? 'bg-primary border-white text-white shadow-md shadow-primary/20' 
                                          : 'bg-white border-gray-200 text-gray-400'
                                      }`}>
                                        {activeStep >= stepIdx ? '✓' : stepIdx + 1}
                                      </div>
                                      <span className={`text-[10px] font-black mt-2 uppercase tracking-wide ${activeStep >= stepIdx ? 'text-navy' : 'text-gray-400'}`}>{label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Refundable Deposit Breakdown */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                              <h4 className="font-black text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="text-green-500" size={16} /> Price & Escrow Hold Breakdown
                              </h4>
                              <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500">
                                <span>Day Rate Charges</span>
                                <span className="text-right text-gray-900 font-bold">${booking.total_amount - (booking.deposit_amount || 30)}</span>
                                
                                <span>Refundable Escrow Deposit</span>
                                <span className="text-right text-gray-900 font-bold">${booking.deposit_amount || 30}</span>
                                
                                <div className="col-span-2 border-t border-gray-100 pt-2 flex justify-between font-black text-navy text-sm">
                                  <span>Total Escrow Authorization</span>
                                  <span>${booking.total_amount}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 leading-relaxed italic mt-2">
                                * The security deposit is held by RentNear during the rental and released automatically within 24 hours of successful item return validation.
                              </p>
                            </div>

                            {/* Extended Actions & Triggers */}
                            <div className="flex flex-wrap gap-3 pt-2">
                              
                              <Button 
                                variant="secondary" 
                                onClick={() => navigate(`/chat/${booking.id}`)}
                                className="text-xs bg-white text-navy border-gray-200 flex items-center gap-1.5"
                              >
                                <MessageSquare size={14} /> Open Chat
                              </Button>

                              {/* Request Extension Trigger */}
                              {booking.status === 'active' && (
                                <Button 
                                  onClick={() => {
                                    setExtensionBooking(booking);
                                    setExtensionSuccess(false);
                                    setShowExtensionModal(true);
                                  }}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                                >
                                  <Plus size={14} /> Request Extension
                                </Button>
                              )}

                              {/* Cancel Booking (if pending/approved, before active) */}
                              {['pending', 'approved', 'awaiting_handover'].includes(booking.status) && (
                                <button 
                                  onClick={() => handleCancel(booking.id)}
                                  className="px-4 py-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center gap-1.5"
                                >
                                  <XCircle size={14} /> Cancel Booking
                                </button>
                              )}

                              {/* Pay Now Redirect */}
                              {booking.status === 'approved' && (
                                <Button onClick={() => navigate(`/bookings/${booking.id}/pay`)} className="text-xs bg-green-500 hover:bg-green-600">
                                  💳 Complete Payment
                                </Button>
                              )}

                              {/* Verify Handover */}
                              {booking.status === 'awaiting_handover' && (
                                <Button onClick={() => navigate(`/bookings/${booking.id}/handover`)} className="text-xs bg-primary">
                                  ⚡ Verify Handover Code
                                </Button>
                              )}

                              {/* Initiate Return */}
                              {booking.status === 'active' && (
                                <Button onClick={() => navigate(`/bookings/${booking.id}/return`)} className="text-xs bg-blue-600 hover:bg-blue-700">
                                  📦 Return Item
                                </Button>
                              )}

                              {/* Compare Condition */}
                              {['active', 'completed', 'disputed'].includes(booking.status) && (
                                <Button onClick={() => navigate(`/bookings/${booking.id}/compare`)} variant="secondary" className="text-xs bg-white text-navy border-gray-200">
                                  🔍 View Handover Logs
                                </Button>
                              )}

                              {['awaiting_handover', 'active', 'completed'].includes(booking.status) && (
                                <Button onClick={() => navigate(`/bookings/${booking.id}/invoice`)} variant="secondary" className="text-xs bg-white text-navy border-gray-200">
                                  📄 View Invoice Receipt
                                </Button>
                              )}

                              {/* File Damage Report (Dispute) */}
                              {['active', 'completed'].includes(booking.status) && (
                                <button 
                                  onClick={() => navigate(`/bookings/${booking.id}/dispute-form`)}
                                  className="px-4 py-2 rounded-xl border border-orange-100 hover:bg-orange-50 text-orange-600 font-bold text-xs flex items-center gap-1.5"
                                >
                                  <ShieldAlert size={14} /> File Damage Report
                                </button>
                              )}

                              {/* Review Action */}
                              {booking.status === 'completed' && (
                                <Button 
                                  onClick={() => {
                                    setSelectedReviewBooking(booking);
                                    setReviewModalOpen(true);
                                  }} 
                                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1.5"
                                >
                                  <Star size={14} fill="currentColor" /> Write Review
                                </Button>
                              )}
                            </div>

                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ----------------- OWNER INCOMING DASHBOARD VIEW ----------------- */}
        {viewMode === 'owner' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-navy">Incoming Rent Requests</h2>
            
            {myOwnerBookings.length === 0 ? (
               <EmptyState 
                 icon={Package}
                 title="No pending inquiries"
                 message="Gear requests listed by renters will show here."
               />
            ) : (
              myOwnerBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-6 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    booking.status === 'pending' ? 'bg-yellow-400' : 
                    ['approved', 'awaiting_handover'].includes(booking.status) ? 'bg-indigo-400' : 'bg-primary'
                  }`}></div>

                  <div className="flex-1 space-y-4 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-navy">Request: {booking.product?.title}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                          <Calendar size={13} /> {safeFormatDate(booking.start_date)} - {safeFormatDate(booking.end_date)}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4 border border-gray-100">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {booking.renter?.avatar_url ? (
                          <img src={booking.renter.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-lg text-primary bg-primary/10">
                            {booking.renter?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-extrabold text-navy text-sm">{booking.renter?.name}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Renter Profile</span>
                        
                        {booking.message && (
                          <p className="mt-2 text-xs text-gray-500 italic bg-white p-3 rounded-lg border border-gray-100">
                            "{booking.message}"
                          </p>
                        )}

                        {booking.extension_requested && (
                          <div className="mt-3 bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center justify-between text-xs text-amber-800">
                            <span>Requested extension return date to: <strong>{safeFormatDate(booking.extension_requested)}</strong></span>
                            <button 
                              onClick={() => {
                                // Accept Extension
                                const local = getLocalBookings();
                                const updated = local.map(b => b.id === booking.id ? { ...b, end_date: b.extension_requested, extension_requested: null } : b);
                                saveLocalBookings(updated);
                                setBookings(updated.filter(b => b.renter_id === user?.id || b.owner_id === user?.id));
                                alert("Extension request approved!");
                              }}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-48 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Earnings Summary</p>
                      <p className="text-2xl font-black text-primary">${booking.total_amount}</p>
                    </div>

                    {booking.status === 'pending' && (
                      <>
                        <Button onClick={() => handleApprove(booking.id)} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600">
                          Approve Request
                        </Button>
                        <Button variant="secondary" onClick={() => handleReject(booking.id)} className="w-full text-red-600 border-red-200">
                          Reject
                        </Button>
                      </>
                    )}

                    {booking.status === 'awaiting_handover' && (
                      <Button onClick={() => navigate(`/bookings/${booking.id}/handover`)} className="w-full bg-primary text-xs">
                        Start Handover Validation
                      </Button>
                    )}

                    {booking.status === 'active' && (
                      <Button onClick={() => navigate(`/bookings/${booking.id}/compare`)} className="w-full bg-blue-600 hover:bg-blue-700 text-xs">
                        Verify Return Inspection
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Extension Dialog Modal */}
      <AnimatePresence>
        {showExtensionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowExtensionModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
              >
                <XCircle size={20} />
              </button>

              {!extensionSuccess ? (
                <form onSubmit={handleRequestExtension} className="space-y-4">
                  <div className="text-center">
                    <CalendarIcon className="text-primary mx-auto mb-2" size={36} />
                    <h3 className="text-lg font-black text-navy">Extend Rental Booking</h3>
                    <p className="text-xs text-gray-400 mt-1">Select a new return date for owner approval.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">New Return Date</label>
                    <input 
                      type="date" 
                      value={extensionDate}
                      min={extensionBooking ? extensionBooking.end_date : ''}
                      onChange={(e) => setExtensionDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      type="button"
                      className="flex-1 bg-white" 
                      onClick={() => setShowExtensionModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1" 
                      disabled={extensionLoading || !extensionDate}
                      type="submit"
                    >
                      {extensionLoading ? 'Requesting...' : 'Request Extension'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 size={44} className="text-green-500 mx-auto mb-3" />
                  <h4 className="font-extrabold text-navy text-base">Request Submitted</h4>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                    The owner has been notified of your extension request. You will see an alert on their decision.
                  </p>
                  <Button className="mt-6 w-full" onClick={() => setShowExtensionModal(false)}>Close</Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReviewForm 
        isOpen={reviewModalOpen} 
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedReviewBooking(null);
        }}
        booking={selectedReviewBooking}
        onSuccess={() => {
          alert("Review submitted successfully!");
        }}
      />
    </div>
  );
};

export default Bookings;
