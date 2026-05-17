import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, MapPin, ArrowRight, Star, Camera, Wrench, Tent, ChevronRight, Shield, Zap, RefreshCw } from 'lucide-react';

// Floating Product Card Component (Glassmorphism)
const FloatingCard = ({ title, price, icon: Icon, className, delay }) => (
  <div className={`absolute ${className} ${delay} animate-float bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 hidden lg:flex hover:bg-white/20 transition-all duration-300 cursor-pointer`}>
    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white shadow-inner">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-white font-semibold text-sm">{title}</p>
      <p className="text-primary-light text-xs font-bold">{price} <span className="text-gray-400 font-normal">/ day</span></p>
    </div>
  </div>
);

// Feature Bento Card
const BentoCard = ({ title, description, icon: Icon, span = "col-span-1" }) => (
  <div className={`group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${span}`}>
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 transform translate-x-4 -translate-y-4">
      <Icon size={120} />
    </div>
    <div className="w-14 h-14 bg-gray-50 group-hover:bg-primary/10 rounded-2xl flex items-center justify-center text-gray-700 group-hover:text-primary transition-colors duration-300 mb-6">
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed relative z-10">{description}</p>
  </div>
);

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      
      {/* 1. IMMERSIVE HERO SECTION (Dark Navy) */}
      <section className="relative min-h-[90vh] bg-navy flex items-center justify-center overflow-hidden pt-20 pb-32">
        {/* Animated Background Glowing Orbs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob delay-200"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob delay-400"></div>
        
        {/* Abstract Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}>
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-medium text-gray-300">RentNear 2.0 is live</span>
            <ChevronRight size={16} className="text-gray-400" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Rent what you need. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-blue-400 filter drop-shadow-[0_0_20px_rgba(18,194,145,0.3)]">
              From someone nearby.
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            The world's most elegant peer-to-peer rental marketplace. Save money, reduce waste, and connect with your neighborhood in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 items-center">
            <Link to="/products" className="w-full sm:w-auto group">
              <button className="relative w-full sm:w-auto px-8 py-4 bg-primary text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(13,158,117,0.3)] hover:shadow-[0_0_60px_rgba(13,158,117,0.5)]">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative flex items-center justify-center gap-2">
                  Browse Products <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link to="/list-product" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                List Your Item
              </button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col items-center justify-center opacity-0 animate-fade-in-up delay-300">
            <div className="flex -space-x-3 mb-4">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-navy bg-gray-700 flex items-center justify-center z-[${10-i}] shadow-lg overflow-hidden`}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=b6e3f4`} alt="User" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="flex text-yellow-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
              <span>Trusted by 10,000+ neighbors</span>
            </div>
          </div>
        </div>

        {/* Floating Elements (Visible on Large Screens) */}
        <FloatingCard 
          title="Sony A7III Camera" price="$35" icon={Camera} 
          className="top-32 left-10 xl:left-20" delay="" 
        />
        <FloatingCard 
          title="Makita Power Drill" price="$15" icon={Wrench} 
          className="bottom-40 left-20 xl:left-40" delay="delay-300" 
        />
        <FloatingCard 
          title="4-Person Camping Tent" price="$25" icon={Tent} 
          className="top-40 right-10 xl:right-20" delay="delay-[400ms]" 
        />
      </section>

      {/* 2. BENTO GRID FEATURES (Clean White/Gray) */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-20 -mt-10 bg-gray-50 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">Why RentNear</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Everything you need.<br/>Nothing you don't.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BentoCard 
              title="Identity Verified" 
              description="Every user goes through a bank-grade KYC identity verification process. Rent with absolute peace of mind."
              icon={ShieldCheck}
            />
            <BentoCard 
              title="Hyper-Local" 
              description="Our proprietary location algorithm connects you with neighbors on your street, saving you transit time."
              icon={MapPin}
            />
            <BentoCard 
              title="Instant Booking" 
              description="No more waiting for approvals. Real-time availability means you get what you need, exactly when you need it."
              icon={Zap}
            />
            {/* Large span card */}
            <div className="col-span-1 lg:col-span-3 group relative overflow-hidden bg-navy rounded-3xl p-10 border border-gray-800 shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row items-center justify-between">
               <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <div className="md:w-1/2 relative z-10 text-left mb-8 md:mb-0">
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary-light mb-6 backdrop-blur-md">
                   <RefreshCw size={28} />
                 </div>
                 <h3 className="text-3xl font-bold text-white mb-4">The Circular Economy, perfected.</h3>
                 <p className="text-gray-400 text-lg">Don't let your valuable items sit idle. Turn your garage into a passive income stream while helping your local community reduce waste.</p>
                 <Link to="/list-product" className="inline-flex items-center gap-2 mt-8 text-primary-light font-semibold hover:text-white transition-colors">
                   Start earning today <ArrowRight size={20} />
                 </Link>
               </div>
               
               {/* Decorative Graphic for the large card */}
               <div className="md:w-5/12 relative z-10 w-full">
                 <div className="relative w-full aspect-video bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm flex items-center justify-center p-4">
                    {/* Mock UI snippet */}
                    <div className="w-full bg-navy-light rounded-xl border border-gray-800 p-4 shadow-inner">
                      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                        <span className="text-gray-300 text-sm font-medium">Earnings this month</span>
                        <span className="text-primary-light font-bold">+$450.00</span>
                      </div>
                      <div className="space-y-3">
                        {[1,2,3].map((i) => (
                          <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-700"></div>
                              <div className="h-2 w-24 bg-gray-600 rounded"></div>
                            </div>
                            <div className="h-2 w-12 bg-primary/50 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Modern Steps) */}
      <section className="py-32 bg-white relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">How it works</h2>
              <p className="text-xl text-gray-600 mb-12">Three simple steps to access anything you need.</p>
              
              <div className="space-y-12">
                {[
                  { title: "Find it", desc: "Search our massive local inventory for exactly what you need.", icon: Search },
                  { title: "Book it", desc: "Select your dates and pay securely through our platform.", icon: Shield },
                  { title: "Use it", desc: "Meet your neighbor, pick it up, and get your project done.", icon: MapPin }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start group">
                    <div className="flex-shrink-0 relative">
                      <div className="w-16 h-16 bg-gray-50 group-hover:bg-primary rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                        <step.icon size={28} />
                      </div>
                      {idx !== 2 && <div className="absolute top-16 left-8 w-0.5 h-12 bg-gray-100 group-hover:bg-primary/30 transition-colors"></div>}
                    </div>
                    <div className="ml-6 pt-3">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              {/* Massive floating UI image representation */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-gray-100 to-gray-50 aspect-square border border-gray-200 shadow-2xl flex items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Mock Phone UI */}
                <div className="relative w-full max-w-sm h-full bg-white rounded-[2.5rem] border-8 border-gray-900 shadow-2xl overflow-hidden flex flex-col group-hover:scale-[1.02] transition-transform duration-700 ease-out">
                  {/* Phone Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-xl w-32 mx-auto z-20"></div>
                  
                  {/* Mock App Header */}
                  <div className="pt-10 pb-4 px-6 border-b border-gray-100">
                    <div className="h-6 w-3/4 bg-gray-200 rounded-full mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-primary rounded-full"></div>
                      <div className="h-8 w-24 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Mock App Content */}
                  <div className="flex-1 p-6 space-y-6 overflow-hidden bg-gray-50">
                    {[1,2,3].map((i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
                          <div className="h-4 w-1/3 bg-primary/20 rounded mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to join the movement?</h2>
          <p className="text-primary-light text-xl mb-10">Sign up today and get 20% off your first rental.</p>
          <Link to="/register">
            <button className="px-10 py-5 bg-white text-primary text-lg font-bold rounded-2xl shadow-2xl hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300">
              Create Free Account
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Landing;
