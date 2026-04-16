import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Loader2, Calendar, FileText, Share2, Download, ArrowRight, MousePointer2 } from 'lucide-react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';

const SeoOnboarding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  // Simulated progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(5);
      interval = setInterval(() => {
        setProgress(old => (old >= 95 ? 95 : old + 2));
      }, 800);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: fullUrl, 
          personaIds: ['alex-busy-pro', 'marcus-c-suite', 'sarah-social-shopper'],
          goal: 'Identify why conversion volume is low despite ranking well.',
          email: email
        })
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setResult(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-black text-black mb-4 uppercase tracking-tight">thanks for trusting us</h1>
          <p className="text-xl md:text-2xl text-gray-600 font-bold">Let's quickly get aligned and find your first win.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Panel: Next Steps & Calendly */}
          <div className="space-y-8 animate-fade-in">
            <NeoCard title="Your Strategy Roadmap">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">1</div>
                  <div>
                    <p className="font-black text-lg">Run your first 'Blame Shield'</p>
                    <p className="text-gray-600 text-sm">Enter a client URL to the right. We'll generate a high-impact UX autopsy you can take into your next retention meeting.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">2</div>
                  <div>
                    <p className="font-black text-lg">Schedule your Strategy Session</p>
                    <p className="text-gray-600 text-sm">Use the calendar below to book your 1-on-1 with Jean to build your custom agency talk tracks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">3</div>
                  <div>
                    <p className="font-black text-lg">Check your Inbox</p>
                    <p className="text-gray-600 text-sm">We've sent a magic link to <span className="font-bold text-black underline">{email}</span> so you can access your dashboard and download future reports.</p>
                  </div>
                </div>
              </div>
            </NeoCard>

            <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-4 bg-gray-900 text-white flex items-center gap-2">
                <Calendar size={20} />
                <span className="font-bold uppercase tracking-widest text-sm">Book Strategy Call</span>
              </div>
              <div className="h-[600px] bg-gray-50">
                <iframe 
                  src="https://calendly.com/jean-kaluza/meeting?hide_event_types=1&hide_landing_page_details=1" 
                  width="100%" 
                  height="100%" 
                  frameBorder="0"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Right Panel: URL Entry & Results */}
          <div className="space-y-8 animate-fade-in-up">
            {!result ? (
              <NeoCard title="Immediate Value Generator">
                <form onSubmit={handleRunAudit} className="space-y-6">
                  <div>
                    <label className="block text-lg font-black text-black mb-4 leading-tight">
                      Enter your most difficult client's landing URL to bring to your next meeting:
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="client-website.com"
                        className="w-full p-6 text-xl border-4 border-black rounded-xl focus:outline-none shadow-[4px_4px_0px_0px_#000]"
                        required
                      />
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="absolute right-3 top-3 bottom-3 bg-indigo-600 text-white px-6 rounded-lg font-black hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Run Audit</>}
                      </button>
                    </div>
                  </div>
                  {isLoading && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden border-2 border-black">
                        <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      <p className="text-center font-bold text-indigo-600 animate-pulse">Our AI agents are simulating users now... {progress}%</p>
                    </div>
                  )}
                </form>
              </NeoCard>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center bg-green-50 p-4 border-2 border-green-500 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <p className="font-black text-green-800 uppercase tracking-widest">Audit Complete!</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/api/public-report/${result.reportId}`} target="_blank" rel="noreferrer">
                      <NeoButton variant="secondary" icon={<Share2 size={16} />}>Share</NeoButton>
                    </a>
                    <NeoButton variant="secondary" icon={<Download size={16} />}>Download</NeoButton>
                  </div>
                </div>
                
                <NeoCard title="Quick Insight Preview">
                   <div className="prose max-w-none">
                      <p className="font-bold text-xl mb-4">{result.title}</p>
                      <div className="bg-gray-50 p-4 border-2 border-black rounded-lg italic font-medium mb-6">
                         "{result.userSessions[0].analysis.split('|||USER_BUBBLE|||')[1]?.split('|||USER_DETAILS|||')[0] || 'Analyzing...'}"
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                         {result.expertReport.split('### Actionable Recommendations')[0]}
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate('/ai-powered-ux')} 
                     className="mt-8 w-full py-4 bg-black text-white font-black rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                   >
                     Open Full Dashboard <ArrowRight />
                   </button>
                </NeoCard>
              </div>
            )}

            {error && <AnalysisErrorCard error={error} onReset={() => setError(null)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoOnboarding;