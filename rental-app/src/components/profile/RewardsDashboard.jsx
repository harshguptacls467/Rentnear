import { useState, useEffect } from 'react';
import { Gift, Wallet, ArrowUpRight, ArrowDownLeft, Share2, Copy, Users, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { rewardsService } from '../../api/rewardsService';
import Button from '../Button';

const RewardsDashboard = () => {
  const { user, session } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRewardsData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const token = session?.access_token;
        const [dashRes, txRes, refRes] = await Promise.all([
          rewardsService.getDashboard(user.id, token),
          rewardsService.getTransactions(user.id, token),
          rewardsService.getReferralsList(user.id, token)
        ]);
        setDashboard(dashRes);
        setTransactions(txRes.transactions || []);
        setReferrals(refRes.referrals || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRewardsData();
  }, [user, session]);

  const referralLink = `${window.location.origin}/signup?ref=${dashboard?.referralCode || user?.referral_code || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Hey! Use my invite code ${dashboard?.referralCode} to get a $10 welcome bonus on RentNear! Sign up here: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-primary to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-sm uppercase tracking-widest font-bold text-white/80 mb-2 flex items-center gap-2"><Wallet size={16} /> Reward Wallet</h2>
            <div className="text-5xl font-black">${(dashboard?.walletBalance || 0).toFixed(2)}</div>
            <p className="text-indigo-100 mt-2 text-sm">Available balance to spend on rentals.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center w-full md:w-auto">
            <div className="text-xs uppercase font-bold text-white/80 mb-1">Lifetime Earned</div>
            <div className="text-2xl font-black">${(dashboard?.lifetimeEarned || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Referral Link Sharing */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-shrink-0 bg-indigo-50 p-4 rounded-full text-indigo-600">
          <Gift size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Invite friends, get $15!</h3>
          <p className="text-gray-500 text-sm mb-4">Share your link. When a friend signs up and completes their first rental, you get $15 and they get $10.</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 w-full truncate select-all">
              {referralLink}
            </div>
            <Button onClick={handleCopy} variant={copied ? "primary" : "secondary"} className="w-full sm:w-auto whitespace-nowrap">
              {copied ? <><CheckCircle size={16} className="mr-2 inline" /> Copied</> : <><Copy size={16} className="mr-2 inline" /> Copy Link</>}
            </Button>
            <Button onClick={handleWhatsAppShare} className="w-full sm:w-auto whitespace-nowrap bg-green-500 hover:bg-green-600 text-white border-transparent">
              <Share2 size={16} className="mr-2 inline" /> WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Friends Tracker */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-primary" /> Invited Friends
              </h3>
              <p className="text-xs text-gray-500 mt-1">{dashboard?.successfulInvites || 0} Rewarded • {dashboard?.pendingInvites || 0} Pending</p>
            </div>
          </div>

          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">You haven't invited anyone yet.</p>
              </div>
            ) : (
              referrals.map(ref => (
                <div key={ref.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={ref.referred?.avatar_url || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
                    <div>
                      <div className="font-bold text-sm text-gray-900">{ref.referred?.name || 'Unknown User'}</div>
                      <div className="text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div>
                    {ref.status === 'rewarded' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                        <CheckCircle size={12} /> Rewarded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">
                        <Clock size={12} /> Pending Rental
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Ledger */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Transaction History
          </h3>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Wallet className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No transactions yet.</p>
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{tx.description}</div>
                      <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()} • {tx.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className={`font-black ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsDashboard;
