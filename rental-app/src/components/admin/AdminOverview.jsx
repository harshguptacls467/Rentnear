import { Users, Package, Clock, AlertOctagon, DollarSign, Activity, CheckCircle2, TrendingUp } from 'lucide-react';

const AdminOverview = ({ stats }) => {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      desc: `${stats.verifiedUsers} Verified Accounts`,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-100/50"
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      desc: `${stats.activeListings} Active Listings`,
      icon: Package,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-100/50"
    },
    {
      title: "Total Revenue",
      value: `₹${Number(stats.revenue).toLocaleString()}`,
      desc: `₹${Number(stats.platformCommission).toLocaleString()} Commission`,
      icon: DollarSign,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-100/50"
    },
    {
      title: "Bookings Today",
      value: stats.bookingsToday,
      desc: `${stats.liveRentals} Live Rentals`,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-100/50"
    },
    {
      title: "Open Disputes",
      value: stats.openDisputes,
      desc: `₹${Number(stats.refunds).toLocaleString()} Refunded`,
      icon: AlertOctagon,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-100/50"
    },
    {
      title: "System Status",
      value: stats.systemHealth || 'Healthy',
      desc: "All Systems Operational",
      icon: Activity,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      border: "border-teal-100/50"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">Key Performance Indicators</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-4 shadow-sm border ${card.border} hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-navy tracking-tight truncate">
                  {card.value}
                </div>
                <div className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-green-500" />
                  {card.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOverview;
