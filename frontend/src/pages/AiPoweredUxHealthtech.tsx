import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { User, AlertCircle, CheckCircle } from 'lucide-react';

// Define types for the API response and error
type UserSession = {
  persona: string;
  description: string;
  avatar: string;
  analysis: string;
};

type AnalysisResponse = {
  message: string;
  title: string;
  screenshot?: string;
  userSessions: UserSession[];
  expertReport: string;
  scores?: {
    usability: number;
    desirability: number;
    clarity: number;
  };
};

type AnalysisError = {
  error: string;
  details?: string;
};

// Helper to format simple markdown to HTML
const formatText = (text: string) => {
  if (!text) return null;
  return text.split('\n')
    .filter(line => !line.match(/^\|.*\|$/)) // Filter out markdown table separator lines
    .map((line, index) => {
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
    if (line.toUpperCase().includes('**ISSUE:**')) {
      return (
        <div key={index} className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-t-lg">
          <p className="text-gray-800"><strong className="font-bold text-gray-900">ISSUE:</strong> {line.replace(/- \*\*ISSUE:\*\*/i, '').replace(/\*\*ISSUE:\*\*/i, '')}</p>
        </div>
      );
    }
    if (line.toUpperCase().includes('**FIX:**')) {
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
        if (subPart === '[Neutral]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-full border border-yellow-200">Neutral</span>;
        if (subPart === '[Negative]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-200">Negative</span>;
        return subPart;
      });
    });

    return <p key={index} className="mb-2 text-gray-700 leading-relaxed">{content}</p>;
  });
};

const SslWarning = () => (
  <div className="p-6 mb-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg prose max-w-none">
    <h2 className="text-xl font-bold text-yellow-900 !my-0 !mb-2 flex items-center gap-2">
      <AlertCircle />
      Security Alert: Insecure Connection Detected
    </h2>
    <p className="!my-1">
      Our AI agent detected a security issue with your site's SSL/TLS certificate (<code>net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH</code>). While we proceeded with the analysis, this is a critical issue you should address.
    </p>
    <p className="!my-1">
      An insecure connection erodes user trust and can harm your site's reputation. Helping create a safer internet is a shared responsibility.
    </p>
    <h4 className="font-bold !mt-4 !mb-1">Recommended Actions:</h4>
    <ul className="!my-0 !pl-5">
      <li>Check your SSL/TLS Certificate is valid and correctly installed.</li>
      <li>Update your server to use modern TLS versions (TLS 1.2 or 1.3).</li>
      <li>Use a free online checker like <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noopener noreferrer" className="underline font-medium">SSL Labs</a> to diagnose the problem.</li>
    </ul>
  </div>
);

