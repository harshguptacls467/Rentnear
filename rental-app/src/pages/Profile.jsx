import { useEffect, useState } from 'react'
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import TextArea from '../components/TextArea';

import { 
  Camera, Edit2, Save, X, Star, User as UserIcon, Phone, Mail, Calendar, 
  ShieldCheck, AlertCircle, Quote, MapPin, CreditCard, Shield, Lock, 
  CheckCircle2, Key, Smartphone, ChevronRight, TrendingUp
} from 'lucide-react';
import { MOCK_USER, MOCK_REVIEWS } from '../data/mockData';
import { getLocalUsers, saveLocalUsers } from '../utils/localDb';
import AnimatedPage from '../components/AnimatedPage';
import ProfileAnalytics from '../components/profile/ProfileAnalytics';

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

const profileSchema = z.object({
  upi_id: z.string().trim().refine(val => {
    if (!val) return true; // Optional field
    return /^[\w.-]+@[\w.-]+$/.test(val);
  }, {
    message: "Invalid UPI ID format. Should be like username@bankname"
  }),
  emergency_contact: z.string().trim().refine(val => {
    if (!val) return true; // Optional field
    const digits = val.replace(/\D/g, '');
    return digits.length >= 7;
  }, {
    message: "Emergency contact must contain at least 7 digits."
  })
});

const Profile = () => {
  const { user, session, isMock, initialize } = useAuthStore();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({ upi_id: '', emergency_contact: '' });
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
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);
  const [isSimulatedOtp, setIsSimulatedOtp] = useState(false);
  const [profileTab, setProfileTab] = useState('overview');

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
      setValidationErrors({ upi_id: '', emergency_contact: '' });

      const validationResult = profileSchema.safeParse({
        upi_id: editForm.upi_id,
        emergency_contact: editForm.emergency_contact
      });

      if (!validationResult.success) {
        const fieldErrors = { upi_id: '', emergency_contact: '' };
        validationResult.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
        setSaving(false);
        return;
      }

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
      setIsSimulatedOtp(!!data.isSimulated);

      if (data.isSimulated) {
        // OTP shown directly in modal — no need for toast
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

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true); setError(null);
      if (!event.target.files || event.target.files.length === 0) throw new Error('You must select an image to upload.');
      const file = event.target.files[0];
      
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Only image files (JPEG, PNG, JPG, WEBP) are allowed.');
      }
      
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

            {!isEditing && (
              <div className="flex gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1 mb-6">
                <button
                  onClick={() => setProfileTab('overview')}
                  className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                    profileTab === 'overview'
                      ? 'text-primary border-primary font-black'
                      : 'text-gray-400 border-transparent hover:text-gray-700'
                  }`}
                >
                  <UserIcon size={16} />
                  Overview & Verification
                </button>
                <button
                  onClick={() => setProfileTab('analytics')}
                  className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                    profileTab === 'analytics'
                      ? 'text-primary border-primary font-black'
                      : 'text-gray-400 border-transparent hover:text-gray-700'
                  }`}
                >
                  <TrendingUp size={16} />
                  Earnings & Analytics
                </button>
              </div>
            )}

            {isEditing || profileTab === 'overview' ? (
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
                            className={`w-full pl-11 border rounded-xl py-3 px-4 focus:ring-primary focus:border-primary ${validationErrors.upi_id ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'}`} 
                          />
                        </div>
                        {validationErrors.upi_id && <p className="text-red-500 text-xs mt-1 font-bold">{validationErrors.upi_id}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Emergency Contact</label>
                        <input 
                          type="text" 
                          value={editForm.emergency_contact} 
                          onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})} 
                          placeholder="e.g. Family (+91 99999 88888)"
                          className={`w-full border rounded-xl py-3 px-4 focus:ring-primary focus:border-primary ${validationErrors.emergency_contact ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'}`} 
                        />
                        {validationErrors.emergency_contact && <p className="text-red-500 text-xs mt-1 font-bold">{validationErrors.emergency_contact}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">About / Bio</label>
                      <TextArea
                        id="bio"
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        placeholder="Tell your neighbors about yourself..."
                        maxLength={300}
                        className=""
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

                    {/* KYC Verification Row */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${profile.kyc_verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Shield size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm md:text-base">Identity Verification (KYC)</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Required to list tools and camera items.</p>
                        </div>
                      </div>
                      
                      <div>
                        {profile.kyc_verified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3.5 py-1.5 rounded-full border border-green-200">
                            <CheckCircle2 size={14} /> KYC Verified
                          </span>
                        ) : profile.kyc_status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
                            <AlertCircle size={14} /> Pending Review
                          </span>
                        ) : (
                          <button 
                            onClick={() => navigate('/kyc')}
                            className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1 shadow-md shadow-primary/20"
                          >
                            Verify KYC <ChevronRight size={14} />
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
            ) : (
              <div className="mt-8">
                <ProfileAnalytics />
              </div>
            )}
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
                  To confirm ownership of this email address, click the button below. A 6-digit OTP code will be sent to your inbox.
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
                {/* Show OTP directly in modal when simulated (no Resend API) */}
                {isSimulatedOtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-2">📩 Your OTP Code (Dev Mode)</p>
                    <p className="text-3xl font-black tracking-widest text-amber-700">{emailOtp}</p>
                    <p className="text-xs text-amber-500 mt-1">Email not configured — use this code directly</p>
                  </div>
                )}
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

    </AnimatedPage>
  );
};

export default Profile;
