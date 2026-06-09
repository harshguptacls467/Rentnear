import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Clock, ShieldAlert, FileText, Camera, Shield } from 'lucide-react';
import { API_URL } from '../config/api';

const DisputeDetail = () => {
  const { id } = useParams(); // booking id
  const navigate = useNavigate();


  const [booking, setBooking] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [preCheck, setPreCheck] = useState(null);
  const [postCheck, setPostCheck] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchDisputeData = async () => {
      try {
        // 1. Fetch Booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*, product:products(title), renter:users!bookings_renter_id_fkey(name), owner:users!bookings_owner_id_fkey(name)')
          .eq('id', id)
          .single();
        if (bookingError) throw bookingError;
        setBooking(bookingData);

        // 2. Fetch Dispute
        const { data: disputeData, error: disputeError } = await supabase
          .from('disputes')
          .select('*, reporter:users!disputes_reported_by_fkey(name)')
          .eq('booking_id', id)
          .single();
        if (disputeError && disputeError.code !== 'PGRST116') throw disputeError; // ignore not found
        setDispute(disputeData);

        // 3. Fetch Audit Logs
        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('booking_id', id)
          .order('created_at', { ascending: true });
        if (logsError) throw logsError;
        setAuditLogs(logsData || []);

        // 4. Fetch Condition Checks (Using our custom API or direct DB if RLS permits)
        // Since we have a backend route for this, we can use it to get standard format
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${API_URL}/bookings/${id}/condition-compare`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const comparisonData = await res.json();
          setPreCheck(comparisonData.pre_rental);
          setPostCheck(comparisonData.post_return);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputeData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center pt-20 text-gray-500">
        No active dispute found for this booking. 
        <button onClick={() => navigate(-1)} className="ml-2 text-primary underline">Go back</button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <button onClick={() => navigate('/bookings')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} /> Back to Bookings
        </button>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert size={28} className="text-red-500" />
              <h1 className="text-2xl font-extrabold text-gray-900">Dispute Center</h1>
            </div>
            <p className="text-gray-500">Booking: <span className="font-bold">{booking.product?.title}</span></p>
            <p className="text-sm text-gray-400">Reported by {dispute.reporter?.name}</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm border uppercase tracking-wider ${getStatusColor(dispute.status)}`}>
            {getStatusLabel(dispute.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Dispute Details & Evidence */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* The Complaint */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-gray-400" /> The Complaint
              </h3>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Reason</p>
                <p className="text-gray-900 font-semibold">{dispute.reason}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 italic">
                "{dispute.description}"
              </div>
            </div>

            {/* Evidence Viewer */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Camera size={20} className="text-gray-400" /> Evidence & Photos
              </h3>

              {/* Dispute Photos */}
              <div className="mb-8">
                <p className="text-sm font-bold text-gray-900 mb-3">Provided in Dispute</p>
                {dispute.evidence_photos && dispute.evidence_photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {dispute.evidence_photos.map((photo, i) => (
                      <a key={i} href={photo} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity">
                        <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No evidence photos provided.</p>
                )}
              </div>

              {/* Original Condition Check Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Pre-Rental (Owner)</p>
                  {preCheck?.photos ? (
                    <div className="grid grid-cols-2 gap-2">
                      {preCheck.photos.slice(0,4).map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={p} alt="pre-rental" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">Not available</p>}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Post-Return (Renter)</p>
                  {postCheck?.photos ? (
                    <div className="grid grid-cols-2 gap-2">
                      {postCheck.photos.slice(0,4).map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={p} alt="post-return" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">Not available</p>}
                </div>
              </div>
            </div>

            {/* Admin Resolution */}
            {dispute.admin_notes && (
              <div className="bg-green-50 rounded-3xl p-8 shadow-sm border border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-green-600" /> Admin Resolution
                </h3>
                <p className="text-green-800 bg-white p-4 rounded-xl border border-green-100 mb-4">
                  {dispute.admin_notes}
                </p>
                {dispute.resolution_amount > 0 && (
                  <p className="font-bold text-green-900">
                    Resolution Amount Deducted: ${dispute.resolution_amount}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Right Sidebar: Audit Trail Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock size={20} className="text-gray-400" /> Audit Trail
              </h3>
              
              <div className="space-y-6">
                {auditLogs.map((log, index) => (
                  <div key={log.id} className="relative pl-6">
                    {/* Timeline Line */}
                    {index !== auditLogs.length - 1 && (
                      <div className="absolute left-1.5 top-5 bottom-[-24px] w-[2px] bg-gray-100"></div>
                    )}
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-4 border-white shadow-sm"></div>
                    
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-800 font-medium">{log.description}</p>
                    </div>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center">No timeline events recorded.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DisputeDetail;