const AiPoweredUxHealthtech: React.FC = () => {
  const [url, setUrl] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['alex-busy-pro', 'sam-college-student', 'charlie-family-worker']);
  const [taskType, setTaskType] = useState('understand');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [showPersonaError, setShowPersonaError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<number>(0); // Index of the active tab

  // Simulated progress bar effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && selectedPersonas.length > 0) {
      setProgress(5); // Start at 5%
      // Dynamically calculate duration: 6.5s per persona + 6.5s for the final report
      const duration = (selectedPersonas.length + 1) * 6500;
      const step = 200;
      
      interval = setInterval(() => {
        setProgress(old => {
          // Cap at 95% until the actual result comes back, to feel more authentic.
          const newProgress = old + (100 / (duration / step));
          if (newProgress >= 95) return 95;
          return old + (100 / (duration / step));
        });
      }, step);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, selectedPersonas.length]);

  const availablePersonas = [
    { id: 'alex-busy-pro', name: 'Alex', description: 'Busy professional, 2 kids < 5', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4&mouth=smile' },
    { id: 'sam-college-student', name: 'Sam', description: 'Budget-conscious student', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffdfbf&mouth=smile' },
    { id: 'charlie-family-worker', name: 'Charlie', description: 'Masculine, patriotic worker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=c0ebd7&mouth=smile' },
    { id: 'beth-homemaker', name: 'Beth', description: '45+ Homemaker, poor eyesight', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beth&backgroundColor=ffdfbf&glasses=prescription02&mouth=smile' },
    { id: 'sarah-social-shopper', name: 'Sarah', description: 'Social shopper, mid-20s', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffdfbf&mouth=smile' },
    { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', description: 'Wealthy, highly educated', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth&backgroundColor=c0ebd7&mouth=smile' }
  ];

  const togglePersona = (id: string) => {
    setSelectedPersonas(prev => 
      {
        const newSelection = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
        if (newSelection.length >= 3) setShowPersonaError(false);
        return newSelection;
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedPersonas.length < 3 || selectedPersonas.length > 5) {
      setShowPersonaError(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    // Determine final goal string
    let finalGoal = 'Quickly understand what this page is about.';
    if (taskType === 'purchase') finalGoal = 'Attempt to make a purchase or sign up, thinking aloud about the decision process.';

    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, personaIds: selectedPersonas, goal: finalGoal }), 
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-section, #report-section * { visibility: visible; }
          #report-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {!result && (
        <div className="no-print max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">AI-Powered UX Agent</h1>
            <p className="mb-8 text-gray-600">Select 3-5 personas and define their goal to run a simulated usability analysis.</p>
          </div>
      
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 border border-blue-100">
              <strong>Why 3-5 users?</strong> According to the Nielsen Norman Group, testing with 5 users typically uncovers 85% of usability problems. 
              We require a minimum of 3 synthesized users to ensure we identify converging patterns rather than isolated opinions.
              <a href="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/" target="_blank" rel="noreferrer" className="underline ml-1 font-medium">Learn more</a>
            </div>

            <fieldset>
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
            </fieldset>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">Select Personas</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePersonas.map((persona) => (
                  <div 
                    key={persona.id} 
                    onClick={() => togglePersona(persona.id)}
                    className={`
                      flex items-center p-3 border rounded-lg cursor-pointer transition-all
                      ${selectedPersonas.includes(persona.id)
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}
                      ${!selectedPersonas.includes(persona.id) && selectedPersonas.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full mr-3 bg-gray-100" />
                    <div>
                      <div className="font-medium text-gray-900">{persona.name}</div>
                      <div className="text-xs text-gray-500">{persona.description}</div>
                    </div>
                    {selectedPersonas.includes(persona.id) && (
                      <CheckCircle className="ml-auto text-indigo-600" size={20} />
                    )}
                  </div>
                ))}
              </div>
              {showPersonaError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <strong>Action Required:</strong> Please select between 3 and 5 personas to run the analysis.
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                User Goal / Task
              </legend>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input id="task-understand" name="task" type="radio" checked={taskType === 'understand'} onChange={() => setTaskType('understand')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <label htmlFor="task-understand" className="ml-2 block text-sm text-gray-700">Quickly understand what this page is about</label>
                </div>
                <div className="flex items-center">
                  <input id="task-purchase" name="task" type="radio" checked={taskType === 'purchase'} onChange={() => setTaskType('purchase')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <label htmlFor="task-purchase" className="ml-2 block text-sm text-gray-700">Make a purchase / Sign up (Think Aloud)</label>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isLoading || selectedPersonas.length < 3 || selectedPersonas.length > 5}
              className={`w-full relative overflow-hidden inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-all bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400`}
            >
              {isLoading && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
              <span className="relative z-10">
                {isLoading ? `Analyzing... ${Math.round(progress)}%` : 'Run Analysis'}
              </span>
            </button>
          </form>
        </div>
      )}

      {result && (
        <div className="no-print text-center mb-12 animate-fade-in">
           <h1 className="text-3xl font-bold mb-2 text-gray-900">Analysis Complete</h1>
           <p className="text-gray-600">Review the user sessions and the aggregated research report below.</p>
           <button onClick={() => { setResult(null); setActiveTab(0); }} className="mt-6 bg-indigo-600 text-white font-medium py-2 px-5 rounded-lg shadow-sm transition-transform transform hover:scale-105">
             Run Another Test
           </button>
        </div>)}
      {result && (
        <div id="report-section" className="animate-fade-in">
          {/* Conditionally render the SSL warning at the top of the report */}
          {result.expertReport.startsWith('|||SSL_WARNING_ALERT|||') && <SslWarning />}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Persona Summaries (Span 4) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800">User Sessions</h2>
                  <p className="text-xs text-gray-500">Click a user to view their detailed feedback</p>
                </div>
                
                {/* Tab Bar */}
                <div className="flex overflow-x-auto p-2 gap-2 bg-white border-b border-gray-100 no-scrollbar">
                  {result.userSessions.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`flex flex-col items-center p-3 rounded-lg min-w-[110px] transition-all ${
                        activeTab === idx 
                          ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                          : 'hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <img 
                        src={res.avatar} 
                        alt={res.persona}
                        onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.persona}`; }}
                        className={`w-16 h-16 rounded-full border-2 ${activeTab === idx ? 'border-indigo-300' : 'border-gray-100'}`}
                      />
                      <span className={`text-xs mt-1 font-medium truncate w-full text-center ${activeTab === idx ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {res.persona}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active Tab Content */}
                <div className="p-6 bg-indigo-50/30 min-h-[400px]">
                  {result.userSessions[activeTab] && (() => {
                    const res = result.userSessions[activeTab];
                    const userSection = res.analysis || '';
                    const parts = userSection.split('|||USER_DETAILS|||') || ['', ''];
                    const details = parts[1] || 'No detailed feedback provided.';
                    const moodAndBubble = parts[0] || '';
                    const bubbleParts = moodAndBubble.split('|||USER_BUBBLE|||') || ['', ''];
                    const userBubble = bubbleParts[1]?.trim() || "I'm analyzing the page...";

                    return (
                      <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-bold text-gray-900">{res.persona}</h3>
                          <span className="text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">{res.description}</span>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm border border-indigo-100 text-gray-800 relative mb-6">
                          <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-b border-indigo-100 transform rotate-45"></div>
                          <p className="text-lg italic text-gray-700 leading-relaxed">"{userBubble}"</p>
                        </div>

                        <div className="space-y-4 text-sm text-gray-700 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          {formatText(details)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Expert Report (Span 7) */}
            <div className="lg:col-span-7 h-full">
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg h-full">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">UX Research Report</h2>
                  <button 
                    onClick={handlePrint}
                    className="no-print text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
                  >
                    Download PDF
                  </button>
                </div>

                {/* Render Test Result First for Prominence */}
                <div className="prose max-w-none">
                  {formatText(result.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').find(line => line.includes('TEST RESULT:')) || '')}
                </div>
                
                {/* Charts Section */}
                {result.scores && (result.scores.usability > 0 || result.scores.desirability > 0) ? (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Metrics</h3>
                    <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Usability', score: result.scores.usability },
                      { name: 'Desirability', score: result.scores.desirability },
                      { name: 'Clarity', score: result.scores.clarity },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                        {/* Optional: Color bars differently based on score */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                  </div>
                ) : null}

                {/* Visual Reference */}
                {result.screenshot && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Visual Reference</h3>
                    <img src={`data:image/jpeg;base64,${result.screenshot}`} alt="Page Screenshot" className="w-full rounded shadow-sm border" />
                    <p className="text-xs text-gray-400 mt-2 text-center">Note: This is a full screenshot. Future versions will include contextual highlights.</p>
                  </div>
                )}

                <div className="prose max-w-none">
                  {/* Render the rest of the report, excluding the already-rendered test result */}
                  {formatText(
                    result.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').filter(line => !line.includes('TEST RESULT:')).join('\n')
                  )}
                </div>
              </div>
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
    </div>);
};

export default AiPoweredUxHealthtech;
