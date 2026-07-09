import { useState } from 'react';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, UploadCloud, FileImage, CheckCircle, AlertCircle, 
  FileText, X 
} from 'lucide-react';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import { getLocalUsers, saveLocalUsers } from '../utils/localDb';

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
  const { user, session, isMock } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Document Upload state
  const [idType, setIdType] = useState('Passport');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already verified
  if (user?.kyc_status === 'verified' || user?.kyc_verified) {
    return (
      <AnimatedPage className="max-w-md mx-auto p-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Identity Verified</h2>
            <p className="text-gray-500 mt-2">Your identity has been successfully verified. You can now list and rent products.</p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/list-product')} className="w-full">List a Product</Button>
            <Button onClick={() => navigate('/home')} variant="secondary" className="w-full bg-gray-50 border-gray-200">Go to Home</Button>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (user?.kyc_status === 'pending') {
    return (
      <AnimatedPage className="max-w-md mx-auto p-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Pending</h2>
            <p className="text-gray-500 mt-2">We are currently reviewing your documents. This usually takes 1-2 business days.</p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/home')} className="w-full">Go to Home</Button>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!frontImage || !backImage || !selfieImage) {
      showToast('Please upload all required images', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isMock) {
        const updateData = { kyc_status: 'pending' };
        const localUsers = getLocalUsers();
        if (localUsers[user.email]) {
          const updated = { ...localUsers[user.email], ...updateData };
          localUsers[user.email] = updated;
          saveLocalUsers(localUsers);
          useAuthStore.setState({ user: updated });
        }
      } else {
        const frontUrl = await uploadToSupabase(frontImage, 'front');
        const backUrl = await uploadToSupabase(backImage, 'back');
        const selfieUrl = await uploadToSupabase(selfieImage, 'selfie');

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

        const { error: userError } = await supabase
          .from('users')
          .update({ kyc_status: 'pending' })
          .eq('id', user.id);

        if (userError) throw userError;
        useAuthStore.setState({ user: { ...user, kyc_status: 'pending' } });
      }

      showToast('Documents submitted successfully! We will review within 1-2 business days.', 'success');
      navigate('/home');
    } catch (error) {
      showToast(error.message || 'Failed to submit documents', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage className="max-w-2xl mx-auto p-4 py-8">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Identity Verification (KYC)</h1>
        </div>
        <p className="text-gray-600 mb-8 leading-relaxed">
          RentNear enforces verified identities to prevent theft and fraud. Please upload a clear photo of your government ID and a selfie holding it.
        </p>

        {user?.kyc_status === 'rejected' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="font-bold">Your previous submission was rejected.</p>
              <p className="text-sm">Please upload clean, well-lit images of your ID and selfie.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Document Type</label>
            <select 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
            >
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
              <option value="PAN Card">PAN Card</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUploadSlot label="Front of ID" file={frontImage} onChange={(e) => handleFileChange(e, setFrontImage)} />
            <FileUploadSlot label="Back of ID" file={backImage} onChange={(e) => handleFileChange(e, setBackImage)} />
          </div>
          
          <FileUploadSlot label="Selfie holding ID" file={selfieImage} onChange={(e) => handleFileChange(e, setSelfieImage)} />

          {/* Info box */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
            <FileText className="text-primary flex-shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              Your documents are encrypted and stored securely. They are only used for identity verification and are never shared with third parties.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-base rounded-2xl"
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
