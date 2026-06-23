import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Building2, Users, Briefcase, Star, ChevronDown } from 'lucide-react';

const SECTIONS = [
  {
    id: 0, range: [0, 0.12],
    badge: '🏙️ Smart City Rentals',
    title: 'Discover Your\nPerfect Space',
    subtitle: 'Find apartments, PGs, hostels & offices — all near you.',
    color: '#0D9E75',
    icon: MapPin,
    showCTA: false,
    showScroll: true,
  },
  {
    id: 1, range: [0.12, 0.28],
    badge: '🏠 Residential District',
    title: 'Apartments &\nPG Rooms',
    subtitle: '10,000+ verified listings. From cozy studios to luxury apartments.',
    color: '#6366f1',
    icon: Building2,
    stat: { value: '10K+', label: 'Verified Listings' },
  },
  {
    id: 2, range: [0.28, 0.44],
    badge: '🎓 Student Zone',
    title: 'Hostels &\nAffordable PGs',
    subtitle: 'Budget-friendly stays near colleges, metro stations & markets.',
    color: '#f59e0b',
    icon: Users,
    stat: { value: '₹3k', label: 'Starting per month' },
  },
  {
    id: 3, range: [0.44, 0.60],
    badge: '💼 Business District',
    title: 'Office &\nCommercial Spaces',
    subtitle: 'Co-working desks to full floors. Scale your workspace instantly.',
    color: '#0ea5e9',
    icon: Briefcase,
    stat: { value: '500+', label: 'Office Spaces' },
  },
  {
    id: 4, range: [0.60, 0.76],
    badge: '✨ Luxury Area',
    title: 'Premium Living,\nReimagined',
    subtitle: 'Gated villas, penthouses and serviced apartments at your fingertips.',
    color: '#d97706',
    icon: Star,
    stat: { value: '5★', label: 'Premium Properties' },
  },
  {
    id: 5, range: [0.76, 0.90],
    badge: '📍 Hyperlocal Discovery',
    title: 'Every Rental\nWithin Reach',
    subtitle: 'Our smart map shows verified properties within your exact radius.',
    color: '#0D9E75',
    icon: MapPin,
    stat: { value: '< 2km', label: 'Average Distance' },
  },
  {
    id: 6, range: [0.90, 1.0],
    badge: '🚀 Get Started Today',
    title: 'Find Your\nPerfect Space',
    subtitle: 'Join 50,000+ happy tenants and owners on RentNear.',
    color: '#0D9E75',
    icon: MapPin,
    showCTA: true,
  },
];

const fadeVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

function SectionContent({ section }) {
  const Icon = section.icon;
  return (
    <motion.div
      key={section.id}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-2xl"
    >
      <motion.div variants={fadeVariants}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
        style={{ borderColor: `${section.color}44`, background: `${section.color}18`, color: section.color }}
      >
        <span className="text-sm font-bold tracking-wide">{section.badge}</span>
      </motion.div>

      <motion.h2 variants={fadeVariants}
        className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6 drop-shadow-2xl"
        style={{ textShadow: `0 0 60px ${section.color}55` }}
      >
        {section.title.split('\n').map((line, i) => (
          <span key={i} className="block">
            {i === 1 ? <span style={{ color: section.color }}>{line}</span> : line}
          </span>
        ))}
      </motion.h2>

      <motion.p variants={fadeVariants}
        className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-lg"
      >
        {section.subtitle}
      </motion.p>

      {section.stat && (
        <motion.div variants={fadeVariants}
          className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl mb-8"
          style={{ background: `${section.color}18`, border: `1px solid ${section.color}44` }}
        >
          <span className="text-4xl font-black" style={{ color: section.color }}>{section.stat.value}</span>
          <span className="text-gray-300 font-medium">{section.stat.label}</span>
        </motion.div>
      )}

      {section.showCTA && (
        <motion.div variants={fadeVariants} className="flex flex-col sm:flex-row gap-4">
          <Link to="/products"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg text-white transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)`, boxShadow: `0 8px 32px ${section.color}55` }}
          >
            Explore Properties <ArrowRight size={20} />
          </Link>
          <Link to="/register"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg border text-white transition-all hover:bg-white/10"
            style={{ borderColor: `${section.color}66` }}
          >
            List Your Space
          </Link>
        </motion.div>
      )}

      {section.showScroll && (
        <motion.div variants={fadeVariants} className="flex items-center gap-3 text-gray-400 mt-4">
          <ChevronDown size={20} className="animate-bounce" />
          <span className="text-sm font-medium tracking-widest uppercase">Scroll to explore the city</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CityOverlay({ scrollRef }) {
  const progressRef = useRef(0);
  const sectionIdxRef = useRef(0);
  const containerRef = useRef();

  useEffect(() => {
    let raf;
    const update = () => {
      const p = scrollRef.current || 0;
      const idx = SECTIONS.findIndex(s => p >= s.range[0] && p < s.range[1]);
      const activeIdx = idx === -1 ? SECTIONS.length - 1 : idx;

      if (sectionIdxRef.current !== activeIdx) {
        sectionIdxRef.current = activeIdx;
        // Force re-render by toggling a data attr
        if (containerRef.current) {
          containerRef.current.dataset.section = activeIdx;
        }
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef]);

  const currentSection = SECTIONS[sectionIdxRef.current] || SECTIONS[0];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10 flex items-center px-8 md:px-20"
      data-section="0"
    >
      {/* Progress indicator */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {SECTIONS.map((s, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full transition-all duration-500"
            style={{
              height: i === (sectionIdxRef.current) ? 32 : 8,
              background: i === (sectionIdxRef.current) ? s.color : '#ffffff33',
            }}
          />
        ))}
      </div>

      {/* Pointer events on the links need to be re-enabled */}
      <AnimatePresence mode="wait">
        <div key={currentSection.id} className="pointer-events-auto">
          <SectionContent section={currentSection} />
        </div>
      </AnimatePresence>
    </div>
  );
}
