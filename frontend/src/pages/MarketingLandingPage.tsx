import React, { useState, useEffect } from 'react';
import MarketingHero from '../components/MarketingHero';
import { Link } from 'react-router-dom';
import { BarChart, Bot, BrainCircuit, Check, Users, AlertCircle, Lock, PartyPopper, RefreshCw, ShieldAlert, WifiOff, Ban, Clock } from 'lucide-react';

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
            <p className="text-gray-800"><strong className="font-bold text-gray-900">ISSUE:</strong> {line.replace(/- \*\*ISSUE:\*\*/i, '').replace(/\*\*ISSUE:\*\*/i, '')}</p>
          </div>
        );
    } else if (line.toUpperCase().includes('**FIX:**') && issueFixPairs < 2) {
        recommendations.push(
          <div key={`fix-${issueFixPairs}`} className="mb-4 p-3 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm">
            <p className="text-gray-800"><strong className="font-bold text-gray-900">FIX:</strong> {line.replace('- **FIX:**', '').replace('**FIX:**', '')}</p>
          </div>
        );
        issueFixPairs++;
    }
  }

  // Add the teaser element if we found at least two pairs
  if (issueFixPairs >= 2) {
    recommendations.push(
      <div key="teaser" className="relative mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-center overflow-hidden">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" />
        <div className="relative z-10">
          <Lock className="mx-auto text-gray-400 mb-2" />
          <p className="font-semibold text-gray-700">+1 more critical recommendation</p>
          <p className="text-xs text-gray-500">Join the waitlist to unlock the full report.</p>
        </div>
      </div>
    );
  }

  return recommendations;
};

const AnalysisErrorCard = ({ error }: { error: any }) => {
  // Determine Icon and Color based on error type
  let Icon = AlertCircle;
  let iconColor = "text-red-500";
  let borderColor = "border-red-400";
  let subHeader = "Analysis Failed";

  if (error.error === 'Site Security Error') {
    Icon = ShieldAlert;
    iconColor = "text-yellow-500";
    borderColor = "border-yellow-400";
    subHeader = "Security Alert";
  } else if (error.error === 'Site Not Found' || error.error === 'Connection Refused') {
    Icon = WifiOff;
    iconColor = "text-gray-500";
    borderColor = "border-gray-400";
    subHeader = "Connection Error";
  } else if (error.error === 'Connection Timed Out') {
    Icon = Clock;
    iconColor = "text-orange-500";
    borderColor = "border-orange-400";
    subHeader = "Timeout Error";
  } else if (error.error === 'Restricted URL' || error.error === 'Access Denied') {
    Icon = Ban;
    iconColor = "text-red-600";
    borderColor = "border-red-600";
    subHeader = "Access Restricted";
  }

  return (
    <div className={`max-w-lg mx-auto p-8 bg-white border-2 ${borderColor} rounded-xl shadow-2xl text-center text-gray-900`}>
      <div className="flex justify-center mb-4">
        <Icon className={`w-12 h-12 ${iconColor}`} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">We were unable to test your site</h3>
      
      {error.usageCounted === false && (
        <p className={`text-sm font-semibold uppercase tracking-wide mb-4 ${iconColor.replace('text-', 'text-opacity-80 text-')}`}>
          {subHeader} — This test not counted toward your limit
        </p>
      )}
      
      <p className="text-gray-600 mb-4">
        {error.details || error.error}
      </p>
      
      {error.error === 'Site Security Error' && (
        <p className="text-gray-600">
          We recommend using a free tool like SSL Labs to diagnose and fix it. <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-medium">You can learn more here.</a>
        </p>
      )}
    </div>
  );
};

// --- Internal Components for Landing Page Sections ---

