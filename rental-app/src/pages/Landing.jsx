import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import MobileLanding from '../components/MobileLanding';

// Lazy-load the heavy 3D scene only on desktop
const CityScene3D = lazy(() => import('../components/city/CityScene3D'));
const CityOverlay = lazy(() => import('../components/city/CityOverlay'));

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

function DesktopCityExperience() {
  const scrollRef = useRef(0); // 0-1 progress, updated without causing re-renders

  useEffect(() => {
    // Hide the footer / global layout while this page is active
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
    return () => { if (footer) footer.style.display = ''; };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      scrollRef.current = scrollTop / maxScroll;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      id="city-scroll-container"
      style={{ position: 'relative', height: '700vh' }}
    >
      {/* Sticky viewport — canvas + overlay pinned here while user scrolls */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* 3D Canvas */}
        <Suspense fallback={<CityLoadingFallback />}>
          <CityScene3D scrollRef={scrollRef} />
        </Suspense>

        {/* HTML Story Overlay */}
        <Suspense fallback={null}>
          <CityOverlay scrollRef={scrollRef} />
        </Suspense>

        {/* Top gradient to blend with navbar */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#040810] to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}

function CityLoadingFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#040810]">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-[#0D9E75]/20 border-t-[#0D9E75] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#0D9E75]/40 animate-pulse" />
        </div>
      </div>
      <p className="text-[#0D9E75] font-bold text-sm tracking-widest uppercase animate-pulse">
        Loading City...
      </p>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1 rounded-full bg-[#0D9E75]"
            style={{ height: 16, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const isMobile = useIsMobile();

  // Mobile: beautiful 2D animated page
  if (isMobile) {
    return <MobileLanding />;
  }

  // Desktop: full immersive 3D city
  return <DesktopCityExperience />;
}
