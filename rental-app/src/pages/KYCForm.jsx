import { useState } from 'react';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Shield, UploadCloud, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';

const FileUploadSlot = ({ label, file, onChange }) => (
  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors">
    <input 
      type="file" 
      accept="image/*" 
      id={label}
      className="hidden" 
      onChange={onChange}
    />
    <label htmlFor={label} className="cursor-pointer flex flex-col items-center">
      {file ? (
        <>
          <FileImage className="text-primary mb-2" size={32} />
          <span className="text-sm font-medium text-gray-900">{file.name}</span>
          <span className="text-xs text-gray-500 mt-1">Click to change</span>
        </>
      ) : (
        <>
          <UploadCloud className="text-gray-400 mb-2" size={32} />
          <span className="text-sm font-medium text-gray-900">Upload {label}</span>
          <span className="text-xs text-gray-500 mt-1">JPEG/PNG up to 5MB</span>
        </>
      )}
    </label>
  </div>
);

const KYCForm = () => {
  const { user, initialize } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [idType, setIdType] = useState('Aadhaar');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already verified or pending, don't show the form
  if (user?.kyc_status === 'verified') {
    return (
      <div className="max-w-3xl mx-auto p-4 py-12 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2">Identity Verified</h2>
        <p className="text-gray-500 mb-6">Your identity has been verified. You can now list products.</p>
        <Button onClick={() => navigate('/list-product')}>List a Product</Button>
      </div>
    );
  }

  if (user?.kyc_status === 'pending') {
    return (
      <div className="max-w-3xl mx-auto p-4 py-12 text-center">
        <AlertCircle className="mx-auto text-yellow-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
        <p className="text-gray-500 mb-6">We are currently reviewing your documents. This usually takes 1-2 business days.</p>
        <Button onClick={() => navigate('/home')}>Go Home</Button>
      </div>
    );
  }

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('File size must be under 5MB', 'error');
        return;
      }
      setter(file);
    }
  };

  const uploadToSupabase = async (file, path) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${path}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frontImage || !backImage || !selfieImage) {
      showToast('Please upload all required images', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Images to Private Bucket
      const frontUrl = await uploadToSupabase(frontImage, 'front');
      const backUrl = await uploadToSupabase(backImage, 'back');
      const selfieUrl = await uploadToSupabase(selfieImage, 'selfie');

      // 2. Create KYC Submission
      const { error: submissionError } = await supabase
        .from('kyc_submissions')
        .insert([{
          user_id: user.id,
          id_type: idType,
          front_url: frontUrl,
          back_url: backUrl,
          selfie_url: selfieUrl,
          status: 'pending'
        }]);

      if (submissionError) throw submissionError;

      // 3. Update User Status
      const { error: userError } = await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id);

      if (userError) throw userError;

      // 4. Refresh Auth Store to get updated status
      await initialize();
      
      showToast('Documents submitted successfully!', 'success');
      
    } catch (error) {
      console.error('KYC Upload Error:', error);
      showToast(error.message || 'Failed to submit documents', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AnimatedPage className="max-w-2xl mx-auto p-4 py-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verification (KYC)</h1>
        </div>
        <p className="text-gray-600 mb-6">
          To build a safe and trusted community, we require all lenders to verify their identity before listing products. Your documents are encrypted and stored securely in a private vault.
        </p>

        {user?.kyc_status === 'rejected' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="font-bold">Your previous submission was rejected.</p>
              <p className="text-sm">Please ensure your photos are clear, well-lit, and match the selected ID type.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
            <select 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
            >
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUploadSlot label="Front of ID" file={frontImage} onChange={(e) => handleFileChange(e, setFrontImage)} />
            <FileUploadSlot label="Back of ID" file={backImage} onChange={(e) => handleFileChange(e, setBackImage)} />
          </div>
          
          <FileUploadSlot label="Selfie holding ID" file={selfieImage} onChange={(e) => handleFileChange(e, setSelfieImage)} />

          <Button 
            type="submit" 
            className="w-full"
            loading={isSubmitting}
            disabled={!frontImage || !backImage || !selfieImage}
          >
            Submit Documents Securely
          </Button>
        </form>
      </div>
    </AnimatedPage>
  );
};

export default KYCForm;
