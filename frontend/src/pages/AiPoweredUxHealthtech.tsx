import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

const AiPoweredUxHealthtech = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null); // Will hold the report later

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setReport(null); // Clear previous report

    try {
      const response = await fetch('http://localhost:3001/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        // If the server response is not 2xx, handle it as an error
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred');
      }

      const data = await response.json();
      console.log('Response from backend:', data);
      setReport(data); // Set the report state with the results
    } catch (error) {
      console.error('Failed to connect to the backend:', error);
      setReport({ error: error.message }); // Set the report state with the error message
    } finally {
      setIsLoading(false);
    }
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

        {/* Report Display Area */}
        {report && (
          <div className="mt-12 max-w-xl mx-auto">
            <div className="p-6 border bg-white rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{report.error ? 'Error' : 'Test Result'}</h2>
              {report.error ? (
                <p className="text-red-600"><span className="font-semibold">Details:</span> {report.error}</p>
              ) : (
                <><p className="text-gray-600"><span className="font-semibold">Status:</span> {report.message}</p><p className="text-gray-600"><span className="font-semibold">Page Title:</span> {report.title}</p></>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AiPoweredUxHealthtech;
