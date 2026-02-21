import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart, Bot, Check, Users, AlertCircle, Lock, RefreshCw, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';
import { LandingFAQ } from '../components/LandingFAQ';
import { PricingSection } from '../components/PricingSection';

// ==========================================
// 🛠️ CONFIGURATION SECTION - EDIT THIS 🛠️
// ==========================================
const CONFIG = {
  // SEO & Meta
  industryName: "Real Estate Agents",
  pageTitle: "Convert More Real Estate Website Visitors into Clients | AI Audit",
  metaDescription: "Learn how to convert more real estate website visitors into clients. Our AI analyzes your realtor website to find the exact friction points costing you commissions.",
  urlSlug: "convert-more-real-estate-website-visitors",
  
  // Hero Section
  heroTitle: "Convert More Real Estate",
  heroSubtitle: "Website Visitors into Clients",
  heroDescription: "Struggling to convert more real estate website visitors into clients? Most realtor websites look the same and leak leads. Our AI provides instant analysis based on home buyer psychology to tell you exactly why visitors aren't booking showings.",
  
  // Pain Points Section
  painTitle: "Why You Aren't Converting More Real Estate Website Visitors into Clients",
  painPoints: [
    "Most agent websites are generic templates that weren't tested with real home buyers.",
    "Visitors get overwhelmed by IDX search tools and leave before clicking 'Schedule Showing'.",
    "Use our AI home buyer personas (like 'First Time Buyer' or 'Wealthy Investor') to review your page.",
    "A simple checkup shows you exactly what to fix so your existing traffic turns into commissions.",
    "Receive a prioritized checklist of fixes to improve your lead capture immediately."
  ],

  // Personas (Select 3 defaults relevant to the industry)
  defaultPersonas: ['alex-busy-pro', 'charlie-family-worker', 'elizabeth-wealthy-elite'],
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

const HeroSection = () => (
  <section className="relative bg-transparent overflow-hidden">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
        <main className="mt-10 mx-auto max-w-7xl sm:mt-12 md:mt-16 lg:mt-20 xl:mt-28">
          <div className="text-center lg:text-left lg:w-1/2">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block xl:inline">{CONFIG.heroTitle}</span>{' '}
              <span className="block text-indigo-600 xl:inline">{CONFIG.heroSubtitle}</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              {CONFIG.heroDescription}
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                <a href="#demo" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-base">
                  Try Our Free Demo
                </a>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <a href="#pricing" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-sm font-bold rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-base">
                  See Our Simple Pricing
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    {/* Visual Element (AI Agents) */}
    <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-transparent flex items-center justify-center pointer-events-none">
      <div className="p-8 w-full">
         <div className="relative w-full max-w-lg mx-auto h-auto md:h-[500px] flex flex-col md:block gap-8 md:gap-0">
            {/* Card 1: Alex */}
            <div className="relative md:absolute md:bottom-10 md:left-0 z-20 flex flex-col items-center transform -rotate-2 hover:rotate-0 transition-transform duration-300">
               <div className="relative bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] mb-3 w-56 text-center">
                  <p className="text-sm text-gray-800 font-medium leading-snug">"I can't find the pricing page. I'm frustrated."</p>
                  <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-black transform rotate-45 -translate-x-1/2 z-10"></div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="p-1.5 bg-white rounded-full shadow-lg">
                    <img src="https://api.dicebear.com/9.x/notionists/svg?seed=Avery" className="w-24 h-24 rounded-full bg-indigo-50" alt="AI Agent" />
                  </div>
                  <div className="mt-3 text-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                     <p className="font-bold text-gray-900 text-sm">Alex (AI Customer)</p>
                     <p className="text-xs text-green-600 flex items-center justify-center gap-1 mt-0.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Browsing your site...</p>
                  </div>
               </div>
            </div>
            {/* Card 2: Marcus */}
            <div className="relative md:absolute md:top-10 md:right-0 z-10 flex flex-col items-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
               <div className="relative bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] mb-3 w-56 text-center">
                  <p className="text-sm text-gray-800 font-medium leading-snug">"This checkout form is asking for way too much info. I'm leaving."</p>
                  <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-black transform rotate-45 -translate-x-1/2 z-10"></div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="p-1.5 bg-white rounded-full shadow-lg">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Marcus" className="w-24 h-24 rounded-full bg-indigo-50" alt="AI Agent" />
                  </div>
                  <div className="mt-3 text-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                     <p className="font-bold text-gray-900 text-sm">Marcus (AI Customer)</p>
                     <p className="text-xs text-green-600 flex items-center justify-center gap-1 mt-0.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Browsing your site...</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  </section>
);

const PainSection = () => (
  <section className="bg-transparent py-16 sm:py-24">
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          {CONFIG.painTitle}
        </h2>
        <ul className="space-y-6 text-lg text-gray-700">
          {CONFIG.painPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black ${i < 2 ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                {i < 2 ? <span className="text-gray-600 font-bold">!</span> : <Check className="text-indigo-600" size={16} />}
              </div>
              <p>{point}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="how-it-works" className="relative bg-transparent py-16 sm:py-24 z-10">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] relative">
      <div className="text-center">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wider uppercase">How It Works</h2>
        <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          Check your website in 3 simple steps
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Our AI customers browse your site just like real people, so you can fix confusing parts before you lose sales.
        </p>
      </div>
      <div className="mt-20 grid md:grid-cols-3 gap-x-8 gap-y-12 text-left">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">1. Choose Who Tests</h3>
            <p className="mt-1 text-base text-gray-600">Choose from 8 different types of customers (like "Busy Mom" or "College Student") to see who matches your audience.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Bot size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">2. Run the Check</h3>
            <p className="mt-1 text-base text-gray-600">The AI visits your site and tries to understand what you sell, noting anything that is confusing.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">3. Get Your Results</h3>
            <p className="mt-1 text-base text-gray-600">Get a simple report showing exactly what to fix to help more visitors become customers.</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  </section>
);

const DemoSection = () => {
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

    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://${url}`,
          personaIds: ['alex-busy-pro'],
          goal: 'Quickly understand what this page is about.'
        }),
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
    const userBubble = session?.analysis?.split('|||USER_BUBBLE|||')[1]?.split('|||USER_DETAILS|||')[0]?.trim() || "Analysis complete.";
    const recommendations = result.expertReport?.split('### Actionable Recommendations')[1] || "No recommendations found.";

    return (
      <section id="demo" className="bg-gray-50 py-24 sm:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Demo Result for <span className="text-indigo-600">{result.title}</span></h2>
            <p className="mt-4 text-lg text-gray-600">Here is what our AI customer thought of your site.</p>
          </div>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <img 
                  src={session.avatar} 
                  alt={session.persona} 
                  onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4`; }}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-3 bg-gray-100" />
                <h3 className="text-xl font-bold text-gray-900">{session.persona}</h3>
                <p className="text-sm text-gray-500">{session.description}</p>
              </div>
              <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 text-gray-800 relative">
                <div className="absolute left-1/2 -top-2 w-4 h-4 bg-blue-50 border-l border-t border-blue-100 transform rotate-45 -translate-x-1/2"></div>
                <div className="relative">
                  <p className="text-base italic text-gray-700 leading-relaxed blur-sm select-none">"{userBubble}"</p>
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                      <a href="#pricing" onClick={scrollToPricing} className="text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm hover:bg-indigo-200 transition-colors cursor-pointer flex items-center">
                          <Lock size={12} className="inline-block mr-1" />
                          Unlock Feedback
                      </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Recommendations</h3>
              <div className="prose prose-sm max-w-none">
                {formatDemoText(recommendations)}
              </div>
              <div className="mt-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200 text-center relative">
                <div className="relative z-10">
                  <Lock className="mx-auto text-indigo-400 mb-2" size={32} />
                  <h4 className="font-bold text-indigo-800">Unlock the Full Report</h4>
                  <p className="text-sm text-indigo-700 mt-1">Get the complete analysis and feedback from 5 more personas.</p>
                  <a href="#pricing" onClick={scrollToPricing} className="mt-4 inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5">
                    Get Full Access
                  </a>
                </div>
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
    <section id="demo" className="bg-gray-800 text-white py-24 sm:py-32">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Try It Now: Free Demo Website Checkup</h2>
        {error && error.usageCounted === false ? (
          <div className="mt-8 animate-fade-in"><AnalysisErrorCard error={error} onReset={() => setError(null)} theme="dark" /></div>
        ) : (
          <>
            <p className="mt-6 text-lg text-gray-300">Our AI customer, Alex, will visit your site and tell you if she understands what you do.</p>
            <form onSubmit={handleDemoSubmit} className="mt-8 max-w-xl mx-auto flex flex-col gap-3">
              <div className="flex items-center bg-gray-900/50 border border-gray-600 rounded-md focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="pl-4 text-gray-400">https://</span>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-grow px-2 py-3 text-white bg-transparent border-none focus:outline-none focus:ring-0" placeholder="your-website.com" required />
              </div>
              <button type="submit" disabled={isLoading} className="relative overflow-hidden px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait">
                {isLoading && <div className="absolute inset-0 bg-white/20" style={{ width: `${progress}%` }} />}
                <span className="relative z-10">{isLoading ? 'Checking...' : 'Check My Site'}</span>
              </button>
            </form>
            {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-200 flex items-center gap-2 max-w-xl mx-auto"><AlertCircle size={16} /><strong>Error:</strong> {error.details || error.error}</div>}
          </>
        )}
      </div>
    </section>
  );
};

const TestimonialsSection = () => (
  <section className="bg-indigo-900 py-24">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-extrabold text-white mb-12">Trusted by {CONFIG.industryName}</h2>
      <p className="text-indigo-200 text-lg mb-12 -mt-8">What Other Business Owners See After a Website Checkup</p>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Sarah J.", role: "Business Owner", text: "I thought my site was clear until Alex pointed out I didn't have a buy button above the fold. Fixed it and sales went up." },
          { name: "Mike T.", role: "Local Service Provider", text: "Simple, fast, and brutal. Exactly what I needed to hear to fix my contact form." },
          { name: "Elena R.", role: "Freelancer", text: "I use this for all my clients now before I launch their sites. It catches things I miss." }
        ].map((t, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] text-left relative">
            <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white border-b-2 border-r-2 border-black transform rotate-45"></div>
            <div className="flex justify-center mb-4 text-yellow-400">
              {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
            </div>
            <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
            <p className="text-gray-900 font-bold">{t.name}</p>
            <p className="text-indigo-600 text-sm">{t.role}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const RealtorLandingPage: React.FC = () => {
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
          <HeroSection />
          <hr className="border-t-2 border-black my-0" />
          <DemoSection />
          <hr className="border-t-2 border-black my-0" />
          <PainSection />
          <hr className="border-t-2 border-black my-0" />
          <FeaturesSection />
          <hr className="border-t-2 border-black my-0" />
          <TestimonialsSection />
          <hr className="border-t-2 border-black my-0" />
          <PricingSection />
          <hr className="border-t-2 border-black my-0" />
          <LandingFAQ />
        </div>
      </main>
  );
};

export default RealtorLandingPage;