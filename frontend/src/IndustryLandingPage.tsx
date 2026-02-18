import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { BarChart, Bot, Check, Users, AlertCircle, Lock, RefreshCw, Star, ChevronDown, ChevronUp, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { AnalysisErrorCard } from './components/AnalysisErrorCard';

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
  <section className="py-20 bg-gray-50 border-b-2 border-black">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Your New Conversion Toolkit</h2>
        <p className="text-xl text-gray-600">Use User Mirror whenever you need to know "Why?"</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6 border-2 border-black">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-black">The Pre-Launch</h3>
          <p className="text-gray-600">Before you spend ad money, ensure your landing page makes sense. Fix confusion before it costs you clicks.</p>
        </div>
        <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6 border-2 border-black">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-black">The Slump</h3>
          <p className="text-gray-600">Sales dropped? Bounce rate up? Find out exactly where users are getting stuck and why they are leaving.</p>
        </div>
        <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 border-2 border-black">
            <Users className="text-blue-600" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-black">The Competitor</h3>
          <p className="text-gray-600">Run a test on your competitor's URL. See what they do right, what they do wrong, and steal their best ideas.</p>
        </div>
      </div>
    </div>
  </section>
);

const PainSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-6">
            Google Analytics tells you <span className="italic underline text-black">what</span> is happening.
            <br />
            We tell you <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">WHY</span>.
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Analytics dashboards show you high bounce rates and abandoned carts, but they don't tell you <em>why</em> users are leaving. 
            Our AI agents browse your site like real humans, verbalizing their confusion and frustration so you can fix it.
          </p>
          
          <div className="relative grid grid-cols-2 gap-4">
            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-200 rounded-full p-2 shadow-sm">
              <span className="text-xs font-black text-gray-400">VS</span>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 h-full">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm w-fit">
                <BarChart className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Analytics</h4>
                <p className="text-xs text-gray-500 leading-relaxed">"Bounce rate on /checkout is 65%."</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100 h-full">
              <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm w-fit">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm mb-1">Product Shift</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">"I can't find the shipping costs. I'm frustrated."</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Fix */}
        <div className="relative flex flex-col gap-8">
          <div className="bg-white text-gray-900 p-6 rounded-xl border-2 border-gray-100 shadow-xl relative z-10">
            <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase tracking-wider text-xs">
              <CheckCircle size={16} /> Actionable Recommendation
            </div>
            <h3 className="text-xl font-bold mb-2">Clarify Salesforce Integration</h3>
            <p className="text-gray-600 mb-4">Users are abandoning the purchase because they can't confirm if the software works with their existing stack.</p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div> FIX: Add "Works with Salesforce" logo strip immediately below the primary CTA.
            </div>
          </div>
        </div>
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
    // Pricing section removed
  };

  if (result) {
    const session = result.userSessions?.[0];
    const recommendations = result.expertReport?.split('### Actionable Recommendations')[1] || "No recommendations found.";
    
    // CTO: Ensure user bubble directly correlates to the first actionable feedback point.
    const firstIssueMatch = recommendations.match(/\*\*ISSUE:\*\* (.*?)\n/i);
    const userBubble = firstIssueMatch ? firstIssueMatch[1].trim().replace(/\.$/, '') + "." : "I've finished my review. Here are my thoughts.";

    return (
      <section id="demo" className="relative bg-transparent py-8 sm:py-12">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-4">
            <p className="text-lg font-bold text-black">User Mirror</p>
            <p className="text-sm text-gray-600">by The ProductShift</p>
          </div>
          <div className="text-left mb-6">
            <p className="text-xl font-bold text-black">Demo Result for</p>
            <h2 className="text-4xl font-extrabold text-gray-900">{result.title}</h2>
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
              {/* CTO: High-converting compact CTA */}
              <div className="mt-6 text-center border-t-2 border-gray-100 pt-6">
                <Link to="/login" className="inline-block px-10 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-transform transform hover:-translate-y-0.5 shadow-lg">
                  Unlock Full Report
                </Link>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <p className="text-lg font-bold text-black">User Mirror</p>
            <p className="text-sm text-gray-600">by The ProductShift</p>
          </div>

          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-4">
            Find out why your users are converting or leaving
          </h1>
          <p className="mt-3 text-xl text-gray-600 sm:mt-5 max-w-2xl mx-auto">
            See your site through the eyes of your customer.
          </p>
            
            {/* Giant Input Form */}
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

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    { 
      q: "Is the free demo really free?", 
      a: (<span>
          Yes. You get one complete analysis with our 'Alex' persona for free. No credit card required. <a href="#demo" onClick={scrollToDemo} className="text-indigo-600 font-bold hover:underline">Try it now ➡️</a>
         </span>)
    },
    { 
      q: "How can I test if my website works for customers?", 
      a: "You paste your website link, pick who you want to test as (new visitor, potential client, etc.), and the tool walks through your page like a visitor would. You get a short report showing where they’d get confused and what to fix first." 
    },
    { 
      q: "Do I need to be technical to use this website checkup?", 
      a: "No. Everything is written in plain language. You don’t need to know UX or analytics—just read the suggestions and decide which fixes to try." 
    },
    { 
      q: "Can I use tests across multiple landing pages?", 
      a: "Yes. You can use your tests on any pages you own: homepages, booking pages, sales pages, or link‑in‑bio landing pages." 
    },
    { 
      q: "What’s the difference between packs and the monthly plan?", 
      a: "Packs are one‑time purchases you can use whenever you want. The monthly plan gives you fresh tests every month so you can stay on top of new pages, campaigns, and changes." 
    },
    { 
      q: "How is this different from Google Analytics?", 
      a: "Google Analytics tells you WHAT is happening (e.g., high bounce rate). Our AI Agent tells you WHY (e.g., 'The pricing is confusing')." 
    },
    { 
      q: "Do I need to install anything?", 
      a: "No. Just enter your URL and we do the rest." 
    },
    { 
      q: "Can I test my competitor's site?", 
      a: "Absolutely. It's a great way to see what they are doing right (or wrong)." 
    }
  ];

  return (
    <section className="bg-transparent py-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Common Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-gray-900">{faq.q}</span>
                {openIndex === i ? <ChevronUp size={20} className="text-black" /> : <ChevronDown size={20} className="text-black" />}
              </button>
              {openIndex === i && (
                <div className="p-4 bg-gray-200 border-t border-gray-300 text-gray-800 animate-fade-in">
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
          <HeroWithDemo />
          <PainSection />
          <hr className="border-t-2 border-black my-0" />
          <AuthorityBanner />
          <UseCasesSection />
          <hr className="border-t-2 border-black my-0" />
          <FeaturesSection />
          <hr className="border-t-2 border-black my-0" />
          <TestimonialsSection />
          <hr className="border-t-2 border-black my-0" />
          <PricingSection />
          <hr className="border-t-2 border-black my-0" />
          <FAQSection />
        </div>
      </main>
  );
};

export default IndustryLandingPage;
