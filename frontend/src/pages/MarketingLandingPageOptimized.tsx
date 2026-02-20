import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart, Bot, Check, Users, AlertCircle, Lock, RefreshCw, Star, ChevronDown, ChevronUp, TrendingUp, Zap, CheckCircle, X } from 'lucide-react';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';
import { PricingSection } from '../components/PricingSection';
import { VideoPlayer } from '../components/VideoPlayer';
import { LandingFAQ } from '../components/LandingFAQ';
import { AnalyticsSmbUser } from '../components/AnalyticsSmbUser';
import { ToolkitUxTech } from '../components/ToolkitUxTech';

// ==========================================
// 🛠️ CONFIGURATION SECTION
// ==========================================
const CONFIG = {
  // SEO & Meta
  industryName: "UX Professionals & Product Teams",
  pageTitle: "AI-Powered UX Research Agent | Product Shift",
  metaDescription: "Instant usability testing with AI personas. Get feedback on your designs in seconds, not days.",
  urlSlug: "landingpg-aiuxagent",
  
  // Hero Section
  heroTitle: "AI-Powered UX Research",
  heroSubtitle: "Instant Usability Feedback",
  heroDescription: "Stop waiting for user recruitment. Simulate usability tests with AI personas to identify friction points, validate copy, and optimize conversion flows instantly.",
  
  // Pain Points Section
  painTitle: "Traditional User Testing is Too Slow for Modern Product Teams",
  painPoints: [
    "Recruiting quality participants takes days or weeks.",
    "Live sessions are expensive and hard to schedule.",
    "Feedback cycles slow down your sprint velocity.",
    "Get instant, unbiased feedback from synthesized personas.",
    "Scale your research without scaling your budget."
  ],

  // Personas (Select 3 defaults relevant to the industry)
  defaultPersonas: ['alex-busy-pro', 'marcus-c-suite', 'sarah-social-shopper'],
  
  // Pricing
  pricingSegment: "tech" 
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

const FeaturesSection = ({ onWatchVideo }: { onWatchVideo: () => void }) => (
  <section id="how-it-works" className="py-24 bg-white overflow-hidden">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="text-center mb-24">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Turn Visitors Into Buyers in 3 Steps</h2>
        <p className="text-xl text-gray-600">Stop guessing. Start converting. Here is how we reveal the hidden revenue on your site.</p>
        <button 
          onClick={onWatchVideo}
          className="text-gray-500 font-medium hover:text-indigo-600 transition-colors inline-flex items-center gap-2 mt-4"
        >
          Watch Video 🎬
        </button>
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* The Dotted Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-48 pointer-events-none -z-10">
          <svg width="100%" height="100%" viewBox="0 0 192 800" fill="none" preserveAspectRatio="none">
            <path d="M96 0 C-30 150, 222 250, 96 400 S -30 550, 96 800" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="10 10" strokeLinecap="round"/>
          </svg>
        </div>

        <div className="space-y-16">
          {/* Step 1 */}
          <div className="flex items-center gap-8">
            <img src="/youput.gif" alt="Input" className="w-96 h-96" />
            <div className="text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-2">1. Enter Your URL</h3>
              <p className="text-gray-600 font-medium">Paste your website link. No code to install, no complex setup. Just paste and go.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-8 flex-row-reverse">
            <img src="/wedo.gif" alt="Simulate" className="w-96 h-96" />
            <div className="text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-2">2. We Simulate Traffic</h3>
              <p className="text-gray-600 font-medium">Our AI agents browse your site like real humans, voicing their confusion and frustration in real-time.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-8">
            <img src="/youget.gif" alt="Reveal" className="w-72 h-72" />
            <div className="text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-2">3. You Get The Fixes</h3>
              <p className="text-gray-600 font-medium">Receive a prioritized checklist of exactly what to fix to stop losing sales immediately.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-center">
        <a href="#pricing" className="inline-flex items-center justify-center h-14 px-10 text-lg font-bold text-white bg-marketing-gradient rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          Start Free Now
        </a>
      </div>
    </div>
  </section>
);

const HeroWithDemo = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(5);
      const duration = 10000;
      const step = 200;
      interval = setInterval(() => {
        setProgress(old => {
          const newProgress = old + (100 / (duration / step));
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, step);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    // SELF-DIAGNOSIS LOGIC
    const cleanInputUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const currentHost = window.location.host;
    const isSelfTest = cleanInputUrl.includes(currentHost) || cleanInputUrl.includes('localhost') || cleanInputUrl === 'self';

    let requestBody: any = {
      url: `https://${url}`,
      personaIds: ['alex-busy-pro'],
      goal: 'Quickly understand what this page is about.'
    };

    if (isSelfTest) {
      console.log('🚀 Running Self-Diagnosis Mode (Bypassing Scraper)');
      requestBody.manualData = {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 10000),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: (h as HTMLElement).innerText })),
      };
    }

    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw { error: 'Server Error', details: `The server returned an unexpected response (${response.status}). Please try again later.` };
      }

      if (!response.ok) throw data;
      setResult(data);
    } catch (err: any) {
      let displayError = {
        error: err.error || 'Analysis Failed',
        details: err.details || err.message || 'An unexpected error occurred.',
        usageCounted: err.usageCounted
      };

      if (displayError.details.includes('All fallback models failed') || displayError.details.includes('providers failed')) {
        displayError.error = 'AI Services Temporarily Unavailable';
        displayError.details = 'We are unable to connect to our AI models at the moment. Please try again in a few minutes. You have not been charged for this attempt.';
        displayError.usageCounted = false;
      }

      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (result) {
    const session = result.userSessions?.[0];
    const recommendations = result.expertReport?.split('### Actionable Recommendations')[1] || "No recommendations found.";
    const firstIssueMatch = recommendations.match(/\*\*ISSUE:\*\* (.*?)\n/i);
    const userBubble = firstIssueMatch ? firstIssueMatch[1].trim().replace(/\.$/, '') + "." : "I've finished my review. Here are my thoughts.";

    return (
      <section id="demo" className="relative bg-transparent py-8 sm:py-12">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-12">
            <div className="text-center border-2 border-black bg-white px-8 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xl font-black text-black leading-none">User Mirror</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">by The ProductShift</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="flex flex-col items-center text-center">
                <img 
                  src={session.avatar} 
                  alt={session.persona} 
                  onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4`; }}
                  className="w-24 h-24 rounded-full border-2 border-black shadow-sm mb-3 bg-gray-100" />
                <h3 className="text-xl font-bold text-gray-900">{session.persona}</h3>
                <p className="text-sm text-gray-500">{session.description}</p>
              </div>
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border-2 border-black text-gray-800 relative">
                <div className="absolute left-1/2 -top-2 w-4 h-4 bg-blue-50 border-l-2 border-t-2 border-black transform rotate-45 -translate-x-1/2"></div>
                <p className="text-base italic text-gray-900 leading-relaxed">"{userBubble}"</p>
              </div>
            </div>
            <div className="lg:col-span-8 bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Recommendations</h3>
              <div className="prose prose-sm max-w-none">
                {formatDemoText(recommendations)}
              </div>
              <div className="mt-6 text-center border-t-2 border-gray-100 pt-6">
                <a href="#pricing" onClick={scrollToPricing} className="inline-block px-10 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-transform transform hover:-translate-y-0.5 shadow-lg">
                  Unlock Full Report
                </a>
                <p className="text-xs text-gray-500 mt-2">No credit card required to get started</p>
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => setResult(null)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <RefreshCw size={16} /> Run Another Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-transparent overflow-hidden pt-10 pb-20 lg:pt-20 lg:pb-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto relative">
          <div className="flex justify-center mb-12">
            <div className="text-center border-2 border-black bg-white px-8 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xl font-black text-black leading-none">User Mirror</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">by The ProductShift</p>
            </div>
          </div>

          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-4">
            {CONFIG.heroTitle}
          </h1>
          <p className="mt-3 text-xl text-gray-600 sm:mt-5 max-w-2xl mx-auto">
            {CONFIG.heroSubtitle}
          </p>
            
            <div className="mt-12 max-w-2xl mx-auto">
              {error && error.usageCounted === false ? (
                <div className="mb-6 animate-fade-in"><AnalysisErrorCard error={error} onReset={() => setError(null)} /></div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="relative">
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                      <span className="text-gray-500 text-lg font-bold">https://</span>
                    </div>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="block w-full border-2 border-black rounded-full py-5 pl-24 pr-40 text-lg shadow-[4px_4px_0px_0px_#000] focus:shadow-[6px_6px_0px_0px_#000] focus:outline-none transition-all"
                      placeholder="your-website.com"
                      required
                    />
                    <div className="absolute inset-y-2 right-2">
                      <button type="submit" disabled={isLoading} className="h-full px-6 bg-black text-white font-bold rounded-full flex items-center justify-center hover:bg-gray-800 transition-transform transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait">
                    {isLoading && <div className="absolute inset-0 bg-white/20" style={{ width: `${progress}%` }} />}
                        <span className="relative z-10">{isLoading ? 'Analyzing...' : 'Analyze'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
              <p className="text-xs text-gray-500 mt-4">
                No credit card nor sign in required
              </p>
              {error && error.usageCounted !== false && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2"><AlertCircle size={16} /><strong>Error:</strong> {error.details || error.error}</div>}
            </div>
          </div>
      </div>
    </section>
  );
};

const MarketingLandingPageOptimized: React.FC = () => {
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

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://www.theproductshift.com/${CONFIG.urlSlug}`);

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
          <HeroWithDemo />
          <AnalyticsSmbUser />
          <AuthorityBanner />
          <ToolkitUxTech />
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
            <div className="relative w-auto max-w-4xl mx-auto" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 z-50"
              >
                <X size={32} />
              </button>
              <VideoPlayer 
                src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4" 
                className="w-full max-w-none"
              />
            </div>
          </div>
        )}
      </main>
  );
};

export default MarketingLandingPageOptimized;