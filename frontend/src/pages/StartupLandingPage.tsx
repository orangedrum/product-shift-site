// frontend/src/pages/StartupLandingPage.tsx
// NEW FILE: Variation B targeting Startups & Entrepreneurs

import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart, Bot, Rocket, Zap, Users, AlertCircle, Lock, Check, RefreshCw, Star, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';

// --- Helper to format results (Shared Logic) ---
const formatDemoText = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const recommendations: JSX.Element[] = [];
  let issueFixPairs = 0;

  for (const line of lines) {
    if (line.toUpperCase().includes('**ISSUE:**') && issueFixPairs < 2) {
        recommendations.push(
          <div key={`issue-${issueFixPairs}`} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-t-lg">
            <p className="text-gray-800"><strong className="font-bold text-red-700">FRICTION POINT:</strong> {line.replace(/- \*\*ISSUE:\*\*/i, '').replace(/\*\*ISSUE:\*\*/i, '')}</p>
          </div>
        );
    } else if (line.toUpperCase().includes('**FIX:**') && issueFixPairs < 2) {
        recommendations.push(
          <div key={`fix-${issueFixPairs}`} className="mb-4 p-3 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm">
            <p className="text-gray-800"><strong className="font-bold text-green-700">OPTIMIZATION:</strong> {line.replace('- **FIX:**', '').replace('**FIX:**', '')}</p>
          </div>
        );
        issueFixPairs++;
    }
  }

  if (issueFixPairs >= 2) {
    recommendations.push(
      <div key="teaser" className="relative mt-4 p-4 bg-gray-900 border border-gray-800 rounded-lg text-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm" />
        <div className="relative z-10">
          <Lock className="mx-auto text-gray-400 mb-2" />
          <p className="font-semibold text-white">+1 more critical insight</p>
          <p className="text-xs text-gray-400">Unlock full audit to view.</p>
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
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-4">
              <Rocket size={14} className="mr-2" /> For Startups & SaaS
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Is Your MVP</span>{' '}
              <span className="block text-indigo-600 xl:inline">Leaking Users?</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              Don't burn ad spend on a leaky funnel. Get a brutal, data-driven UX audit from AI user personas in 3 minutes.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                <a href="#demo" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-base">
                  Audit My Site
                </a>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <a href="#pricing" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-sm font-bold rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-base">
                  View Plans
                </a>
              </div>
            </div>
          </div>
        </main>
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
          personaIds: ['marcus-c-suite'], // Use C-Suite for Startup/B2B context
          goal: 'Evaluate the value proposition and pricing clarity.'
        }),
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw { error: 'Server Error', details: `The server returned an unexpected response (${response.status}).` };
      }

      if (!response.ok) throw data;
      setResult(data);
    } catch (err: any) {
      setError({
        error: err.error || 'Analysis Failed',
        details: err.details || err.message || 'An unexpected error occurred.',
        usageCounted: err.usageCounted
      });
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
      <section id="demo" className="bg-gray-900 py-24 sm:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Audit Result for <span className="text-indigo-400">{result.title}</span></h2>
            <p className="mt-4 text-lg text-gray-400">AI Persona: Marcus (C-Suite Exec)</p>
          </div>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <img 
                  src={session.avatar} 
                  alt={session.persona} 
                  onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=b6e3f4`; }}
                  className="w-24 h-24 rounded-full border-4 border-gray-700 shadow-lg mb-3 bg-gray-100" />
                <h3 className="text-xl font-bold text-white">{session.persona}</h3>
                <p className="text-sm text-gray-400">{session.description}</p>
              </div>
              <div className="mt-6 bg-indigo-900/30 p-4 rounded-lg border border-indigo-500/30 text-gray-200 relative">
                <p className="text-base italic leading-relaxed blur-sm select-none">"{userBubble}"</p>
                <div className="absolute inset-0 flex items-center justify-center">
                    <a href="#pricing" onClick={scrollToPricing} className="text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-500 transition-colors cursor-pointer flex items-center">
                        <Lock size={12} className="inline-block mr-2" />
                        Unlock Insight
                    </a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Critical Friction Points</h3>
              <div className="prose prose-sm max-w-none">
                {formatDemoText(recommendations)}
              </div>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <h4 className="font-bold text-gray-900">Scale Your Conversion Rate</h4>
                <p className="text-sm text-gray-600 mt-1">Get the full report to see why users are dropping off.</p>
                <a href="#pricing" onClick={scrollToPricing} className="mt-4 inline-block px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-transform transform hover:-translate-y-0.5">
                  Unlock Full Audit
                </a>
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => setResult(null)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <RefreshCw size={16} /> Run Another Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="demo" className="bg-gray-900 text-white py-24 sm:py-32">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Free MVP Health Check</h2>
        {error && error.usageCounted === false ? (
          <div className="mt-8 animate-fade-in"><AnalysisErrorCard error={error} onReset={() => setError(null)} theme="dark" /></div>
        ) : (
          <>
            <p className="mt-6 text-lg text-gray-300">Enter your landing page URL. Our AI will simulate a C-Suite executive evaluating your product.</p>
            <form onSubmit={handleDemoSubmit} className="mt-8 max-w-xl mx-auto flex flex-col gap-3">
              <div className="flex items-center bg-black/50 border border-gray-700 rounded-md focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="pl-4 text-gray-500">https://</span>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-grow px-2 py-3 text-white bg-transparent border-none focus:outline-none focus:ring-0" placeholder="your-startup.com" required />
              </div>
              <button type="submit" disabled={isLoading} className="relative overflow-hidden px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-transform transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait">
                {isLoading && <div className="absolute inset-0 bg-white/20" style={{ width: `${progress}%` }} />}
                <span className="relative z-10">{isLoading ? 'Auditing...' : 'Run Audit'}</span>
              </button>
            </form>
            {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-200 flex items-center gap-2 max-w-xl mx-auto"><AlertCircle size={16} /><strong>Error:</strong> {error.details || error.error}</div>}
          </>
        )}
      </div>
    </section>
  );
};

const PricingSection = () => (
  <section id="pricing" className="bg-white py-24 sm:py-32">
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">ROI-Focused Pricing</h2>
      <p className="mt-4 text-gray-500">Cheaper than one hour of a UX consultant's time.</p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Pack 3 */}
        <div className="pricing-card bg-gray-50 p-6 border border-gray-200 rounded-xl shadow-sm text-left flex flex-col hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-center text-gray-900">MVP Check</h3>
          <div className="text-center mt-4">
            <p className="text-4xl font-extrabold text-gray-900">$14</p>
            <p className="text-gray-500">one-time</p>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center px-2">3 tests. Validate your landing page, pricing, and signup flow before launch.</p>
          <hr className="my-6" />
          <Link to="/login?plan=pack-3&segment=tech" className="mt-8 block w-full text-center px-6 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors">
            Buy Pack
          </Link>
        </div>

        {/* Pack 15 */}
        <div className="pricing-card bg-white p-6 border-2 border-indigo-600 rounded-xl shadow-xl text-left flex flex-col relative transform md:-translate-y-4">
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full">Growth Choice</div>
          <h3 className="text-xl font-bold text-center text-gray-900 mt-2">Growth Pack</h3>
          <div className="text-center mt-4">
            <p className="text-4xl font-extrabold text-gray-900">$69</p>
            <p className="text-gray-500">one-time</p>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center px-2">15 tests. Perfect for iterating on A/B tests and optimizing multiple funnels.</p>
          <hr className="my-6" />
          <Link to="/login?plan=pack-15&segment=tech" className="mt-8 block w-full text-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-transform transform hover:-translate-y-0.5">
            Buy Pack
          </Link>
        </div>

        {/* Subscription */}
        <div className="pricing-card bg-gray-50 p-6 border border-gray-200 rounded-xl shadow-sm text-left flex flex-col hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-center text-gray-900">Agency / SaaS</h3>
          <div className="text-center mt-4">
            <p className="text-4xl font-extrabold text-gray-900">$29</p>
            <p className="text-gray-500">per month</p>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center px-2">10 tests/mo. Continuous optimization for active product teams.</p>
          <hr className="my-6" />
          <Link to="/login?plan=starter&segment=tech" className="mt-8 block w-full text-center px-6 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors">
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "Can this audit my SaaS dashboard?", a: "Yes. If your dashboard is public or has a demo login, our agents can test it. For behind-login testing, contact us for enterprise plans." },
    { q: "How does this compare to UserTesting.com?", a: "UserTesting costs ~$100+ per test and takes hours. We cost $2 per test and take 3 minutes. We are the best first step before spending big budget." },
    { q: "Is the AI feedback actually useful?", a: "Yes. It uses NN/g heuristics to identify objective usability flaws. It won't tell you if your logo is 'pretty', but it will tell you if your navigation is broken." },
  ];

  return (
    <section className="bg-transparent py-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Founder FAQs</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-gray-900">{faq.q}</span>
                {openIndex === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {openIndex === i && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-gray-700 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StartupLandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('pendingReferral', ref);

    document.title = "AI UX Audit for Startups & SaaS | Product Shift";
    
    // SEO Meta Tags
    const setMeta = (attr: string, key: string, content: string) => {
      let m = document.querySelector(`meta[${attr}="${key}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute(attr, key);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    };

    setMeta('name', 'description', "Instant UX audit for startups. Identify conversion killers in your MVP or SaaS landing page with AI user testing.");
    setMeta('property', 'og:title', 'AI UX Audit for Startups');
    setMeta('property', 'og:description', 'Is your MVP leaking users? Get a brutal usability analysis in 3 minutes.');
    setMeta('property', 'og:url', 'https://app.theproductshift.com/startup-ux-audit');
    setMeta('property', 'og:image', 'https://app.theproductshift.com/social-share.png');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://app.theproductshift.com/startup-ux-audit');

  }, [searchParams]);

  // Background Animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateOrbs = () => {
      const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      for (let i = 1; i <= 10; i++) {
        container.style.setProperty(`--orb-${i}-x`, `${r(-20, 120)}%`);
        container.style.setProperty(`--orb-${i}-y`, `${r(-20, 120)}%`);
      }
    };
    updateOrbs();
    const interval = setInterval(updateOrbs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
      <main className="relative bg-white overflow-hidden" ref={containerRef}>
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-all duration-[5000ms] ease-in-out"
                style={{
                  left: `var(--orb-${i+1}-x, 50%)`,
                  top: `var(--orb-${i+1}-y, 50%)`,
                  width: `${400 + (i * 20)}px`,
                  height: `${400 + (i * 20)}px`,
                  backgroundColor: ['#4f46e5', '#818cf8', '#c7d2fe'][i % 3] // Indigo theme for Tech/SaaS
                }}
              />
            ))}
        </div>
        
        <div className="relative z-10">
          <HeroSection />
          <hr className="border-t border-gray-100 my-0" />
          <DemoSection />
          <hr className="border-t border-gray-100 my-0" />
          <PricingSection />
          <hr className="border-t border-gray-100 my-0" />
          <FAQSection />
        </div>
      </main>
  );
};

export default StartupLandingPage;
