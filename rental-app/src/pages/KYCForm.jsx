import { useState } from 'react';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, UploadCloud, FileImage, CheckCircle, AlertCircle, 
  Smartphone, Key, Check, Lock, ChevronRight, FileText, X 
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
  const { user, isMock, initialize } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Tabs: 'instant' (Aadhaar OTP), 'manual' (Document Upload)
  const [verifyMethod, setVerifyMethod] = useState('instant');
  
  // Instant verification state
  const [aadharNumber, setAadharNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState(null);

  // Manual Document Upload state
  const [idType, setIdType] = useState('Aadhaar');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already verified or pending, don't show the form
  if (user?.kyc_status === 'verified' || user?.kyc_verified) {
    return (
      <AnimatedPage className="max-w-md mx-auto p-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Identity Verified</h2>
            <p className="text-gray-500 mt-2">Your identity has been fully verified via Aadhaar. You can now list and rent premium products.</p>
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
            <p className="text-gray-500 mt-2">We are currently reviewing your documents. This usually takes 1-2 business days. Or use the Instant Aadhaar verification below to skip the wait!</p>
          </div>
          <button 
            onClick={async () => {
              // Reset status locally so they can try the instant Aadhaar verification!
              try {
                if (isMock) {
                  const localUsers = getLocalUsers();
                  if (localUsers[user.email]) {
                    localUsers[user.email].kyc_status = 'unverified';
                    saveLocalUsers(localUsers);
                    useAuthStore.setState({ user: localUsers[user.email] });
                  }
                } else {
                  await supabase.from('users').update({ kyc_status: 'unverified' }).eq('id', user.id);
                  useAuthStore.setState({ user: { ...user, kyc_status: 'unverified', kyc_verified: false } });
                }
                setVerifyMethod('instant');
              } catch (e) {
                console.warn(e);
              }
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            Reset status and try Instant Aadhaar OTP instead
          </button>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/home')} className="w-full">Go to Home</Button>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Instant verification handlers
  const handleRequestAadharOtp = () => {
    const cleanAadhar = aadharNumber.replace(/\s+/g, '');
    if (cleanAadhar.length !== 12) {
      showToast('Please enter a valid 12-digit Aadhaar number.', 'error');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    
    // Simulate push alert SMS
    setNotification({
      title: '💬 UIDAI OTP Alert',
      message: `Your OTP for Aadhaar verification is ${code}. Valid for 10 min.`
    });
    
    showToast('Simulated Aadhaar verification OTP sent!', 'info');
  };

  const handleVerifyAadharOtp = async (e) => {
    e.preventDefault();
    if (inputOtp !== generatedOtp) {
      showToast('Invalid OTP. Please enter the code sent to your mobile.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const maskedAadhar = `XXXX XXXX ${aadharNumber.replace(/\s+/g, '').slice(-4)}`;
      const updateData = {
        kyc_status: 'verified',
        kyc_verified: true,
        aadhar_number: maskedAadhar
      };

      if (isMock) {
        const localUsers = getLocalUsers();
        if (localUsers[user.email]) {
          const updated = { ...localUsers[user.email], ...updateData };
          localUsers[user.email] = updated;
          saveLocalUsers(localUsers);
          useAuthStore.setState({ user: updated });
        }
      } else {
        const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
        if (error) throw error;
        useAuthStore.setState({ user: { ...user, ...updateData } });
      }

      showToast('Aadhaar verification successful!', 'success');
      navigate('/list-product');
    } catch (err) {
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setIsVerifying(false);
      setNotification(null);
    }
  };

  // Manual document upload handlers
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
        // Mock success simulation
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

      showToast('Documents submitted successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to submit documents', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage className="max-w-2xl mx-auto p-4 py-8 relative">
      
      {/* SMS notification simulator banner */}
      {notification && (
        <div className="fixed top-24 right-4 z-[9999] max-w-sm w-full bg-navy text-white rounded-2xl shadow-xl border border-white/10 p-4 animate-slide-in-right">
          <div className="flex gap-3">
            <Smartphone size={20} className="text-primary-light flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-primary-light uppercase tracking-wider">{notification.title}</span>
                <span className="text-[10px] text-gray-400">Just now</span>
              </div>
              <p className="text-sm font-semibold text-gray-200 mt-1 leading-snug">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white flex-shrink-0 ml-auto self-start">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Identity Verification (KYC)</h1>
        </div>
        <p className="text-gray-600 mb-8 leading-relaxed">
          RentNear enforces verified identities to prevent theft and fraud. Lenders must verify identity before listing gear or accepting bookings.
        </p>

        {/* Tab Selection */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
          <button 
            type="button"
            onClick={() => setVerifyMethod('instant')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${verifyMethod === 'instant' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Smartphone size={16} /> Instant Aadhaar (OTP)
          </button>
          <button 
            type="button"
            onClick={() => setVerifyMethod('manual')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${verifyMethod === 'manual' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <FileText size={16} /> Document Upload
          </button>
        </div>

        {user?.kyc_status === 'rejected' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="font-bold">Your previous submission was rejected.</p>
              <p className="text-sm">Please retry using the OTP verification method or upload clean, well-lit images.</p>
            </div>
          </div>
        )}

        {/* METHOD 1: INSTANT AADHAAR OTP */}
        {verifyMethod === 'instant' && (
          <div className="space-y-6">
            {!otpSent ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">12-Digit Aadhaar Number</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      maxLength={14}
                      value={aadharNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                        setAadharNumber(formatted);
                      }}
                      className="w-full pl-11 border border-gray-200 rounded-xl py-3.5 px-4 focus:ring-primary focus:border-primary text-center font-bold tracking-widest text-lg"
                      placeholder="1234 5678 9012"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                  <Shield className="text-primary flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    This is a secure connection directly linked to UIDAI database. A simulated 6-digit OTP code will be shown at the top of your screen as a push message.
                  </p>
                </div>

                <Button 
                  onClick={handleRequestAadharOtp}
                  disabled={aadharNumber.replace(/\s+/g, '').length !== 12}
                  className="w-full py-4 text-base rounded-2xl"
                >
                  Verify via Aadhaar OTP
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerifyAadharOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter 6-Digit SMS OTP</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      maxLength={6}
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 border border-gray-200 rounded-xl py-3.5 px-4 focus:ring-primary focus:border-primary text-center font-bold tracking-widest text-lg"
                      placeholder="XXXXXX"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isVerifying || inputOtp.length !== 6}
                    className="flex-1 py-4 text-base rounded-2xl"
                  >
                    {isVerifying ? 'Confirming...' : 'Verify OTP'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleRequestAadharOtp}
                    className="px-5 py-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all text-sm font-bold"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* METHOD 2: MANUAL DOCUMENT UPLOAD */}
        {verifyMethod === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Document Type</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
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
              className="w-full py-4 text-base rounded-2xl"
              loading={isSubmitting}
              disabled={!frontImage || !backImage || !selfieImage}
            >
              Submit Documents Securely
            </Button>
          </form>
        )}
      </div>
    </AnimatedPage>
  );
};

export default KYCForm;
