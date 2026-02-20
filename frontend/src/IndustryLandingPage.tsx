import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { X } from 'lucide-react';
import { PricingSection } from './components/PricingSection';
import { VideoPlayer } from './components/VideoPlayer';
import { LandingFAQ } from './components/LandingFAQ';
import { AnalyticsSmbUser } from './components/AnalyticsSmbUser';
import { ToolkitSmbUser } from './components/ToolkitSmbUser';
import { HeroWithDemo } from './components/HeroWithDemo';
import { FeaturesSection } from './components/FeaturesSection';

// ==========================================
// 🛠️ CONFIGURATION SECTION - EDIT THIS 🛠️
// ==========================================
//adding just to trigger a deployment for vercel
const CONFIG = {
  // SEO & Meta
  industryName: "Small Businesses", // e.g. "Real Estate Agents", "Dentists", "Restaurants"
  pageTitle: "Simple Website Checkup for Small Businesses",
  metaDescription: "Stop losing customers. Get an instant AI website analysis based on industry usability standards.",
  urlSlug: "simple-website-checkup", // The part of the URL after the domain
  
  // Hero Section
  heroTitle: "Simple Website Checkup",
  heroSubtitle: "for Small Businesses",
  heroDescription: "Stop losing customers. Our AI provides instant analysis based on industry usability standards to tell you exactly why visitors aren't buying.",
  
  // Pain Points Section
  painTitle: "If Your Website Isn’t Bringing in Calls, Bookings, or Sales, It’s Not Your Fault",
  painPoints: [
    "Most websites in this industry were never tested with real people before going live.",
    "Visitors get confused, lost, or distracted and leave before they click “Book now” or “Buy now.”",
    "Use our specially trained synthesized users to review your page at a fraction of the cost.",
    "A simple website checkup shows you exactly what to fix so your existing traffic works harder.",
    "Receive a prioritized checklist of fixes from a downloadable and comprehensive PDF report."
  ],

  // Personas (Select 3 defaults relevant to the industry)
  defaultPersonas: ['alex-busy-pro', 'charlie-family-worker', 'linda-business-owner'],
  
  // Pricing
  pricingSegment: "smb" // 'smb' or 'tech' (affects pricing card links)
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

const IndustryLandingPage: React.FC = () => {
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
    
    // Programmatically update meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', CONFIG.metaDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = CONFIG.metaDescription;
      document.head.appendChild(meta);
    }

    // Add Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://www.theproductshift.com/${CONFIG.urlSlug}`);

    // Add Open Graph Tags for Social SEO
    const setMeta = (attr: string, key: string, content: string) => {
      let m = document.querySelector(`meta[${attr}="${key}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute(attr, key);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    };
    
    setMeta('property', 'og:title', CONFIG.pageTitle);
    setMeta('property', 'og:description', CONFIG.metaDescription);
    setMeta('property', 'og:url', `https://www.theproductshift.com/${CONFIG.urlSlug}`);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', 'https://www.theproductshift.com/social-share.png');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', CONFIG.pageTitle);
    setMeta('name', 'twitter:description', CONFIG.metaDescription);
    setMeta('name', 'twitter:image', 'https://www.theproductshift.com/social-share.png');

    // Add JSON-LD Structured Data
    const scriptId = 'json-ld-software-app';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Product Shift Instant Insights",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free Demo Analysis" },
            "description": CONFIG.metaDescription,
            "featureList": "Instant AI Analysis, User Personas, Actionable Recommendations",
            "offeredBy": {
              "@type": "Organization",
              "name": "Product Shift",
              "url": "https://www.theproductshift.com"
            }
          }
        ]
      });
      document.head.appendChild(script);
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
            title="Find out why your users are converting or leaving"
            subtitle="See your site through the eyes of your customer."
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
            <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setIsVideoOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <X size={24} />
              </button>
              <VideoPlayer 
                src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4" 
                className="w-full"
              />
            </div>
          </div>
        )}
      </main>
  );
};

export default IndustryLandingPage;
