import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

const AiPoweredUxHealthtech = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null); // Will hold the report later

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(import React, { useState } from 'react';
    
    // Define types for the API response and error
    type AnalysisResponse = {
      message: string;
      title: string;
      analysis: string;
    };
    
    type AnalysisError = {
      error: string;
      details?: string;
    };
    
    const AiPoweredUxHealthtech: React.FC = () => {
      const [url, setUrl] = useState('');
      const [personaId, setPersonaId] = useState('alex-busy-pro'); // Default persona
      const [goal, setGoal] = useState('Quickly understand what this page is about.'); // Default goal
      const [isLoading, setIsLoading] = useState(false);
      const [result, setResult] = useState<AnalysisResponse | null>(null);
      const [error, setError] = useState<AnalysisError | null>(null);
    
      const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);
        setError(null);
    
        try {
          const response = await fetch('/api/run-test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, personaId, goal }), // Send all three fields
          });
    
          const data = await response.json();
    
          if (!response.ok) {
            // Assuming the backend sends a JSON error object
            throw data;
          }
    
          setResult(data);
        } catch (err: any) {
          console.error('Failed to connect to the backend:', err);
          setError({
            error: err.error || 'An unknown error occurred.',
            details: err.details || 'Could not retrieve details.',
          });
        } finally {
          setIsLoading(false);
        }
      };
    
      return (
        <div className="container mx-auto p-4 max-w-2xl">
          <h1 className="text-2xl font-bold mb-4">AI-Powered UX Agent</h1>
          <p className="mb-6 text-gray-600">Select a persona and define their goal to analyze a website's usability from their perspective.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://example.com"
                required
              />
            </div>
    
            <div>
              <label htmlFor="persona" className="block text-sm font-medium text-gray-700">
                Select Persona
              </label>
              <select
                id="persona"
                value={personaId}
                onChange={(e) => setPersonaId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="alex-busy-pro">Alex, the Busy Professional</option>
                {/* Future personas will be added here */}
              </select>
            </div>
    
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                User Goal / Task
              </label>
              <input
                type="text"
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Find contact information"
                required
              />
            </div>
    
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isLoading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </form>
    
          {result && (
            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              <h2 className="font-bold">{result.message}</h2>
              <p className="mt-2"><strong>AI Persona Analysis:</strong> {result.analysis}</p>
            </div>
          )}
    
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h2 className="font-bold">Error</h2>
              <p>{error.details || error.error}</p>
            </div>
          )}
        </div>
      );
    };
    
    export default AiPoweredUxHealthtech;
    true);
    setReport(null); // Clear previous report

    try {
      // Use a relative path for the API call.
      // This works in development and production on Vercel.
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // Check if the response is actually JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // If the server response is not 2xx, handle it as an error
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown server error occurred');
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
