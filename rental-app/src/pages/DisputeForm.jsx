import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { ShieldAlert, UploadCloud, X, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config/api';

const REASON_OPTIONS = [
  'Damage to item',
  'Item not returned',
  'Wrong item returned',
  'Item not as described',
  'Other'
];

const DisputeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select('*, product:products(title)')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        setBooking(data);
      } catch {
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handlePhotoUpload = async (e) => {
    try {
      setUploading(true);
      setError('');
      
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${booking.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('disputes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('disputes')
        .getPublicUrl(filePath);

      setPhotos(prev => [...prev, publicUrl]);

    } catch (err) {
      setError('Failed to upload photo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a detailed description.');
      return;
    }
    if (photos.length === 0) {
      setError('Please upload at least one piece of evidence.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // 1. Insert Dispute Record
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert([{
          booking_id: booking.id,
          reported_by: user.id,
          reason,
          description,
          evidence_photos: photos
        }]);

      if (disputeError) {
        if (disputeError.code === '23505') throw new Error('A dispute is already open for this booking.');
        throw disputeError;
      }

      // 2. Call Backend to formally update booking status and trigger notifications if needed
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/bookings/${booking.id}/process-return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'dispute' })
      });

      if (!res.ok) {
        // Even if backend fails, the dispute was recorded. We can fallback to direct supabase update.
        await supabase.from('bookings').update({ status: 'disputed' }).eq('id', booking.id);
      }

      // 3. Navigate to Dispute Detail page
      navigate(`/bookings/${booking.id}/dispute`);

    } catch (err) {
      setError(err.message || 'Failed to submit dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!booking) return <div className="text-center pt-20 text-red-500">Booking not found.</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-red-100">
          <div className="bg-red-600 p-8 text-white text-center">
            <ShieldAlert size={48} className="mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold mb-2">Open a Dispute</h1>
            <p className="text-red-100">For booking: <strong>{booking.product?.title}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Reason Dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Dispute</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                {REASON_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe exactly what happened..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[150px] focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-y"
              ></textarea>
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Evidence Photos (Required)</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                    <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                {photos.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors cursor-pointer relative overflow-hidden">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                    ) : (
                      <>
                        <UploadCloud size={32} className="mb-2" />
                        <span className="text-sm font-medium">Add Photo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">Upload up to 5 photos showing the damage or issue clearly.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <Button 
                type="submit" 
                disabled={submitting || uploading} 
                className="w-full py-4 text-lg bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
              >
                {submitting ? 'Submitting Dispute...' : 'Submit Dispute'}
              </Button>
              <p className="text-center text-xs text-gray-400 mt-4">
                By submitting this dispute, you agree to cooperate with the RentNear support team.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default DisputeForm;
