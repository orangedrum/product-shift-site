import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

const AiPoweredUxHealthtech = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null); // Will hold the report later

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    console.log(`Starting test for: ${url}`);

    // Placeholder for the real backend API call
    setTimeout(() => {
      setIsLoading(false);
      // In the future, we'll set the report here with data from the backend
    }, 5000); // Simulate a 5-second test
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            AI-Powered UX HealthTech
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            Enter a URL to run a simulated usability test with 5 AI-powered synthetic users.
          </p>
        </div>

        <div className="mt-12 max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border bg-white rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-brand-blue transition-all">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/onboarding"
              required
              className="w-full p-2 text-base bg-transparent border-none focus:ring-0"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center bg-brand-blue hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md shadow-sm transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Play size={20} />
              )}
              <span className="ml-2">{isLoading ? 'Running...' : 'Run Test'}</span>
            </button>
          </form>
        </div>

        {/* The report display area will be built here */}
      </div>
    </div>
  );
};

export default AiPoweredUxHealthtech;
