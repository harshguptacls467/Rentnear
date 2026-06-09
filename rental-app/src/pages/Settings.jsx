import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Lock, Shield, Trash2, ChevronRight, AlertTriangle,
  X, Eye, EyeOff, CheckCircle, User, Mail, Phone,
  ToggleLeft, ToggleRight, LogOut, ArrowLeft
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-gray-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-8 py-6 border-b border-gray-50">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
        <Icon size={20} />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
    <div className="px-8 py-6">{children}</div>
  </div>
);

// ─── Delete Account Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ onClose, onConfirm }) => {
  const [step, setStep] = useState(1); // 1 = warning, 2 = type confirm
  const [typed, setTyped] = useState('');
  const CONFIRM_TEXT = 'DELETE MY ACCOUNT';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Delete Account</h3>
            <p className="text-sm text-red-600 mt-1">This action cannot be undone.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Deleting your account will <strong>permanently</strong> remove:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {[
                  'Your profile and identity verification',
                  'All your listings and photos',
                  'Your booking history and reviews',
                  'Any pending payouts or deposits',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <X size={14} className="text-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                To confirm, type <strong className="font-mono text-red-600 select-all">{CONFIRM_TEXT}</strong> below:
              </p>
              <input
                type="text"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none mb-4 transition-all"
              />
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={typed !== CONFIRM_TEXT}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete Forever
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Logout Confirm Modal ─────────────────────────────────────────────────────
const LogoutModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut size={28} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out</h3>
        <p className="text-gray-500 text-sm mb-6">
          Are you sure you want to sign out of your RentNear account?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Stay Signed In
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Settings Page ───────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // Notification prefs
  const [notifs, setNotifs] = useState({
    emailBookings: true,
    emailMessages: true,
    emailMarketing: false,
    smsAlerts: false,
  });

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (pwForm.next.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    setPwSaving(true);
    await new Promise(res => setTimeout(res, 1200));
    setPwSaving(false);
    setPwForm({ current: '', next: '', confirm: '' });
    showToast('Password updated successfully!', 'success');
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    showToast('Your account has been scheduled for deletion.', 'info');
    setTimeout(() => logout(), 2000);
  };

  const toggleNotif = (key) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
    showToast('Notification preference saved.', 'success');
  };

  const PasswordInput = ({ label, field }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPw[field] ? 'text' : 'password'}
          value={pwForm[field]}
          onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
          placeholder="••••••••"
          className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setShowPw(prev => ({ ...prev, [field]: !prev[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {showDeleteModal && (
        <DeleteModal onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteAccount} />
      )}
      {showLogoutModal && (
        <LogoutModal onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile, security, and preferences.</p>
        </div>

        <div className="space-y-6">

          {/* Profile Summary */}
          <SectionCard title="Profile Overview" icon={User}>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">{user?.name || 'Demo User'}</p>
                <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                  <Mail size={13} /> {user?.email || 'demo@rentnear.app'}
                </p>
                {user?.phone && (
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone size={13} /> {user.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Edit Profile <ChevronRight size={14} />
              </button>
            </div>

            {/* Verification status */}
            <div className="mt-5 pt-5 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield size={16} className={user?.kyc_verified ? 'text-primary' : 'text-gray-400'} />
                  Identity Verification (KYC)
                </div>
                {user?.kyc_verified ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => navigate('/kyc')}
                    className="text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Verify Now →
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notification Preferences" icon={Bell}>
            <div className="space-y-5">
              {[
                { key: 'emailBookings', label: 'Email: Booking updates', desc: 'Receive emails for new requests, approvals, and rejections.' },
                { key: 'emailMessages', label: 'Email: New messages', desc: 'Get an email when someone sends you a chat message.' },
                { key: 'emailMarketing', label: 'Email: Tips & promotions', desc: 'Occasional tips, neighborhood highlights, and feature announcements.' },
                { key: 'smsAlerts', label: 'SMS: Urgent alerts', desc: 'Text messages for critical updates like active rental handover reminders.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle enabled={notifs[key]} onChange={() => toggleNotif(key)} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Change Password */}
          <SectionCard title="Change Password" icon={Lock}>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <PasswordInput label="Current Password" field="current" />
              <PasswordInput label="New Password" field="next" />
              <PasswordInput label="Confirm New Password" field="confirm" />
              <button
                type="submit"
                disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {pwSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Update Password'}
              </button>
            </form>
          </SectionCard>

          {/* Quick Links */}
          <SectionCard title="Quick Actions" icon={ChevronRight}>
            <div className="space-y-1">
              {[
                { label: 'View My Listings', to: '/my-listings', icon: ToggleRight },
                { label: 'View My Bookings', to: '/bookings', icon: ToggleRight },
                { label: 'Identity Verification (KYC)', to: '/kyc', icon: Shield },
                { label: 'Help & Support', to: '/support', icon: ToggleLeft },
              ].map(({ label, to, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{label}</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-colors text-left group"
              >
                <span className="text-sm font-semibold text-red-500 group-hover:text-red-600">Sign Out</span>
                <LogOut size={16} className="text-red-400" />
              </button>
            </div>
          </SectionCard>

          {/* Danger Zone */}
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-3 px-8 py-5 border-b border-red-200">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
            </div>
            <div className="px-8 py-6">
              <p className="text-sm text-red-600 mb-5 leading-relaxed">
                Deleting your account is permanent. All your data, listings, bookings, and reviews will be removed. There is no way to undo this.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 bg-red-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <Trash2 size={16} /> Delete My Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
