import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart, Bot, Check, Users, AlertCircle, Lock, RefreshCw, Star, ChevronDown, ChevronUp, TrendingUp, Zap, CheckCircle, X, Target, Puzzle } from 'lucide-react';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';
import { LandingFAQ } from '../components/LandingFAQ';
import { PricingSection } from './components/PricingSection';
import { VideoPlayer } from './components/VideoPlayer';

// ==========================================
// 🛠️ CONFIGURATION SECTION - EDIT THIS 🛠️
// ==========================================
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

// --- Helper to format results ---
const formatDemoText = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const recommendations: JSX.Element[] = [];
  let issueFixPairs = 0;

  for (const line of lines) {
    if (line.toUpperCase().includes('**ISSUE:**') && issueFixPairs < 2) {
        recommendations.push(
          <div key={`issue-${issueFixPairs}`} className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-t-lg">
            <p className="text-gray-800"><strong className="font-bold text-gray-900">PROBLEM:</strong> {line.replace(/- \*\*ISSUE:\*\*/i, '').replace(/\*\*ISSUE:\*\*/i, '')}</p>
          </div>
        );
    } else if (line.toUpperCase().includes('**FIX:**') && issueFixPairs < 2) {
        recommendations.push(
          <div key={`fix-${issueFixPairs}`} className="mb-4 p-3 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm">
            <p className="text-gray-800"><strong className="font-bold text-gray-900">QUICK FIX:</strong> {line.replace('- **FIX:**', '').replace('**FIX:**', '')}</p>
          </div>
        );
        issueFixPairs++;
    }
  }

  if (issueFixPairs >= 2) {
    recommendations.push(
      <div key="teaser" className="relative mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-center overflow-hidden">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" />
        <div className="relative z-10">
          <Lock className="mx-auto text-gray-400 mb-2" />
          <p className="font-semibold text-gray-700">+1 more critical fix</p>
          <p className="text-xs text-gray-500">Join the waitlist to see the full report.</p>
        </div>
      </div>
    );
  }

  return recommendations;
};

// --- Components ---

const AuthorityBanner = () => (
  <div className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-4 overflow-hidden relative border-y-2 border-black">
    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
    <div className="container mx-auto px-4 text-center relative z-10">
      <p className="text-black font-black text-sm md:text-base uppercase tracking-widest drop-shadow-sm">
        Engineered using 15+ years of Human-Centered Design heuristics
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

const UseCasesSection = () => (
  <section className="py-24 bg-gray-50">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Your New Conversion Toolkit</h2>
        <p className="text-xl text-gray-600">Everything you need to understand your users.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Easy</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Enter any URL. Our AI agents, trained on millions of data points, perform a full usability audit. You get a detailed report in minutes.</p>
        </div>
        <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Useful</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Use it before a product launch, to diagnose a drop in sales, to optimize your ad spend, or even to run a full analysis on your competitor's website.</p>
        </div>
        <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Puzzle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Portable</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Audit on the fly. Get the User Mirror Chrome Extension to analyze any page you're browsing with a single click.</p>
          <a href="#" className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">Download Extension ↗</a>
        </div>
      </div>
      <div className="mt-16 text-center">
        <div className="inline-block">
          <a href="#pricing" className="inline-flex items-center justify-center h-14 px-10 text-lg font-bold text-white bg-marketing-gradient rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            Start Free Now
          </a>
        </div>
      </div>
    </div>
  </section>
);

const PainSection = () => (
const IndustryLandingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

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
    canonical.setAttribute('href', `https://app.theproductshift.com/${CONFIG.urlSlug}`);

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
    setMeta('property', 'og:url', `https://app.theproductshift.com/${CONFIG.urlSlug}`);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', 'https://app.theproductshift.com/social-share.png');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', CONFIG.pageTitle);
    setMeta('name', 'twitter:description', CONFIG.metaDescription);
    setMeta('name', 'twitter:image', 'https://app.theproductshift.com/social-share.png');

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
              "url": "https://app.theproductshift.com"
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
          <HeroSection />
          <PainSection />
          <AuthorityBanner />
          <UseCasesSection />
          <FeaturesSection />
          <hr className="border-t-2 border-black my-0" />
          <LandingFAQ />
        </div>

        {/* Video Modal */}
        <div id="video-modal" className="hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => document.getElementById('video-modal')?.classList.add('hidden')}>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => document.getElementById('video-modal')?.classList.add('hidden')}
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
      </main>
  );
};

export default IndustryLandingPage;