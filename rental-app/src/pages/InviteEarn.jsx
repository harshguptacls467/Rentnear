import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import { Gift, Copy, Check, Share2, Wallet, Users, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { API_URL } from '../config/api';

const InviteEarn = () => {
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();
  
  const [data, setData] = useState({
    referral_code: 'RENT-WIN10',
    wallet_balance: 10.00,
    reward_per_referral: 10.00,
    referral_count: 1,
    referrals: []
  });

  const [copied, setCopied] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/referrals/my`, {
      headers: { 'Authorization': `Bearer ${user.access_token || 'mock-token'}` }
    })
      .then(r => r.json())
      .then(d => { if (d.referral_code) setData(d); })
      .catch(() => {});
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Join RentNear to rent cameras, tools, and gear nearby. Use my code "${data.referral_code}" to get $10 free rental credit! Sign up here: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleClaimCode = async (e) => {
    e.preventDefault();
    if (!claimCode.trim()) return;
    setClaiming(true);
    setClaimMsg({ type: '', text: '' });
    try {
      if (isMock) {
        setClaimMsg({ type: 'success', text: 'Success! $10 store credit added to your wallet.' });
        setData(prev => ({ ...prev, wallet_balance: prev.wallet_balance + 10 }));
        setClaimCode('');
        return;
      }

      const res = await fetch(`${API_URL}/referrals/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ referral_code: claimCode.trim() })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || resData.error?.message || 'Failed to claim referral code');

      setClaimMsg({ type: 'success', text: resData.message });
      setClaimCode('');
      
      // Refresh wallet balance
      fetch(`${API_URL}/referrals/my`, {
        headers: { 'Authorization': `Bearer ${user.access_token}` }
      }).then(r => r.json()).then(d => { if (d.referral_code) setData(d); });

    } catch (err) {
      setClaimMsg({ type: 'error', text: err.message });
    } finally {
      setClaiming(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 text-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Please log in to view referral rewards</h2>
        <Button className="mt-4" onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Hero Card */}
        <div className="bg-gradient-to-r from-indigo-900 via-navy to-primary rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-primary-light border border-white/20 uppercase tracking-widest mb-4">
              <Gift size={14} /> Peer Referral Program
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              Invite Neighbors, <br /><span className="text-primary-light">Earn $10 Store Credit</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
              Give your friends $10 off their first rental, and get $10 credited to your wallet balance automatically as soon as they sign up.
            </p>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Your Referral Code</div>
                <div className="text-xl md:text-2xl font-mono font-black text-white">{data.referral_code}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 bg-white text-navy hover:bg-gray-100 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Share2 size={16} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Balance & Claim Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Wallet Balance Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">Store Credit Wallet</h3>
                    <p className="text-xs text-gray-400">Usable automatically on checkout</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Active Credit
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-navy">${data.wallet_balance?.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Applied directly as a discount on your next gear reservation.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={16} className="text-indigo-600" /> Credits never expire & roll over continuously.
            </div>
          </div>

          {/* Have a Referral Code Form */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-base mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Have a Referral Code?
            </h3>
            <p className="text-xs text-gray-500 mb-4">Enter a friend's code to claim your $10 welcome bonus.</p>

            <form onSubmit={handleClaimCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  placeholder="e.g. RENT-X892A"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {claimMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-bold ${claimMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {claimMsg.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={claiming || !claimCode.trim()}
                className="w-full py-3.5 text-xs font-bold rounded-xl"
              >
                {claiming ? 'Claiming Reward...' : 'Claim $10 Bonus Credit'}
              </Button>
            </form>
          </div>

        </div>

        {/* Invited Friends List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
            <Users size={18} className="text-indigo-600" /> Invited Friends & Rewards Log ({data.referral_count})
          </h3>

          {data.referrals && data.referrals.length > 0 ? (
            <div className="divide-y divide-gray-100 text-xs">
              {data.referrals.map((ref, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                      {ref.referred?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{ref.referred?.name || 'Referred Friend'}</div>
                      <div className="text-[10px] text-gray-400">Joined {new Date(ref.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    + $10.00 Credit
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No referrals yet. Share your unique code with friends to start earning!</p>
            </div>
          )}
        </div>

      </div>
    </AnimatedPage>
  );
};

export default InviteEarn;
