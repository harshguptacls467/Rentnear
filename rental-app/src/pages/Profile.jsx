import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { 
  Camera, Edit2, Save, X, Star, User as UserIcon, Phone, Mail, Calendar, 
  ShieldCheck, AlertCircle, Quote, MapPin, CreditCard, Shield, Lock, 
  CheckCircle2, Key, Smartphone, ChevronRight 
} from 'lucide-react';
import { MOCK_USER, MOCK_REVIEWS } from '../data/mockData';
import { getLocalUsers, saveLocalUsers } from '../utils/localDb';
import AnimatedPage from '../components/AnimatedPage';

const parsePhone = (fullPhone) => {
  if (!fullPhone) return { countryCode: '+91', phoneNum: '' };
  const trimmed = fullPhone.trim();
  const matches = trimmed.match(/^(\+\d+)\s+(.*)$/);
  if (matches) {
    return { countryCode: matches[1], phoneNum: matches[2] };
  }
  if (trimmed.startsWith('+')) {
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex > 0) {
      return { countryCode: trimmed.substring(0, spaceIndex), phoneNum: trimmed.substring(spaceIndex + 1) };
    }
    if (trimmed.startsWith('+91')) {
      return { countryCode: '+91', phoneNum: trimmed.substring(3) };
    }
  }
  return { countryCode: '+91', phoneNum: trimmed };
};

