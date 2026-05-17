import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import { Camera, Edit2, Save, X, Star, User as UserIcon, Phone, Mail, Calendar, Shield, AlertCircle, UploadCloud } from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();
  
  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  
  // Upload State
  const [uploading, setUploading] = useState(false);

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (dbError) throw dbError;
        
        setProfile(data);
        setEditForm({ name: data.name || '', phone: data.phone || '' });
      } catch (err) {
        setError("Failed to load profile. Make sure your RLS policies are set correctly.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle Text Profile Updates
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: editForm.name, phone: editForm.phone })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setProfile({ ...profile, name: editForm.name, phone: editForm.phone });
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Avatar Upload to Supabase Storage
  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setError(null);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Create a unique file path: userId/timestamp.ext
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage bucket named 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update the users table with the new avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Update local state
      setProfile({ ...profile, avatar_url: publicUrl });
      
    } catch (err) {
      setError("Error uploading image: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 text-red-600 rounded-xl">
        {error || "Profile not found."}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Cover Banner */}
        <div className="h-48 bg-gradient-to-r from-navy to-primary relative"></div>
        
        <div className="px-8 pb-12 relative">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 sm:-mt-20 mb-8 gap-4">
            <div className="relative group">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <UserIcon size={64} />
                  </div>
                )}
                
                {/* Upload Overlay (Hover) */}
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300">
                  {uploading ? (
                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Camera size={28} className="mb-2" />
                      <span className="text-xs font-semibold">Change Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="secondary" className="flex items-center gap-2">
                <Edit2 size={16} /> Edit Profile
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
            
            {/* Left Column: Details & Edit Form */}
            <div className="lg:col-span-2 space-y-8">
              {isEditing ? (
                // EDIT MODE
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Public Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border-gray-300 rounded-lg py-2.5 px-3 border focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full border-gray-300 rounded-lg py-2.5 px-3 border focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2">
                        {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                      </Button>
                      <Button onClick={() => setIsEditing(false)} disabled={saving} variant="secondary" className="flex items-center gap-2 bg-white">
                        <X size={16} /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h1>
                  <p className="text-gray-500 flex items-center gap-2 mb-8">
                    <Shield size={16} className={profile.kyc_verified ? "text-primary" : "text-gray-400"} />
                    {profile.kyc_verified ? "Identity Verified" : "Identity Unverified"}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</h4>
                      <p className="flex items-center gap-3 text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Mail className="text-primary" size={20} /> {profile.email}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number</h4>
                      <p className="flex items-center gap-3 text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Phone className="text-primary" size={20} /> {profile.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Account Role</h4>
                      <p className="flex items-center gap-3 text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 capitalize">
                        <UserIcon className="text-primary" size={20} /> {profile.role}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Member Since</h4>
                      <p className="flex items-center gap-3 text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Calendar className="text-primary" size={20} /> {formatDate(profile.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Reputation & Stats */}
            <div className="bg-navy rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-6 text-gray-100">Community Reputation</h3>
              
              <div className="mb-8">
                <div className="text-4xl font-black text-primary-light mb-2">4.9</div>
                <div className="flex gap-1 text-yellow-400 mb-2">
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" className="opacity-50" />
                </div>
                <p className="text-sm text-gray-400">Based on 24 community reviews</p>
              </div>
              
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Items Rented</span>
                  <span className="font-bold text-white">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Items Listed</span>
                  <span className="font-bold text-white">{profile.role === 'renter' ? '0' : '4'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Response Time</span>
                  <span className="font-bold text-white">&lt; 1 hour</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
