import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Building2, Users, Star, ShieldCheck, Briefcase, ChevronDown } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const FEATURES = [
  { icon: MapPin, title: 'Hyperlocal Search', desc: 'Discover rentals within your exact neighborhood radius', color: '#0D9E75' },
  { icon: ShieldCheck, title: 'KYC Verified', desc: 'Every owner and tenant verified through Aadhaar', color: '#6366f1' },
  { icon: Building2, title: '10K+ Listings', desc: 'Apartments, PGs, offices and more in your city', color: '#0ea5e9' },
  { icon: Star, title: 'Trusted Reviews', desc: 'Real ratings from real people in your community', color: '#f59e0b' },
];

const DISTRICTS = [
  { icon: Building2, name: 'Apartments & PGs', count: '4,200+', color: '#6366f1' },
  { icon: Users,     name: 'Hostels & Dorms',  count: '1,800+', color: '#f59e0b' },
  { icon: Briefcase, name: 'Office Spaces',    count: '560+',   color: '#0ea5e9' },
  { icon: Star,      name: 'Luxury Properties',count: '320+',   color: '#d97706' },
];

export default function MobileLanding() {
  return (
    <div className="min-h-screen bg-[#040810] text-white overflow-hidden">

      {/* === HERO === */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Animated city skyline background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Sky gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040810] via-[#071428] to-[#0a1f3a]" />
          {/* Stars */}
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 55}%`,
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
          {/* City silhouette */}
          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax slice">
            {/* Background buildings */}
            <rect x="0"   y="80"  width="30" height="100" fill="#0d2240" />
            <rect x="25"  y="50"  width="25" height="130" fill="#0a1a35" />
            <rect x="45"  y="70"  width="20" height="110" fill="#0d2240" />
            <rect x="60"  y="30"  width="35" height="150" fill="#0a1a35" />
            <rect x="90"  y="60"  width="22" height="120" fill="#0d2240" />
            <rect x="107" y="20"  width="40" height="160" fill="#0a1a35" />
            <rect x="142" y="50"  width="28" height="130" fill="#0d2240" />
            <rect x="165" y="10"  width="45" height="170" fill="#0a1a35" />
            <rect x="205" y="40"  width="30" height="140" fill="#0d2240" />
            <rect x="230" y="25"  width="38" height="155" fill="#0a1a35" />
            <rect x="263" y="60"  width="25" height="120" fill="#0d2240" />
            <rect x="283" y="35"  width="32" height="145" fill="#0a1a35" />
            <rect x="310" y="65"  width="22" height="115" fill="#0d2240" />
            <rect x="327" y="45"  width="28" height="135" fill="#0a1a35" />
            <rect x="350" y="75"  width="25" height="105" fill="#0d2240" />
            <rect x="370" y="55"  width="30" height="125" fill="#0a1a35" />
            {/* Window lights */}
            {[...Array(80)].map((_, i) => (
              <rect key={i}
                x={5 + (i * 29) % 390}
                y={25 + (i * 17) % 130}
                width="2" height="3"
                fill={['#4ade80','#60a5fa','#a78bfa','#fbbf24'][i % 4]}
                opacity={0.6 + (i % 3) * 0.2}
              />
            ))}
            {/* Ground */}
            <rect x="0" y="175" width="400" height="5" fill="#0D9E75" opacity="0.5" />
          </svg>

          {/* Moving cars */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-[12%]"
              style={{ height: 4, width: 12, background: ['#ef4444','#3b82f6','#ffffff','#f59e0b'][i], borderRadius: 2 }}
              animate={{ x: ['-5vw', '105vw'] }}
              transition={{ duration: 8 + i * 3, repeat: Infinity, delay: i * 2, ease: 'linear' }}
            />
          ))}

          {/* Glow orbs */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#0D9E75] rounded-full blur-[120px] opacity-10 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Hero content */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10 text-center max-w-lg">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0D9E75]/40 bg-[#0D9E75]/10 mb-6">
            <span className="w-2 h-2 bg-[#0D9E75] rounded-full animate-pulse" />
            <span className="text-[#0D9E75] text-xs font-bold tracking-widest uppercase">Smart City Rentals</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-black leading-[1.1] mb-4">
            Discover Your<br />
            <span className="text-[#0D9E75]" style={{ textShadow: '0 0 40px #0D9E7588' }}>
              Perfect Space
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-gray-400 text-base leading-relaxed mb-8">
            Apartments, PGs, hostels & offices — all verified, all near you.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <Link to="/products"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #0D9E75, #0a7a5a)', boxShadow: '0 8px 32px #0D9E7555' }}
            >
              Explore Properties <ArrowRight size={18} />
            </Link>
            <Link to="/map"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold border border-white/20 text-white hover:bg-white/5"
            >
              <MapPin size={18} /> View on Map
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-2 text-gray-500">
            <ChevronDown size={18} className="animate-bounce" />
            <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
          </motion.div>
        </motion.div>
      </section>

      {/* === DISTRICT GRID === */}
      <section className="px-6 pb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="text-3xl font-black mb-2 text-center">Every Space,<br /><span className="text-[#0D9E75]">One Platform</span></motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-center mb-8">Browse by your needs</motion.p>
          <div className="grid grid-cols-2 gap-4">
            {DISTRICTS.map((d, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-2xl p-5 border"
                style={{ background: `${d.color}12`, borderColor: `${d.color}33` }}
              >
                <d.icon size={24} style={{ color: d.color }} className="mb-3" />
                <p className="font-black text-white text-sm mb-1">{d.name}</p>
                <p className="font-bold" style={{ color: d.color }}>{d.count}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === FEATURES === */}
      <section className="px-6 pb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-4">
          <motion.h2 variants={fadeUp} className="text-3xl font-black mb-6">Why <span className="text-[#0D9E75]">RentNear?</span></motion.h2>
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={fadeUp}
              className="flex items-start gap-4 p-5 rounded-2xl border"
              style={{ background: `${f.color}0e`, borderColor: `${f.color}33` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}22` }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <div>
                <h3 className="font-black text-white mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* === CTA === */}
      <section className="px-6 pb-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="rounded-3xl p-8 text-center border border-[#0D9E75]/30"
          style={{ background: 'linear-gradient(135deg, #0D9E7515, #0a1a2a)' }}
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-black mb-3">
            Ready to find your<br /><span className="text-[#0D9E75]">perfect space?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-6">Join 50,000+ happy tenants on RentNear</motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <Link to="/register"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #0D9E75, #0a7a5a)', boxShadow: '0 8px 32px #0D9E7544' }}
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold border border-white/20 text-white">
              Browse Properties
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