const Profile = () => {
  const { user, session, isMock, initialize } = useAuthStore();
  
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    phone: '',
    location: '',
    upi_id: '',
    bio: '',
    role: 'both',
    emergency_contact: ''
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNum, setPhoneNum] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Verification center states
  const [notification, setNotification] = useState(null);
  
  // Email verification states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailInputOtp, setEmailInputOtp] = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);

  // Aadhaar verification states
  const [showAadharModal, setShowAadharModal] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharOtp, setAadharOtp] = useState('');
  const [aadharInputOtp, setAadharInputOtp] = useState('');
  const [aadharVerifying, setAadharVerifying] = useState(false);
  const [aadharStep, setAadharStep] = useState('input'); // 'input', 'otp', 'success'
  const [clientId, setClientId] = useState('');
  const [isSimulatedAadhar, setIsSimulatedAadhar] = useState(false);
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);
  const [isRequestingAadhar, setIsRequestingAadhar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(MOCK_USER);
        const parsed = parsePhone(MOCK_USER.phone);
        setCountryCode(parsed.countryCode);
        setPhoneNum(parsed.phoneNum);
        setEditForm({ 
          name: MOCK_USER.name, 
          phone: MOCK_USER.phone,
          location: MOCK_USER.location || 'New Delhi, India',
          upi_id: MOCK_USER.upi_id || 'demo@upi',
          bio: MOCK_USER.bio || 'Hi neighbors! I believe in the power of sharing.',
          role: MOCK_USER.role || 'both',
          emergency_contact: MOCK_USER.emergency_contact || ''
        });
        setReviews(MOCK_REVIEWS);
        setLoading(false);
        return;
      }
      try {
        setLoading(true); setError(null);
        if (isMock) {
          throw new Error('mock');
        }
        const { data, error: dbError } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (dbError || !data) throw dbError || new Error('no data');
        setProfile(data);
        const parsed = parsePhone(data.phone || '');
        setCountryCode(parsed.countryCode);
        setPhoneNum(parsed.phoneNum);
        setEditForm({ 
          name: data.name || '', 
          phone: data.phone || '',
          location: data.location || '',
          upi_id: data.upi_id || '',
          bio: data.bio || '',
          role: data.role || 'both',
          emergency_contact: data.emergency_contact || ''
        });

        let reviewsData = [];
        let reviewsError = null;
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/user/${user.id}?limit=3`);
          if (!res.ok) throw new Error('Failed to fetch reviews');
          reviewsData = await res.json();
        } catch (err) { reviewsError = err; }
        setReviews(reviewsError ? MOCK_REVIEWS : (reviewsData || MOCK_REVIEWS));
      } catch (err) {
        if (isMock) {
          setProfile(user);
          const parsed = parsePhone(user.phone || '');
          setCountryCode(parsed.countryCode);
          setPhoneNum(parsed.phoneNum);
          setEditForm({ 
            name: user.name || '', 
            phone: user.phone || '',
            location: user.location || '',
            upi_id: user.upi_id || '',
            bio: user.bio || '',
            role: user.role || 'both',
            emergency_contact: user.emergency_contact || ''
          });
          setReviews(MOCK_REVIEWS);
        } else {
          setProfile(MOCK_USER);
          const parsed = parsePhone(MOCK_USER.phone);
          setCountryCode(parsed.countryCode);
          setPhoneNum(parsed.phoneNum);
          setEditForm({ 
            name: MOCK_USER.name, 
            phone: MOCK_USER.phone,
            location: MOCK_USER.location || '',
            upi_id: MOCK_USER.upi_id || '',
            bio: MOCK_USER.bio || '',
            role: MOCK_USER.role || 'both',
            emergency_contact: MOCK_USER.emergency_contact || ''
          });
          setReviews(MOCK_REVIEWS);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, isMock]);

  // Push Simulated Notification
  const triggerNotification = (type, title, message) => {
    setNotification({ type, title, message });
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      setNotification(null);
    }, 15000);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true); setError(null);
      const fullPhone = phoneNum.trim() ? `${countryCode} ${phoneNum.trim()}` : '';
      
      const updateData = {
        name: editForm.name,
        phone: fullPhone,
        location: editForm.location,
        upi_id: editForm.upi_id,
        bio: editForm.bio,
        role: editForm.role,
        emergency_contact: editForm.emergency_contact
      };

      if (isMock) {
        const localUsers = getLocalUsers();
        if (localUsers[user.email]) {
          const updated = { ...localUsers[user.email], ...updateData };
          localUsers[user.email] = updated;
          saveLocalUsers(localUsers);
          useAuthStore.setState({ user: updated });
          setProfile(updated);
        }
        setIsEditing(false);
        return;
      }
      
      const { error: updateError } = await supabase.from('users').update(updateData).eq('id', user.id);
      if (updateError) throw updateError;
      
      setProfile({ ...profile, ...updateData });
      useAuthStore.setState({ user: { ...user, ...updateData } });
      setIsEditing(false);
    } catch (err) { 
      setError("Failed to update profile: " + err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  // Simulated/Real Email OTP trigger
  const sendEmailOtp = async () => {
    setIsRequestingEmail(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/kyc/email/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'mock-token-demo'}`
        },
        body: JSON.stringify({ email: profile.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send verification code.');

      setEmailOtp(data.emailOtp);

      if (data.isSimulated) {
        triggerNotification(
          'email',
          '📩 Simulated Email Notification',
          `Your RentNear Email Verification Code is: ${data.emailOtp}.`
        );
      } else {
        triggerNotification(
          'email',
          '📩 Verification Email Sent',
          `An email with your verification code has been sent to ${profile.email}. Please check your inbox.`
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsRequestingEmail(false);
    }
  };

  const verifyEmail = async () => {
    setEmailVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/kyc/email/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'mock-token-demo'}`
        },
        body: JSON.stringify({
          otp: emailInputOtp,
          generatedOtp: emailOtp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Email verification failed.');

      if (isMock) {
        const localUsers = getLocalUsers();
        if (localUsers[user.email]) {
          localUsers[user.email].email_verified = true;
          saveLocalUsers(localUsers);
          useAuthStore.setState({ user: localUsers[user.email] });
          setProfile(localUsers[user.email]);
        }
      } else {
        setProfile({ ...profile, email_verified: true });
        useAuthStore.setState({ user: { ...user, email_verified: true } });
      }
      setShowEmailModal(false);
      setEmailInputOtp('');
      setEmailOtp('');
      triggerNotification('success', '✅ Email Verified', 'Your email address has been successfully verified.');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setEmailVerifying(false);
    }
  };

  // Simulated/Real Aadhaar OTP trigger
  const sendAadharOtp = async () => {
    const cleanAadhar = aadharNumber.replace(/\s+/g, '');
    if (cleanAadhar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setIsRequestingAadhar(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/kyc/aadhaar/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'mock-token-demo'}`
        },
        body: JSON.stringify({ aadharNumber: cleanAadhar })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request Aadhaar OTP.');

      setClientId(data.client_id);
      setIsSimulatedAadhar(data.isSimulated || false);

      if (data.isSimulated) {
        setAadharOtp(data.simulatedOtp);
        triggerNotification(
          'sms',
          '💬 UIDAI OTP Alert (Simulated)',
          `OTP for Aadhaar XX-XXXX-XXXX-${cleanAadhar.slice(-4)} is ${data.simulatedOtp}.`
        );
      } else {
        triggerNotification(
          'sms',
          '💬 UIDAI OTP Alert',
          `OTP has been sent to the mobile number registered with Aadhaar XX-XXXX-XXXX-${cleanAadhar.slice(-4)}.`
        );
      }
      setAadharStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to request Aadhaar OTP.');
    } finally {
      setIsRequestingAadhar(false);
    }
  };

  const verifyAadharOtp = async () => {
    setAadharVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/kyc/aadhaar/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'mock-token-demo'}`
        },
        body: JSON.stringify({
          client_id: clientId,
          otp: aadharInputOtp,
          isSimulated: isSimulatedAadhar,
          simulatedOtp: aadharOtp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Aadhaar verification failed.');

      if (isMock) {
        const localUsers = getLocalUsers();
        if (localUsers[user.email]) {
          const updated = { ...localUsers[user.email], ...data.user };
          localUsers[user.email] = updated;
          saveLocalUsers(localUsers);
          useAuthStore.setState({ user: updated });
          setProfile(updated);
        }
      } else {
        setProfile({ ...profile, ...data.user });
        useAuthStore.setState({ user: { ...user, ...data.user } });
      }
      setAadharStep('success');
      setAadharInputOtp('');
      setAadharOtp('');
      triggerNotification('success', '🏆 KYC Verification Complete', 'Aadhaar verified successfully! Your account is now fully trusted.');
    } catch (err) {
      setError(err.message || 'Aadhaar OTP verification failed.');
    } finally {
      setAadharVerifying(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true); setError(null);
      if (!event.target.files || event.target.files.length === 0) throw new Error('You must select an image to upload.');
      const file = event.target.files[0];
      
      if (isMock) {
        const publicUrl = URL.createObjectURL(file);
        const localUsers = getLocalUsers();
        if (localUsers[user.email]) {
          localUsers[user.email].avatar_url = publicUrl;
          saveLocalUsers(localUsers);
          useAuthStore.setState({ user: localUsers[user.email] });
          setProfile(localUsers[user.email]);
        }
        return;
      }

      const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfile({ ...profile, avatar_url: publicUrl });
      useAuthStore.setState({ user: { ...user, avatar_url: publicUrl } });
    } catch (err) { 
      setError("Error uploading image: " + err.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (!profile) return <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 text-red-600 rounded-xl">{error || "Profile not found."}</div>;

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Real-time Push Notification Simulation Overlay */}
      {notification && (
        <div className="fixed top-24 right-4 z-[9999] max-w-sm w-full bg-navy text-white rounded-2xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5)] border border-white/10 p-5 overflow-hidden animate-slide-in-right">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light flex-shrink-0">
              {notification.type === 'email' ? <Mail size={20} /> : <Smartphone size={20} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-primary-light tracking-wider uppercase">{notification.title}</span>
                <span className="text-[10px] text-gray-400 font-medium">Just now</span>
              </div>
              <p className="text-sm font-semibold text-gray-200 mt-1 leading-snug">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          {/* Animated progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-primary w-full animate-shrink-width"></div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-8">
          
          {/* Header Cover Banner */}
          <div className="h-48 md:h-64 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy-light to-primary opacity-90"></div>
          </div>
          
          <div className="px-6 md:px-12 pb-12 relative">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 sm:-mt-24 mb-8 gap-4">
              <div className="relative group">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[6px] border-white bg-gray-100 overflow-hidden shadow-xl relative">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <UserIcon size={64} className="md:w-20 md:h-20" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300">
                    {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div> : <><Camera size={28} className="mb-2" /><span className="text-xs font-semibold">Change Photo</span></>}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading}/>
                  </label>
                </div>
              </div>
              
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="secondary" className="flex items-center gap-2 rounded-xl bg-gray-50 border-gray-200">
                  <Edit2 size={16} /> Edit Details
                </Button>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
              
              {/* Left Column: Details & Edit Form */}
              <div className="lg:col-span-2 space-y-8">
                {isEditing ? (
                  <div className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100 space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Profile Details</h3>
                    <p className="text-sm text-gray-500 mb-6">Complete all details to maximize trust and bookings in your area.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary" />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Preference (Role)</label>
                        <select 
                          value={editForm.role} 
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="w-full border-gray-200 rounded-xl py-3 px-4 bg-white focus:ring-primary focus:border-primary"
                        >
                          <option value="both">Both (Owner & Renter)</option>
                          <option value="renter">Renter Only</option>
                          <option value="owner">Owner Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="block w-28 border border-gray-200 rounded-xl py-3 px-4 bg-white focus:ring-primary focus:border-primary"
                          >
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+971">+971 (AE)</option>
                            <option value="+61">+61 (AU)</option>
                          </select>
                          <input
                            type="tel"
                            value={phoneNum}
                            onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, ''))}
                            className="w-full border border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary"
                            placeholder="98765 43210"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City & Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            value={editForm.location} 
                            onChange={(e) => setEditForm({...editForm, location: e.target.value})} 
                            placeholder="e.g. Greater Noida, UP"
                            className="w-full pl-11 border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">UPI ID (For Payments/Earnings)</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            value={editForm.upi_id} 
                            onChange={(e) => setEditForm({...editForm, upi_id: e.target.value})} 
                            placeholder="e.g. name@upi"
                            className="w-full pl-11 border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Emergency Contact</label>
                        <input 
                          type="text" 
                          value={editForm.emergency_contact} 
                          onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})} 
                          placeholder="e.g. Family (+91 99999 88888)"
                          className="w-full border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">About / Bio</label>
                      <textarea 
                        rows={3} 
                        value={editForm.bio} 
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        placeholder="Tell your neighbors about yourself..."
                        className="w-full border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 rounded-xl">
                        {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                      </Button>
                      <Button onClick={() => setIsEditing(false)} disabled={saving} variant="secondary" className="flex items-center gap-2 bg-white rounded-xl">
                        <X size={16} /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                      <div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{profile.name}</h1>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            profile.kyc_verified 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <Shield size={12} />
                            {profile.kyc_verified ? 'Aadhaar Verified' : 'KYC Unverified'}
                          </span>

                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            profile.email_verified 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <Mail size={12} />
                            {profile.email_verified ? 'Email Verified' : 'Email Unverified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* About Me Bio Text */}
                    <div className="mb-10 relative mt-6">
                      <Quote size={40} className="absolute -top-4 -left-4 text-gray-100" />
                      <p className="text-gray-600 leading-relaxed relative z-10 text-sm md:text-base italic">
                        {profile.bio || "No bio details provided yet. Click Edit Details to add a bio!"}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Mail size={14}/> Email Address</h4>
                        <p className="text-gray-900 font-medium truncate">{profile.email}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Phone size={14}/> Phone Number</h4>
                        <p className="text-gray-900 font-medium">{profile.phone || 'Not provided'}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin size={14}/> Location</h4>
                        <p className="text-gray-900 font-medium">{profile.location || 'Not set (e.g. Greater Noida)'}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><CreditCard size={14}/> UPI ID (Payouts)</h4>
                        <p className="text-gray-900 font-medium">{profile.upi_id || 'Not set'}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Smartphone size={14}/> Emergency Contact</h4>
                        <p className="text-gray-900 font-medium">{profile.emergency_contact || 'Not set'}</p>
                      </div>

                      {profile.aadhar_number && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Shield size={14}/> Aadhaar Number</h4>
                          <p className="text-gray-900 font-medium">{profile.aadhar_number}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><UserIcon size={14}/> Account Role</h4>
                        <p className="text-gray-900 font-medium capitalize">{profile.role}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar size={14}/> Member Since</h4>
                        <p className="text-gray-900 font-medium">{formatDate(profile.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* State-of-the-Art Verification Center */}
                <div className="bg-[#FAFBFD] rounded-[2rem] p-6 md:p-8 border border-blue-100/50 mt-12 shadow-inner">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-primary" /> Verification Center
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Email Verification Row */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${profile.email_verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Mail size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm md:text-base">Email Verification</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Required to receive booking queries and receipts.</p>
                        </div>
                      </div>
                      
                      <div>
                        {profile.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3.5 py-1.5 rounded-full border border-green-200">
                            <CheckCircle2 size={14} /> Confirmed
                          </span>
                        ) : (
                          <button 
                            onClick={() => { setShowEmailModal(true); setError(null); }}
                            className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1 shadow-md shadow-primary/20"
                          >
                            Verify Email <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Aadhaar Verification Row */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${profile.kyc_verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Shield size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm md:text-base">Aadhaar Identity Verification</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Required to list tools and camera items.</p>
                        </div>
                      </div>
                      
                      <div>
                        {profile.kyc_verified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3.5 py-1.5 rounded-full border border-green-200">
                            <CheckCircle2 size={14} /> Aadhaar Verified
                          </span>
                        ) : (
                          <button 
                            onClick={() => { setShowAadharModal(true); setAadharStep('input'); setAadharNumber(''); setError(null); }}
                            className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1 shadow-md shadow-primary/20"
                          >
                            Verify KYC (OTP) <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Reputation & Stats */}
              <div className="bg-navy rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden h-fit lg:sticky lg:top-24">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
                <h3 className="text-xl font-bold mb-8 text-gray-100 relative z-10">Community Reputation</h3>
                
                <div className="mb-10 relative z-10">
                  <div className="text-5xl font-black text-primary-light mb-3">{profile.rating_average ? Number(profile.rating_average).toFixed(1) : 'New'}</div>
                  <div className="flex gap-1 text-yellow-400 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={24} fill={(profile.rating_average || 0) >= star ? "currentColor" : "transparent"} className={(profile.rating_average || 0) >= star ? "" : "opacity-30"}/>)}
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Based on {profile.rating_count || 0} reviews</p>
                </div>
                
                <div className="space-y-4 border-t border-gray-700/50 pt-8 mb-10 relative z-10">
                  <div className="flex justify-between items-center"><span className="text-gray-400 text-sm font-medium">Response Time</span><span className="font-bold text-white bg-white/10 px-3 py-1 rounded-full text-xs">Under 1 hour</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 text-sm font-medium">Completed Rentals</span><span className="font-bold text-white bg-white/10 px-3 py-1 rounded-full text-xs">24 items</span></div>
                </div>

                <div className="relative z-10">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-6">Recent Reviews</h4>
                  {reviews.length === 0 ? <p className="text-sm text-gray-500 italic">No reviews yet.</p> : (
                    <div className="space-y-4">
                      {reviews.slice(0, 2).map((review) => (
                        <div key={review.id} className="bg-gray-800/30 rounded-2xl p-5 border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {review.reviewer?.avatar_url ? <img src={review.reviewer.avatar_url} alt="Reviewer" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-primary/20 text-primary-light rounded-full flex items-center justify-center text-sm font-bold">{review.reviewer?.name?.charAt(0)}</div>}
                              <span className="text-sm font-bold text-gray-200">{review.reviewer?.name}</span>
                            </div>
                            <div className="flex text-yellow-400"><Star size={12} fill="currentColor" /><span className="text-xs ml-1 font-bold">{review.rating}</span></div>
                          </div>
                          {review.comment && <p className="text-sm text-gray-300 mt-2 leading-relaxed">"{review.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EMAIL VERIFICATION OTP MODAL
          ========================================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 animate-zoom-in">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Verify Email Address</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Verification code will be sent to {profile.email}</p>
                </div>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!emailOtp ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  To confirm ownership of this email address, click the button below. We will simulate sending a 6-digit OTP code to your inbox.
                </p>
                <button
                  type="button"
                  onClick={sendEmailOtp}
                  disabled={isRequestingEmail}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {isRequestingEmail ? 'Sending...' : 'Send OTP Code'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter 6-Digit OTP</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      maxLength={6}
                      value={emailInputOtp}
                      onChange={(e) => setEmailInputOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 border border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary text-center font-bold tracking-widest text-lg"
                      placeholder="XXXXXX"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={verifyEmail}
                    disabled={emailVerifying || emailInputOtp.length !== 6}
                    className="flex-1 bg-primary text-white font-bold py-3.5 rounded-2xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {emailVerifying ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={sendEmailOtp}
                    disabled={isRequestingEmail}
                    className="px-4 py-3.5 bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all text-xs"
                  >
                    {isRequestingEmail ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          AADHAAR IDENTITY VERIFICATION OTP MODAL
          ========================================================================= */}
      {showAadharModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 animate-zoom-in">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-sans">Aadhaar KYC Verification</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Instant verification via UIDAI OTP simulation</p>
                </div>
              </div>
              <button onClick={() => setShowAadharModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {aadharStep === 'input' && (
              <div className="space-y-4">
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
                        // Format with spaces as: XXXX XXXX XXXX
                        const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                        setAadharNumber(formatted);
                      }}
                      className="w-full pl-11 border border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary text-center font-bold tracking-widest text-lg"
                      placeholder="1234 5678 9012"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-normal">
                  Your details will be verified securely via UIDAI. A simulated 6-digit OTP code will be sent to your registered mobile number ending with <strong>{phoneNum ? phoneNum.slice(-4) : 'your phone number'}</strong>.
                </p>

                <button
                  type="button"
                  onClick={sendAadharOtp}
                  disabled={aadharNumber.replace(/\s+/g, '').length !== 12 || isRequestingAadhar}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {isRequestingAadhar ? 'Requesting OTP...' : 'Request Aadhaar OTP'}
                </button>
              </div>
            )}

            {aadharStep === 'otp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter 6-Digit SMS OTP</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      maxLength={6}
                      value={aadharInputOtp}
                      onChange={(e) => setAadharInputOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 border border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary text-center font-bold tracking-widest text-lg"
                      placeholder="XXXXXX"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={verifyAadharOtp}
                    disabled={aadharVerifying || aadharInputOtp.length !== 6}
                    className="flex-1 bg-primary text-white font-bold py-3.5 rounded-2xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {aadharVerifying ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={sendAadharOtp}
                    disabled={isRequestingAadhar}
                    className="px-4 py-3.5 bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all text-xs"
                  >
                    {isRequestingAadhar ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {aadharStep === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Aadhaar Verified</h4>
                <p className="text-sm text-gray-500 leading-relaxed px-4">
                  Congratulations! Your Aadhaar identity details have been successfully verified. You are now fully eligible to list products.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAadharModal(false)}
                  className="w-full bg-navy text-white font-bold py-3 rounded-2xl hover:bg-navy-light transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </AnimatedPage>
  );
};

export default Profile;
