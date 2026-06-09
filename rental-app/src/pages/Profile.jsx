import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Camera, Edit2, Save, X, Star, User as UserIcon, Phone, Mail, Calendar, ShieldCheck, AlertCircle, Quote } from 'lucide-react';
import { MOCK_USER, MOCK_REVIEWS } from '../data/mockData';
import AnimatedPage from '../components/AnimatedPage';

const Profile = () => {
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(MOCK_USER);
        setEditForm({ name: MOCK_USER.name, phone: MOCK_USER.phone });
        setReviews(MOCK_REVIEWS);
        setLoading(false);
        return;
      }
      try {
        setLoading(true); setError(null);
        const { data, error: dbError } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (dbError || !data) throw dbError || new Error('no data');
        setProfile(data);
        setEditForm({ name: data.name || '', phone: data.phone || '' });

        let reviewsData = [];
        let reviewsError = null;
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/user/${user.id}?limit=3`);
          if (!res.ok) throw new Error('Failed to fetch reviews');
          reviewsData = await res.json();
        } catch (err) { reviewsError = err; }
        setReviews(reviewsError ? MOCK_REVIEWS : (reviewsData || MOCK_REVIEWS));
      } catch (err) {
        setProfile(MOCK_USER);
        setEditForm({ name: MOCK_USER.name, phone: MOCK_USER.phone });
        setReviews(MOCK_REVIEWS);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true); setError(null);
      const { error: updateError } = await supabase.from('users').update({ name: editForm.name, phone: editForm.phone }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfile({ ...profile, name: editForm.name, phone: editForm.phone });
      setIsEditing(false);
    } catch (err) { setError("Failed to update profile: " + err.message); } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true); setError(null);
      if (!event.target.files || event.target.files.length === 0) throw new Error('You must select an image to upload.');
      const file = event.target.files[0];
      const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (err) { setError("Error uploading image: " + err.message); } finally { setUploading(false); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (!profile) return <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 text-red-600 rounded-xl">{error || "Profile not found."}</div>;

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
                  <Edit2 size={16} /> Edit Profile
                </Button>
              )}
            </div>

            {error && <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start"><AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
              
              {/* Left Column: Details & Edit Form */}
              <div className="lg:col-span-2 space-y-8">
                {isEditing ? (
                  <div className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Public Details</h3>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phone Number</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full border-gray-200 rounded-xl py-3 px-4 focus:ring-primary focus:border-primary" /></div>
                      <div className="flex gap-3 pt-6">
                        <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 rounded-xl">{saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}</Button>
                        <Button onClick={() => setIsEditing(false)} disabled={saving} variant="secondary" className="flex items-center gap-2 bg-white rounded-xl"><X size={16} /> Cancel</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{profile.name}</h1>
                    <p className="text-gray-500 flex items-center gap-2 mb-8 font-bold">
                      <ShieldCheck size={20} className={profile.kyc_verified ? "text-green-500" : "text-gray-300"} />
                      {profile.kyc_verified ? <span className="text-green-600">Identity Verified User</span> : <span>Identity Unverified</span>}
                    </p>

                    {/* About Me Dummy Text */}
                    <div className="mb-10 relative">
                      <Quote size={40} className="absolute -top-4 -left-4 text-gray-100" />
                      <p className="text-gray-600 leading-relaxed relative z-10 text-sm md:text-base">
                        Hi neighbors! I'm a DIY enthusiast and part-time photographer. I believe in the power of the circular economy and sharing rather than hoarding. Feel free to reach out if you need advice on using any of my tools or camera gear. I take great care of my items and expect the same!
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Mail size={14}/> Email Address</h4><p className="text-gray-900 font-medium truncate">{profile.email}</p></div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Phone size={14}/> Phone Number</h4><p className="text-gray-900 font-medium">{profile.phone || 'Not provided'}</p></div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><UserIcon size={14}/> Account Role</h4><p className="text-gray-900 font-medium capitalize">{profile.role}</p></div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar size={14}/> Member Since</h4><p className="text-gray-900 font-medium">{formatDate(profile.created_at)}</p></div>
                    </div>
                  </div>
                )}

                {/* KYC Explanation Block */}
                <div className="bg-blue-50/50 rounded-3xl p-6 md:p-8 border border-blue-100 mt-12">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3 flex items-center gap-2"><ShieldCheck className="text-blue-500" /> Trust & Safety</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    RentNear is built on trust. That's why we mandate government ID checks (KYC) for all users before they can rent or list items. This ensures that every interaction is between verified, accountable members of the community.
                  </p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Your Data is encrypted and securely stored.</p>
                </div>

              </div>

              {/* Right Column: Reputation & Stats */}
              <div className="bg-navy rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden h-fit sticky top-24">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
                <h3 className="text-xl font-bold mb-8 text-gray-100 relative z-10">Community Reputation</h3>
                
                <div className="mb-10 relative z-10">
                  <div className="text-5xl font-black text-primary-light mb-3">{profile.rating_average ? Number(profile.rating_average).toFixed(1) : 'New'}</div>
                  <div className="flex gap-1 text-yellow-400 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={24} fill={(profile.rating_average || 0) >= star ? "currentColor" : "transparent"} className={(profile.rating_average || 0) >= star ? "" : "opacity-30"}/>)}
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Based on {profile.rating_count || 0} community reviews</p>
                </div>
                
                <div className="space-y-4 border-t border-gray-700/50 pt-8 mb-10 relative z-10">
                  <div className="flex justify-between items-center"><span className="text-gray-400 text-sm font-medium">Response Time</span><span className="font-bold text-white bg-white/10 px-3 py-1 rounded-full text-xs">Under 1 hour</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 text-sm font-medium">Completed Rentals</span><span className="font-bold text-white bg-white/10 px-3 py-1 rounded-full text-xs">24 items</span></div>
                </div>

                <div className="relative z-10">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-6">Recent Reviews</h4>
                  {reviews.length === 0 ? <p className="text-sm text-gray-500 italic">No reviews yet.</p> : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
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
    </AnimatedPage>
  );
};

export default Profile;
