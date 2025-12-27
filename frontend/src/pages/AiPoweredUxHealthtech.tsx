import React, { useState } from 'react';

// Define types for the API response and error
type UserSession = {
  persona: string;
  avatar: string;
  analysis: string;
};

type AnalysisResponse = {
  message: string;
  title: string;
  screenshot?: string;
  userSessions: UserSession[];
  expertReport: string;
};

type AnalysisError = {
  error: string;
  details?: string;
};

// Helper to format simple markdown to HTML
const formatText = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, index) => {
    // Headers
    if (line.includes('TEST RESULT: PASS')) {
      return (
        <div key={index} className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-r">
          <p className="font-bold text-xl">TEST RESULT: PASS</p>
        </div>
      );
    }
    if (line.includes('TEST RESULT: FAIL')) {
      return (
        <div key={index} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r">
          <p className="font-bold text-xl">TEST RESULT: FAIL</p>
        </div>
      );
    }

    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-800">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-gray-900">{line.replace('## ', '')}</h2>;
    
    // Issue vs Fix Styling (Neutralized)
    if (line.includes('**ISSUE:**')) {
      return (
        <div key={index} className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-t-lg">
          <p className="text-gray-800"><strong className="font-bold text-gray-900">ISSUE:</strong> {line.replace('- **ISSUE:**', '').replace('**ISSUE:**', '')}</p>
        </div>
      );
    }
    if (line.includes('**FIX:**')) {
      return (
        <div key={index} className="mb-4 p-3 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm">
          <p className="text-gray-800"><strong className="font-bold text-gray-900">FIX:</strong> {line.replace('- **FIX:**', '').replace('**FIX:**', '')}</p>
        </div>
      );
    }

    // Bold
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    // Check for Sentiment Pills [Positive], [Neutral], [Negative]
    const content = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      
      // Split by sentiment tags
      const subParts = part.split(/(\[(?:Positive|Neutral|Negative)\])/g);
      return subParts.map((subPart, j) => {
        if (subPart === '[Positive]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-green-700 bg-green-100 rounded-full border border-green-200">Positive</span>;
        if (subPart === '[Neutral]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-gray-600 bg-gray-100 rounded-full border border-gray-200">Neutral</span>;
        if (subPart === '[Negative]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-200">Negative</span>;
        return subPart;
      });
    });

    return <p key={index} className="mb-2 text-gray-700 leading-relaxed">{content}</p>;
  });
};

const AiPoweredUxHealthtech: React.FC = () => {
  const [url, setUrl] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['alex-busy-pro']);
  const [goal, setGoal] = useState('Quickly understand what this page is about.'); // Default goal
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);

  const availablePersonas = [
    { id: 'alex-busy-pro', name: 'Alex, the Busy Professional' },
    { id: 'sam-college-student', name: 'Sam, the College Student' },
    { id: 'charlie-family-worker', name: 'Charlie, the Family-Oriented Worker' }
  ];

  const togglePersona = (id: string) => {
    setSelectedPersonas(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedPersonas.length === 0) {
      alert('Please select at least one persona.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, personaIds: selectedPersonas, goal }), 
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-section, #report-section * { visibility: visible; }
          #report-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Personas (Recommended: 3-5)
          </label>
          <div className="space-y-2 bg-white p-3 border border-gray-300 rounded-md">
            {availablePersonas.map((persona) => (
              <div key={persona.id} className="flex items-center">
                <input
                  id={`persona-${persona.id}`}
                  type="checkbox"
                  checked={selectedPersonas.includes(persona.id)}
                  onChange={() => togglePersona(persona.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={`persona-${persona.id}`} className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                  {persona.name}
                </label>
              </div>
            ))}
          </div>
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
      </div>

      {result && (
        <div id="report-section" className="mt-12 space-y-8">
          {result.userSessions.map((res, idx) => {
            // Parse the new delimited format
            const userSection = res.analysis;
            
            const userParts = userSection.split('|||USER_DETAILS|||');
            const userBubble = userParts[0]?.replace('|||USER_BUBBLE|||', '').trim() || "I'm analyzing the page...";
            const userDetails = userParts[1] || '';
            
            return (
              <div key={idx} className="space-y-8">
                {/* Section 1: The User Session (Alex) */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-start gap-4">
                    <img 
                      src={res.avatar} 
                      alt={res.persona} 
                      className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900 mb-1">{res.persona}'s Session</h3>
                      <div className="bg-white p-4 rounded-lg rounded-tl-none shadow-sm border border-blue-100 text-gray-700 relative">
                        {/* Speech Bubble Triangle */}
                        <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-b border-blue-100 transform rotate-45"></div>
                        <p className="text-lg italic text-gray-800">"{userBubble}"</p>
                      </div>
                      <div className="mt-6 pl-2">
                        {formatText(userDetails)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Section 2: The Aggregated Expert Report */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">UX Research Report</h2>
              <button 
                onClick={handlePrint}
                className="no-print text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
              >
                Download PDF
              </button>
            </div>
            
            {/* Visual Reference */}
            {result.screenshot && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Visual Reference</h3>
                <img src={`data:image/jpeg;base64,${result.screenshot}`} alt="Page Screenshot" className="w-full rounded shadow-sm border" />
              </div>
            )}

            <div className="prose max-w-none">
              {formatText(result.expertReport)}
            </div>
          </div>
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
