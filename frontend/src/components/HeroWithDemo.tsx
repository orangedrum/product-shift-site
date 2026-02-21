import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { AnalysisErrorCard } from './AnalysisErrorCard';

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

interface HeroWithDemoProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: string;
  backgroundElement?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const HeroWithDemo: React.FC<HeroWithDemoProps> = ({ title, subtitle, description, backgroundElement, badge, className = '' }) => {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get('url') || '');
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

  // Auto-scroll to demo if URL is provided in query params
  useEffect(() => {
    if (searchParams.get('url')) {
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

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
    <section className={`relative bg-transparent overflow-hidden pt-10 pb-20 lg:pt-20 lg:pb-28 ${className}`}>
      {backgroundElement && (
        <div className="absolute inset-0 z-0">
          {backgroundElement}
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex justify-center mb-12">
            {badge || <div className="text-center border-2 border-black bg-white px-8 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xl font-black text-black leading-none">User Mirror</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">by The ProductShift</p>
            </div>}
          </div>

          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-4">
            {title}
          </h1>
          <p className="mt-3 text-xl text-gray-600 sm:mt-5 max-w-2xl mx-auto">
            {subtitle || description}
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