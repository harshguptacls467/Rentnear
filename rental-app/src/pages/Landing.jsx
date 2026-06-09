import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, ShieldCheck, MapPin, ArrowRight, Star, Camera, Wrench, Tent, Shield, Zap, Sparkles, Map } from 'lucide-react';
import { MOCK_PRODUCTS } from '../data/mockData';
import AnimatedPage from '../components/AnimatedPage';
import TiltCard from '../components/TiltCard';

// ------------------------------
// Framer Motion Variants
// ------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

// ------------------------------
// Sub-components
// ------------------------------

// Infinite Marquee Strip
const CategoryStrip = () => {
  const categories = [
    "Photography Gear", "Power Tools", "Camping Equipment", 
    "Party Supplies", "Bicycles", "Drones", "Gaming Consoles",
    "Photography Gear", "Power Tools", "Camping Equipment"
  ];
  return (
    <div className="w-full overflow-hidden bg-navy-light/50 border-y border-white/5 py-4 whitespace-nowrap flex items-center">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
        className="flex gap-12 px-6"
      >
        {categories.map((cat, i) => (
          <span key={i} className="text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
            <Sparkles size={14} className="text-primary-light" /> {cat}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

// 3D Floating Hero Cards
const FloatingHeroCard = ({ title, price, icon: Icon, className, delayY }) => (
  <motion.div 
    animate={{ y: [0, -20, 0] }}
    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: delayY }}
    className={`absolute ${className} hidden lg:block z-20`}
  >
    <TiltCard scaleOnHover={1.1}>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 cursor-pointer">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white shadow-inner">
          <Icon size={24} />
        </div>
        <div>
          <p className="text-white font-bold text-sm drop-shadow-md">{title}</p>
          <p className="text-primary-light text-xs font-black">{price} <span className="text-gray-400 font-normal">/ day</span></p>
        </div>
      </div>
    </TiltCard>
  </motion.div>
);

// Animated Product Card
const AnimatedProductCard = ({ product }) => (
  <motion.div variants={fadeUp}>
    <TiltCard scaleOnHover={1.03}>
      <Link to={`/products/${product.id}`} className="group relative bg-navy-light rounded-3xl border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl">
        <div className="aspect-[4/3] overflow-hidden relative">
          <img src={product.images?.[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4">
            <span className="bg-white/10 backdrop-blur-md text-primary-light border border-white/10 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" /> Available
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-2xl font-black shadow-lg">
            ${product.price_per_day}<span className="text-xs font-medium opacity-80">/d</span>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col bg-navy-light/90 backdrop-blur-sm">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{product.category}</span>
          <h3 className="font-bold text-white text-xl leading-tight line-clamp-1 mb-2">{product.title}</h3>
          <div className="flex items-center text-gray-400 text-xs mt-auto pt-4 border-t border-white/5">
            <MapPin size={14} className="mr-1" />
            <span className="truncate">{product.location}</span>
          </div>
        </div>
      </Link>
    </TiltCard>
  </motion.div>
);

// ------------------------------
// Main Landing Page
// ------------------------------
const Landing = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity1 = useTransform(scrollY, [0, 400], [1, 0]);

  const featuredProducts = MOCK_PRODUCTS.slice(0, 4);

  return (
    <AnimatedPage className="bg-navy min-h-screen selection:bg-primary selection:text-white overflow-hidden">
      
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Deep Parallax Background */}
        <motion.div style={{ y: y1, opacity: opacity1 }} className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-blob delay-300"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </motion.div>

        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 max-w-7xl mx-auto px-4 text-center pb-32"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">RentNear 2.0 is live</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-8">
            Rent what you need. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-teal-400 to-blue-500 filter drop-shadow-[0_0_30px_rgba(18,194,145,0.4)]">
              From someone nearby.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            The world's most elegant peer-to-peer rental marketplace. 
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-6 items-center">
            <Link to="/products" className="w-full sm:w-auto">
              <TiltCard scaleOnHover={1.05}>
                <button className="relative w-full sm:w-auto px-10 py-5 bg-white text-navy font-black text-lg rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Browse Neighborhood <ArrowRight size={20} />
                  </span>
                </button>
              </TiltCard>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-16 flex items-center justify-center gap-4 text-gray-500 font-bold text-sm">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-navy overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=b6e3f4`} alt="user"/></div>)}
            </div>
            Trusted by 10,000+ neighbors
          </motion.div>
        </motion.div>

        {/* 3D Floating Elements */}
        <FloatingHeroCard title="Sony A7III Camera" price="$35" icon={Camera} className="top-1/4 left-[5%]" delayY={0} />
        <FloatingHeroCard title="Makita Power Drill" price="$15" icon={Wrench} className="bottom-1/3 left-[15%]" delayY={1} />
        <FloatingHeroCard title="4-Person Tent" price="$25" icon={Tent} className="top-1/3 right-[5%]" delayY={0.5} />
      </section>

      {/* Marquee Strip */}
      <CategoryStrip />

      {/* 2. PARALLAX DISCOVER SECTION */}
      <section className="py-32 px-4 relative z-20 bg-navy">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div variants={fadeUp}>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                Discover what's <span className="text-primary-light">available.</span>
              </h2>
              <p className="text-xl text-gray-400">Real items from real neighbors, ready today.</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link to="/products" className="inline-flex items-center gap-2 text-white font-bold bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full transition-colors backdrop-blur-md">
                View Directory <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <AnimatedProductCard key={product.id} product={product} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3. BENTO GRID FEATURES */}
      <section className="py-32 px-4 bg-navy-light relative border-y border-white/5">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-5xl font-black text-white tracking-tight mb-6">Everything you need.<br/><span className="text-gray-500">Nothing you don't.</span></h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={fadeUp} className="col-span-1 md:col-span-2">
              <TiltCard>
                <div className="h-full bg-gradient-to-br from-primary/20 to-navy border border-primary/20 rounded-[2.5rem] p-10 flex flex-col justify-end relative overflow-hidden">
                  <ShieldCheck size={120} className="absolute -right-10 -top-10 text-primary opacity-20" />
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-8">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">Bank-Grade KYC</h3>
                  <p className="text-gray-400 text-lg">Every user is identity verified. Rent with absolute peace of mind.</p>
                </div>
              </TiltCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TiltCard>
                <div className="h-full bg-navy border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-end">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-8">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">Instant</h3>
                  <p className="text-gray-400">No waiting. Real-time availability locks.</p>
                </div>
              </TiltCard>
            </motion.div>

            {/* Parallax Map Box */}
            <motion.div variants={fadeUp} className="col-span-1 md:col-span-3 mt-6">
              <TiltCard scaleOnHover={1.02}>
                <div className="bg-navy border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center h-[400px]">
                  <div className="p-12 md:w-1/2 z-10">
                    <div className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm mb-6 uppercase tracking-widest">
                      Hyper-Local Map
                    </div>
                    <h3 className="text-4xl font-black text-white mb-4">Find gear on your street.</h3>
                    <p className="text-gray-400 text-xl mb-8">Our proprietary radius algorithm saves you transit time.</p>
                    <Link to="/map" className="inline-flex items-center text-white font-bold gap-2 hover:text-blue-400 transition-colors">
                      Open Map Search <ArrowRight size={20} />
                    </Link>
                  </div>
                  <div className="md:w-1/2 h-full relative overflow-hidden bg-gray-900 border-l border-white/10 flex items-center justify-center">
                    {/* Simulated Map Parallax Effect inside box */}
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 2, 0] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 opacity-50 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png')] bg-cover"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Map size={200} className="text-blue-500/20" />
                      </div>
                    </motion.div>
                    
                    {/* Floating Pins */}
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bg-white text-navy font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" /> 12 Items Near You
                    </motion.div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="py-40 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-4xl mx-auto px-4 text-center relative z-10"
        >
          <motion.h2 variants={fadeUp} className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
            Ready to join the <br/> movement?
          </motion.h2>
          <motion.div variants={fadeUp}>
            <Link to="/register">
              <TiltCard scaleOnHover={1.1}>
                <button className="px-12 py-6 bg-navy text-white text-xl font-black rounded-3xl shadow-2xl overflow-hidden group">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Start Renting Now <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </span>
                </button>
              </TiltCard>
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </AnimatedPage>
  );
};

export default Landing;
