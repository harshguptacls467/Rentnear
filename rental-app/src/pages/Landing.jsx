import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, MapPin, ArrowRight, Star, Camera, Wrench, Tent, Zap, Sparkles, Map, ChevronDown, Leaf, DollarSign, Users, Quote, CheckCircle } from 'lucide-react';
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
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        className="flex gap-8 md:gap-12 px-4 md:px-6"
      >
        {categories.map((cat, i) => (
          <span key={i} className="text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 md:gap-3">
            <Sparkles size={14} className="text-primary-light" /> {cat}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

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

const AnimatedProductCard = ({ product }) => (
  <motion.div variants={fadeUp}>
    <TiltCard scaleOnHover={1.03}>
      <Link to={`/products/${product.id}`} className="group relative bg-navy-light rounded-3xl border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl">
        <div className="aspect-[4/3] overflow-hidden relative">
          <img src={product.images?.[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4">
            <span className="bg-white/10 backdrop-blur-md text-primary-light border border-white/10 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" /> Available
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded-2xl font-black shadow-lg text-sm md:text-base">
            ${product.price_per_day}<span className="text-[10px] md:text-xs font-medium opacity-80">/d</span>
          </div>
        </div>
        <div className="p-5 md:p-6 flex-1 flex flex-col bg-navy-light/90 backdrop-blur-sm">
          <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{product.category}</span>
          <h3 className="font-bold text-white text-lg md:text-xl leading-tight line-clamp-1 mb-2">{product.title}</h3>
          <div className="flex items-center text-gray-400 text-xs mt-auto pt-4 border-t border-white/5">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>
        </div>
      </Link>
    </TiltCard>
  </motion.div>
);

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-4 md:py-6">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center text-left focus:outline-none"
      >
        <h4 className="text-base md:text-xl font-bold text-white pr-4">{question}</h4>
        <ChevronDown 
          className={`text-primary flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          size={24} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 text-sm md:text-base mt-4 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 md:pt-32 md:pb-32 px-4">
        {/* Deep Parallax Background */}
        <motion.div style={{ y: y1, opacity: opacity1 }} className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 md:w-[600px] h-64 md:h-[600px] bg-primary rounded-full mix-blend-screen filter blur-[100px] md:blur-[150px] opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-56 md:w-[500px] h-56 md:h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] md:blur-[150px] opacity-20 animate-blob delay-300"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </motion.div>

        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 max-w-7xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 md:mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">RentNear 2.0 is live</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-6 md:mb-8">
            Rent what you need. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-teal-400 to-blue-500 filter drop-shadow-[0_0_30px_rgba(18,194,145,0.4)]">
              From someone nearby.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-base sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed px-4">
            Why buy when you can borrow? Join the world's most elegant peer-to-peer rental marketplace and save money while reducing waste.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 items-center px-4">
            <Link to="/products" className="w-full sm:w-auto">
              <TiltCard scaleOnHover={1.05}>
                <button className="relative w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-white text-navy font-black text-base md:text-lg rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Browse Neighborhood <ArrowRight size={20} />
                  </span>
                </button>
              </TiltCard>
            </Link>
            <Link to="/register" className="w-full sm:w-auto text-white font-bold hover:text-primary-light transition-colors py-4">
              List your item & earn
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12 md:mt-16 flex items-center justify-center gap-3 md:gap-4 text-gray-500 font-bold text-xs md:text-sm">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-800 border-2 border-navy overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=b6e3f4`} alt="user"/></div>)}
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

      {/* 2. HOW IT WORKS */}
      <section className="py-20 md:py-32 px-4 relative z-20 bg-navy-light border-b border-white/5">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16 md:mb-24">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              How <span className="text-primary-light">RentNear</span> works
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto">
              Renting from neighbors is easier, faster, and cheaper than going to a rental shop.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 z-0"></div>

            <motion.div variants={fadeUp} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-navy rounded-full border-4 border-primary/20 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(13,158,117,0.2)]">
                <Search size={40} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">1. Find what you need</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Browse thousands of items listed by verified people in your exact neighborhood. From power tools to party speakers, find it instantly.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-navy rounded-full border-4 border-primary/20 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(13,158,117,0.2)]">
                <CheckCircle size={40} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">2. Book & Secure</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Choose your dates and pay securely through the platform. Your money is held safely until the item is handed over to you.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-navy rounded-full border-4 border-primary/20 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(13,158,117,0.2)]">
                <Star size={40} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">3. Enjoy & Return</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Meet your neighbor, pick up the gear, and get your project done. Return it when finished and leave a quick review.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 3. PARALLAX DISCOVER SECTION */}
      <section className="py-20 md:py-32 px-4 relative z-20 bg-navy">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6 text-center md:text-left">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
                Available <span className="text-primary-light">near you.</span>
              </h2>
              <p className="text-base md:text-xl text-gray-400">Real items ready to be rented today.</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link to="/products" className="inline-flex items-center justify-center w-full md:w-auto gap-2 text-white font-bold bg-white/10 hover:bg-white/20 px-6 py-3 md:py-4 rounded-full transition-colors backdrop-blur-md">
                View All Items <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product) => (
              <AnimatedProductCard key={product.id} product={product} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* 4. WHY CHOOSE US (BENTO GRID) */}
      <section className="py-20 md:py-32 px-4 bg-navy-light relative border-y border-white/5">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 md:mb-6">Everything you need.<br/><span className="text-gray-500">Nothing you don't.</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg">We've built a platform that protects you, saves you money, and helps the planet. Experience the modern way of accessing goods.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <motion.div variants={fadeUp} className="col-span-1 md:col-span-2">
              <TiltCard>
                <div className="h-full bg-gradient-to-br from-primary/20 to-navy border border-primary/20 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-end relative overflow-hidden">
                  <ShieldCheck size={120} className="absolute -right-10 -top-10 text-primary opacity-20" />
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-6 md:mb-8">
                    <ShieldCheck size={28} className="md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4">Bank-Grade Verification</h3>
                  <p className="text-gray-400 text-sm md:text-lg leading-relaxed">
                    Every user on RentNear is identity verified through official government ID checks (KYC). Say goodbye to shady internet meetups. You are renting from verified, accountable neighbors.
                  </p>
                </div>
              </TiltCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TiltCard>
                <div className="h-full bg-navy border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-end">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-6 md:mb-8">
                    <DollarSign size={28} className="md:w-8 md:h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4">Save 90%</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Why pay $300 for a drill you'll use once? Rent it for $15. Keep your cash for what matters.
                  </p>
                </div>
              </TiltCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TiltCard>
                <div className="h-full bg-navy border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-end">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-6 md:mb-8">
                    <Leaf size={28} className="md:w-8 md:h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4">Eco-Friendly</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Sharing items means less manufacturing, less packaging, and less waste in landfills.
                  </p>
                </div>
              </TiltCard>
            </motion.div>

            {/* Parallax Map Box */}
            <motion.div variants={fadeUp} className="col-span-1 md:col-span-2 mt-2 md:mt-0">
              <TiltCard scaleOnHover={1.02}>
                <div className="bg-navy border border-white/10 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center h-auto md:h-[350px]">
                  <div className="p-8 md:p-12 md:w-1/2 z-10 w-full">
                    <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] md:text-sm mb-4 md:mb-6 uppercase tracking-widest">
                      Hyper-Local Map
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black text-white mb-3 md:mb-4">Find gear on your street.</h3>
                    <p className="text-gray-400 text-sm md:text-lg mb-6 md:mb-8">Our proprietary radius algorithm saves you transit time by showing exact distances.</p>
                    <Link to="/map" className="inline-flex items-center text-white font-bold text-sm md:text-base gap-2 hover:text-blue-400 transition-colors">
                      Open Map Search <ArrowRight size={18} />
                    </Link>
                  </div>
                  <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden bg-gray-900 border-t md:border-l border-white/10 flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 2, 0] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 opacity-50 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png')] bg-cover"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Map size={150} className="text-blue-500/20 md:w-[200px] md:h-[200px]" />
                      </div>
                    </motion.div>
                    
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bg-white text-navy font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs md:text-sm">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-primary rounded-full animate-pulse" /> 12 Items Near You
                    </motion.div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-20 md:py-32 px-4 bg-navy">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Loved by the <span className="text-primary-light">community</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Jenkins", role: "Rented a DSLR Camera", text: "I needed a professional camera for my sister's wedding but couldn't afford to buy one. RentNear connected me with David who lived 2 streets away. Saved me $800!" },
              { name: "Mike Roberts", role: "Earned $450 this month", text: "I listed my pressure washer and lawn mower. They used to just gather dust in the garage, now they pay for my monthly groceries. The KYC process makes me feel totally safe." },
              { name: "Emily Chen", role: "Rented Camping Gear", text: "We decided to go camping last minute. Instead of buying a $200 tent, I rented a huge 6-person tent for the weekend for just $30. The handover process was so smooth." }
            ].map((review, idx) => (
              <motion.div key={idx} variants={fadeUp} className="bg-navy-light border border-white/5 p-6 md:p-8 rounded-[2rem] relative">
                <Quote size={40} className="absolute top-6 right-6 text-white/5" />
                <div className="flex gap-1 text-yellow-400 mb-6">
                  {[1,2,3,4,5].map(star => <Star key={star} size={16} fill="currentColor" />)}
                </div>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 relative z-10">"{review.text}"</p>
                <div className="flex items-center gap-4 border-t border-white/5 pt-6 mt-auto">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}&backgroundColor=b6e3f4`} alt={review.name} className="w-12 h-12 rounded-full border border-white/10" />
                  <div>
                    <h4 className="text-white font-bold text-sm">{review.name}</h4>
                    <p className="text-gray-500 text-xs">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 md:py-32 px-4 bg-navy-light border-y border-white/5">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about the platform and how it works.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-2">
            <FAQItem 
              question="Is my item insured against damage?" 
              answer="Yes! RentNear holds a security deposit via credit card hold during the rental period. If an item is returned damaged, our comprehensive dispute resolution system ensures the owner is fairly compensated based on the pre- and post-rental condition checks." 
            />
            <FAQItem 
              question="How do I get paid for my rentals?" 
              answer="Payments are processed securely via Razorpay. Once the rental period is successfully completed without disputes, the funds are automatically transferred to your registered bank account within 2-3 business days." 
            />
            <FAQItem 
              question="What is the KYC verification process?" 
              answer="Safety is our top priority. Before anyone can rent an item, they must pass a Know Your Customer (KYC) check. This involves submitting a valid government ID (like a Passport, Driving License, or PAN card) which is verified by our automated system to ensure real identities." 
            />
            <FAQItem 
              question="Can I cancel a booking?" 
              answer="Yes, both owners and renters can cancel bookings. Renters get a full refund if they cancel 24 hours before the rental starts. If cancelled within 24 hours, a small cancellation fee may apply to compensate the owner." 
            />
          </motion.div>
        </motion.div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-24 md:py-40 relative overflow-hidden bg-primary px-4">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 md:mb-8 leading-[1.1]">
            Ready to join the <br/> sharing movement?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/80 text-lg md:text-2xl mb-10 md:mb-12 max-w-2xl mx-auto">
            Sign up today, list your unused items, and start earning. Or browse the neighborhood to find exactly what you need.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <TiltCard scaleOnHover={1.05}>
                <button className="w-full sm:w-auto px-8 py-4 md:px-12 md:py-6 bg-navy text-white text-lg md:text-xl font-black rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden group">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Start Renting Now <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </span>
                </button>
              </TiltCard>
            </Link>
            <Link to="/products" className="w-full sm:w-auto px-8 py-4 md:px-12 md:py-6 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 text-lg md:text-xl font-black rounded-2xl md:rounded-3xl transition-colors">
              Browse Items
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </AnimatedPage>
  );
};

export default Landing;
