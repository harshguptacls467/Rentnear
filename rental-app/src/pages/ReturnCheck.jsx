import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { PackageCheck, X, Check, AlertCircle, Camera } from 'lucide-react';
import { API_URL } from '../config/api';

const CHECKLIST_TEMPLATES = {
  Camera: [
    { id: 'lens_clean', label: 'Lens is clean and scratch-free' },
    { id: 'battery_charged', label: 'Battery is fully charged' },
    { id: 'memory_card', label: 'Memory card included' },
    { id: 'no_damage', label: 'No visible body damage' },
    { id: 'accessories', label: 'All requested accessories present' },
  ],
  Drone: [
    { id: 'propellers', label: 'Propellers are intact' },
    { id: 'battery_charged', label: 'Battery is fully charged' },
    { id: 'controller', label: 'Controller connects successfully' },
    { id: 'no_damage', label: 'No visible body damage' },
    { id: 'camera_clean', label: 'Gimbal/Camera is clean' },
  ],
  default: [
    { id: 'no_damage', label: 'No visible structural damage' },
    { id: 'clean', label: 'Item is clean and presentable' },
    { id: 'working', label: 'Item functions as expected' },
    { id: 'parts_included', label: 'All associated parts included' },
    { id: 'safe_to_use', label: 'Item is safe to operate' },
  ]
};

const ReturnCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [checklistValues, setChecklistValues] = useState({});
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select('*, product:products(title, category)')
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

  const template = booking?.product?.category && CHECKLIST_TEMPLATES[booking.product.category]
    ? CHECKLIST_TEMPLATES[booking.product.category]
    : CHECKLIST_TEMPLATES.default;

  const handleToggleCheck = (itemId) => {
    setChecklistValues(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 10)); // max 10
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `return_${booking.id}_${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('condition-checks')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('condition-checks')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (files.length < 3) return setError('Please upload at least 3 photos.');
    if (!agreed) return setError('You must agree to the condition statement.');
    
    try {
      setSubmitting(true);
      setError('');

      // 1. Upload Photos
      const photoUrls = await uploadPhotos();

      // 2. Submit to Backend
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${API_URL}/bookings/${id}/return-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          checklist: checklistValues,
          photos: photoUrls,
          notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      navigate('/bookings'); // Redirect back to dashboard

    } catch (err) {
      setError(err.message || 'Failed to submit return check.');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Post-Rental Return Check</h1>
          <p className="text-gray-500 mt-2">Document the physical state of <strong>{booking.product?.title}</strong> as you return it.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          
          {/* Section 1: Checklist */}
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">1. Return Verification Checklist</h3>
            <div className="space-y-3">
              {template.map((item) => (
                <label key={item.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 flex-shrink-0 ${checklistValues[item.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {checklistValues[item.id] && <Check size={14} className="text-white" />}
                  </div>
                  <span className={`font-medium ${checklistValues[item.id] ? 'text-gray-900' : 'text-gray-600'}`}>{item.label}</span>
                  <input type="checkbox" className="hidden" checked={!!checklistValues[item.id]} onChange={() => handleToggleCheck(item.id)} />
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Photos */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">2. Photographic Evidence</h3>
            <p className="text-sm text-gray-500 mb-4">Please upload at least 3 photos (front, back, and close-up) showing the item's state upon return.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {files.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={() => removeFile(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {files.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Camera size={24} className="text-gray-400 mb-2" />
                  <span className="text-xs font-bold text-gray-500 uppercase">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
            {files.length > 0 && files.length < 3 && <p className="text-xs font-bold text-red-500">{3 - files.length} more photo(s) required.</p>}
          </div>

          {/* Section 3: Notes & Agreement */}
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">3. Remarks & Agreement</h3>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="List any new scratches, issues, or general remarks here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-24 mb-6"
            ></textarea>

            <label className="flex items-start gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
              <div className={`w-6 h-6 rounded flex items-center justify-center border-2 mt-0.5 flex-shrink-0 ${agreed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                {agreed && <Check size={14} className="text-white" />}
              </div>
              <p className={`text-sm ${agreed ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                I confirm that the checklist, photos, and notes provided above accurately represent the physical condition of the item as I am returning it.
              </p>
              <input type="checkbox" className="hidden" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            </label>
          </div>
          
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={submitting || files.length < 3 || !agreed} 
          className="w-full py-4 text-lg shadow-xl bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? 'Submitting Return...' : 'Submit Return Check'}
        </Button>
      </div>
    </div>
  );
};

export default ReturnCheck;