const FeaturesSection = () => (
  <section className="bg-white py-24 sm:py-32">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wider uppercase">How It Works</h2>
        <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          From URL to Actionable Insights in 3 Steps
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Our AI agent simulates a full usability study, so you can focus on building, not recruiting.
        </p>
      </div>
      <div className="mt-20 grid md:grid-cols-3 gap-x-8 gap-y-12 text-left">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">1. Select Personas</h3>
            <p className="mt-1 text-base text-gray-600">Choose from a panel of 6 diverse AI-powered user personas to match your target audience.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Bot size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">2. Run Analysis</h3>
            <p className="mt-1 text-base text-gray-600">The AI agents browse your site, performing tasks and analyzing the UX based on NN/g heuristics.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">3. Get Your Report</h3>
            <p className="mt-1 text-base text-gray-600">Receive a consolidated report with raw user feedback, performance charts, and actionable fixes.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const DemoSection = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // Simulated progress for the demo button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(5);
      const duration = 10000; // ~10 seconds for a single-persona demo
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
          personaIds: ['alex-busy-pro'], // Hardcode Alex for the demo
          goal: 'Quickly understand what this page is about.'
        }),
      });
      const data = await response.json();
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

  if (result) {
    const session = result.userSessions?.[0];
    const userBubble = session?.analysis?.split('|||USER_BUBBLE|||')[1]?.split('|||USER_DETAILS|||')[0]?.trim() || "Analysis complete.";
    const recommendations = result.expertReport?.split('### Actionable Recommendations')[1] || "No recommendations found.";
    const visualAnalysis = result.expertReport?.split('### Visual & Heuristic Analysis')[1]?.split('### Actionable Recommendations')[0];

    return (
      <section id="demo" className="bg-gray-50 py-24 sm:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Demo Result for <span className="text-indigo-600">{result.title}</span></h2>
            <p className="mt-4 text-lg text-gray-600">Here's a sample of the insights our AI agent uncovered.</p>
          </div>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Persona Feedback */}
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
                      <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm">
                          <Lock size={12} className="inline-block mr-1" />
                          Unlock Feedback
                      </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Report Snippet & CTA */}
            <div className="lg:col-span-8 bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
              
              {/* Visual Analysis Teaser (Blurred) */}
              {visualAnalysis && (
                <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-700">Visual & Heuristic Analysis</h3>
                  </div>
                  <div className="p-6 bg-white relative">
                    <div className="blur-sm select-none text-gray-400 space-y-2">
                      {visualAnalysis.split('\n').filter(l => l.trim()).map((l, i) => (
                        <p key={i}>{l}</p>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                      <span className="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm">
                        <Lock size={12} />
                        Unlock Full Analysis
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-4">Actionable Recommendations</h3>
              <div className="prose prose-sm max-w-none">
                {formatDemoText(recommendations)}
              </div>
              <div className="mt-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200 text-center relative">
                <div className="relative z-10">
                  <Lock className="mx-auto text-indigo-400 mb-2" size={32} />
                  <h4 className="font-bold text-indigo-800">Unlock the Full Report</h4>
                  <p className="text-sm text-indigo-700 mt-1">Get the complete heuristic analysis, performance scores, and feedback from 5 more personas.</p>
                  <a href="#waitlist-form" className="mt-4 inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5">
                    Join Waitlist
                  </a>
                </div>
              </div>
              
              {/* Reset Button */}
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setResult(null)}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <RefreshCw size={16} />
                  Run Another Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Simplified form for the demo
  return (
    <section id="demo" className="bg-gray-800 text-white py-24 sm:py-32">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">See It In Action: Run a Free Demo</h2>
        
        {error && error.usageCounted === false ? (
          <div className="mt-8 animate-fade-in">
            <AnalysisErrorCard error={error} />
            <button 
              onClick={() => setError(null)}
              className="mt-8 inline-flex items-center gap-2 text-gray-400 hover:text-white underline transition-colors"
            >
              <RefreshCw size={16} />
              Run Another Test
            </button>
          </div>
        ) : (
          <>
            <p className="mt-6 text-lg text-gray-300">
              Our AI persona, Alex, will analyze your site to see if she can quickly understand what it's about.
            </p>
            <form onSubmit={handleDemoSubmit} className="mt-8 max-w-xl mx-auto flex flex-col gap-3">
              <div className="flex items-center bg-gray-900/50 border border-gray-600 rounded-md focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="pl-4 text-gray-400">https://</span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-grow px-2 py-3 text-white bg-transparent border-none focus:outline-none focus:ring-0"
                  placeholder="your-website.com"
                  required
                />
              </div>
              <button type="submit" disabled={isLoading} className="relative overflow-hidden px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/20" style={{ width: `${progress}%` }} />
                )}
                <span className="relative z-10">{isLoading ? 'Analyzing...' : 'Run Free Demo'}</span>
              </button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-200 flex items-center gap-2 max-w-xl mx-auto">
                <AlertCircle size={16} />
                <strong>Error:</strong> {error.details || error.error}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const PricingSection = () => (
  <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Affordable UX Research for Every Stage
      </h2>
      <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
        Get the insights of a full usability study without the five-figure price tag.
      </p>
      <div className="mt-12 max-w-md mx-auto">
        {/* Pro Plan */}
        <div className="pricing-card best-value bg-white p-8 border-2 border-indigo-500 rounded-xl shadow-2xl text-left flex flex-col relative">
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full">Full Access</div>
          <h3 className="text-2xl font-bold text-center">Pro & Enterprise</h3>
          <p className="text-center text-gray-500 mt-2">For teams that need to ship with confidence</p>
          <hr className="my-6" />
          <ul className="space-y-3 text-gray-600 flex-grow">
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Up to 5 Personas per Test</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Visual & Heuristic Analysis</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Downloadable PDF Reports</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Performance Charts</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Unlimited Monthly Tests</li>
          </ul>
          <Link to="/waitlist" className="mt-8 block w-full text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95">
            Join Pro Waitlist
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const WaitlistSection = () => {
  const [state, setState] = useState({ submitting: false, succeeded: false, error: null });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ ...state, submitting: true, error: null });
    const data = new FormData(e.currentTarget);
    try {
      const response = await fetch('/api/join-waitlist', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(data)),
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setState({ submitting: false, succeeded: true, error: null });
      } else {
        const resData = await response.json();
        throw new Error(resData.details || 'An error occurred.');
      }
    } catch (error: any) {
      setState({ submitting: false, succeeded: false, error: error.message });
    }
  };

  return (
    <section id="waitlist-form" className="bg-gray-50 py-24 sm:py-32">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
          {state.succeeded ? (
            <div className="text-center p-6 bg-green-100 border border-green-200 rounded-lg animate-fade-in">
              <PartyPopper className="mx-auto text-green-600 mb-2" size={32} />
              <h4 className="font-bold text-green-800">You're on the list!</h4>
              <p className="text-sm text-green-700 mt-1">We'll email you with your 10% discount code when Pro launches. Thanks for your support!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" noValidate>
              <h2 className="text-3xl font-extrabold text-indigo-600">Join the Pro Waitlist</h2>
              <p className="text-gray-600">Be the first to know when we launch and get <span className="italic">10% off</span> your first month.</p>
              <div>
                <label htmlFor="email-waitlist" className="sr-only">Email address</label>
                <input type="email" id="email-waitlist" name="email" required className="w-full max-w-md mx-auto px-4 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="your@email.com" />
              </div>
              <button type="submit" disabled={state.submitting} className="w-full max-w-md mx-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95 disabled:opacity-60">
                {state.submitting ? 'Submitting...' : 'Get 10% Off'}
              </button>
              {state.error && (
                <p className="text-xs text-red-600 text-center mt-2">{state.error}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};


const MarketingLandingPage: React.FC = () => {
  return (
      <main>
        <MarketingHero />
        <FeaturesSection />
        <DemoSection />
        <PricingSection />
        <WaitlistSection />
      </main>
  );
};

export default MarketingLandingPage;
