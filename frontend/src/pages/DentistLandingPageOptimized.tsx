import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { PricingSection } from '../components/PricingSection';
import { VideoPlayer } from '../components/VideoPlayer';
import { LandingFAQ } from '../components/LandingFAQ';
import { AnalyticsSmbUser } from '../components/AnalyticsSmbUser';
import { ToolkitSmbUser } from '../components/ToolkitSmbUser';
import { HeroWithDemo } from '../components/HeroWithDemo';
import { FeaturesSection } from '../components/FeaturesSection';

// ==========================================
// 🛠️ CONFIGURATION SECTION
// ==========================================
const CONFIG = {
  // SEO & Meta
  industryName: "Dentists",
  pageTitle: "Get More New Patients from Your Dental Website | AI Audit",
  metaDescription: "Stop losing patients to confusing booking forms. Our AI analyzes your dental practice website to find the exact friction points.",
  urlSlug: "dentist-website-audit",
  
  // Hero Section
  heroTitle: "Get More New Patients",
  heroSubtitle: "from Your Dental Website",
  heroDescription: "" 
};

// --- Components ---

const AuthorityBanner = () => (
  <div className="w-full bg-marketing-gradient py-4 overflow-hidden relative">
    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
    <div className="container mx-auto px-4 text-center relative z-10">
      <p className="text-white font-black text-sm md:text-base uppercase tracking-widest drop-shadow-sm italic">
        Backed by Industry Standard heuristics & 15+ years of UX Research Experience
      </p>
    </div>
    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-150%); }
        100% { transform: translateX(150%); }
      }
    `}</style>
  </div>
);

const DentistLandingPageOptimized: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    // 1. Capture from URL
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('pendingReferral', ref);
    }

    // 2. Check for pending referral & Claim if logged in
    const checkAndClaim = async () => {
      const pendingRef = localStorage.getItem('pendingReferral');
      if (pendingRef) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          fetch('/api/user/claim-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, referralCode: pendingRef })
          }).then(res => res.json()).then(data => {
            if (data.success) {
              localStorage.removeItem('pendingReferral');
            }
          });
        }
      }
    };
    checkAndClaim();
  }, [searchParams]);

  useEffect(() => {
    document.title = `${CONFIG.pageTitle} | Product Shift`;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', CONFIG.metaDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = CONFIG.metaDescription;
      document.head.appendChild(meta);
    }
  }, []);

  // Background Animation Effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateOrbs = () => {
      const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      for (let i = 1; i <= 15; i++) {
        container.style.setProperty(`--orb-${i}-x`, `${r(-20, 120)}%`);
        container.style.setProperty(`--orb-${i}-y`, `${r(-20, 120)}%`);
      }
    };

    updateOrbs();
    const interval = setInterval(updateOrbs, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
      <main className="relative bg-white overflow-hidden" ref={containerRef}>
        {/* Global Background Blobs */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {[...Array(15)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-all duration-[4000ms] ease-in-out"
                style={{
                  left: `var(--orb-${i+1}-x, 50%)`,
                  top: `var(--orb-${i+1}-y, 50%)`,
                  width: `${300 + (i * 20)}px`,
                  height: `${300 + (i * 20)}px`,
                  backgroundColor: ['#ff1493', '#ff0000', '#ff8c00'][i % 3]
                }}
              />
            ))}
        </div>
        
        <div className="relative z-10">
          <HeroWithDemo 
            title={CONFIG.heroTitle}
            subtitle={CONFIG.heroSubtitle}
            description=""
          />
          <AnalyticsSmbUser />
          <AuthorityBanner />
          <ToolkitSmbUser />
          <hr className="border-t-2 border-black my-0" />
          <FeaturesSection onWatchVideo={() => setIsVideoOpen(true)} />
          <hr className="border-t-2 border-black my-0" />
          <PricingSection />
          <hr className="border-t-2 border-black my-0" />
          <LandingFAQ />
        </div>

        {/* Video Modal */}
        {isVideoOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsVideoOpen(false)}>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 z-50"
              >
                <X size={32} />
              </button>
              <VideoPlayer 
                src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4" 
              />
            </div>
          </div>
        )}
      </main>
  );
};

export default DentistLandingPageOptimized;