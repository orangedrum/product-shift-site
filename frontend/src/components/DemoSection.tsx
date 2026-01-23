import React, { useState, useEffect } from 'react';
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

export const DemoSection = () => {
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
      console.log('🚀 Starting Demo Analysis for:', url);
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
        console.error('❌ Server returned non-JSON response:', response.status);
        throw { error: 'Server Error', details: `The server returned an unexpected response (${response.status}). Please try again later.` };
      }

      if (!response.ok) throw data;
      console.log('✅ Analysis Success:', data);
      setResult(data);
    } catch (err: any) {
      setError({
        error: err.error || 'Analysis Failed',
        details: err.details || err.message || 'An unexpected error occurred.',
        usageCounted: err.usageCounted
      });
      console.error('❌ Demo Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="demo" className="bg-gray-900 text-white py-24">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">Try It Now: Free Agency Audit</h2>
        <p className="text-lg text-gray-300 mb-8">See exactly what your clients see. Run a live test on any URL right now.</p>
        
        {error && error.usageCounted === false ? (
          <div className="mb-8 animate-fade-in"><AnalysisErrorCard error={error} onReset={() => setError(null)} theme="dark" /></div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="max-w-xl mx-auto flex flex-col gap-3">
            <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="pl-4 text-gray-400">https://</span>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-grow px-2 py-3 text-white bg-transparent border-none focus:outline-none focus:ring-0" placeholder="client-website.com" required />
            </div>
            <button type="submit" disabled={isLoading} className="relative overflow-hidden px-8 py-3 bg-marketing-gradient text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait">
              {isLoading && <div className="absolute inset-0 bg-white/20" style={{ width: `${progress}%` }} />}
              <span className="relative z-10">{isLoading ? 'Running Audit...' : 'Run Free Audit'}</span>
            </button>
            {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-200 flex items-center gap-2 text-left"><AlertCircle size={16} /><strong>Error:</strong> {error.details || error.error}</div>}
          </form>
        )}
      </div>
    </section>
  );
};