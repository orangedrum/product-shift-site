import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { SecurityAlert } from '../components/SecurityAlert';
import { Zap, Target, Link as LinkIcon, DollarSign, TrendingUp, AlertCircle, Users, MousePointer, ShoppingCart, Info, CheckCircle, Smartphone, Layout, Filter, FileText, Share2, Download, Loader2, Plus, Trash2, ArrowRight, RefreshCw } from 'lucide-react';
import { PersonaSelector } from '../components/PersonaSelector';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';

// Helper to format simple markdown to HTML (Copied from AiUxAgent for consistency)
const formatText = (text: string) => {
  if (!text) return <p className="text-gray-500 italic">No analysis text generated.</p>;
  let cleanText = text.replace(/\{[\s\S]*?"usability":[\s\S]*?\}/g, '');
  if (!cleanText.trim()) cleanText = text;

  const lines = cleanText.split('\n').filter(line => !line.match(/^\|.*\|$/)).filter(line => line.trim().length > 0);

  if (lines.length === 0) return <p className="text-black whitespace-pre-wrap">{text}</p>;

  return lines.map((line, index) => {
    if (line.includes('TEST RESULT: PASS')) {
      return <div key={index} className="mb-6"><h2 className="text-2xl font-black text-black flex items-center gap-2">Test Result: <span className="text-green-600 flex items-center gap-2">PASS <span className="text-3xl">👍</span></span></h2></div>;
    }
    if (line.includes('TEST RESULT: FAIL')) {
      return <div key={index} className="mb-6"><h2 className="text-2xl font-black text-black flex items-center gap-2">Test Result: <span className="text-red-600 flex items-center gap-2">FAIL <span className="text-3xl">👎</span></span></h2></div>;
    }
    if (line.includes('**Overall Score:**')) {
      const scoreMatch = line.match(/(\d+)\/100/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      const colorClass = score >= 60 ? 'text-green-600' : 'text-red-600';
      return <div key={index} className="mb-8 -mt-4"><h3 className={`text-2xl font-black ${colorClass} flex items-center gap-2`}>{line.replace(/\*\*/g, '')}</h3></div>;
    }
    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-black">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-black">{line.replace('## ', '')}</h2>;
    
    if (line.toUpperCase().includes('**ISSUE:**')) {
      return <div key={index} className="mt-4 p-4 bg-gray-200 border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg"><p className="text-black"><strong className="font-bold text-black">ISSUE:</strong> {line.replace(/- \*\*ISSUE:\*\*/i, '').replace(/\*\*ISSUE:\*\*/i, '')}</p></div>;
    }
    if (line.toUpperCase().includes('**FIX:**')) {
      return <div key={index} className="mb-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg"><p className="text-black"><strong className="font-bold text-black">FIX:</strong> {line.replace('- **FIX:**', '').replace('**FIX:**', '')}</p></div>;
    }

    const parts = line.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-black">{part.slice(2, -2)}</strong>;
      const subParts = part.split(/(\[(?:Positive|Neutral|Negative)\])/g);
      return subParts.map((subPart, j) => {
        if (subPart === '[Positive]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-green-700 bg-green-100 rounded-full border border-green-200">Positive</span>;
        if (subPart === '[Neutral]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-full border border-yellow-200">Neutral</span>;
        if (subPart === '[Negative]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-200">Negative</span>;
        return subPart;
      });
    });
    return <p key={index} className="mb-2 text-black leading-relaxed">{content}</p>;
  });
};

const FunnelRoaster = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<'site' | 'funnel' | 'app'>('funnel');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=Inputs, 2=Analyzing, 3=Results
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [siteResult, setSiteResult] = useState<any>(null); // Specific for Site Roaster results
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'summary'>('full');
  const [session, setSession] = useState<any>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    url: '',
    hook: '',
    offer: '',
    adCreatives: [''], // Array of links
    competitors: '',
    campaignType: 'leads', // 'leads' or 'sales'
    selectedPersonas: [] as string[],
    metrics: {
      adSpend: '',
      revenue: '',
      cvr: '',
      ctr: ''
    }
  });

  // Site Roaster Specific State
  const [siteTaskType, setSiteTaskType] = useState('understand');

  // Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Background Animation Effect (Lavalamp)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateOrbs = () => {
      const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      container.style.setProperty('--pos-x-1', `${r(0, 100)}%`);
      container.style.setProperty('--pos-y-1', `${r(0, 100)}%`);
      container.style.setProperty('--pos-x-2', `${r(0, 100)}%`);
      container.style.setProperty('--pos-y-2', `${r(0, 100)}%`);
      container.style.setProperty('--pos-x-3', `${r(0, 100)}%`);
      container.style.setProperty('--pos-y-3', `${r(0, 100)}%`);
    };

    updateOrbs();
    const interval = setInterval(updateOrbs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('metric_')) {
      const metricName = name.replace('metric_', '');
      setFormData(prev => ({ ...prev, metrics: { ...prev.metrics, [metricName]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePersonaChange = (newPersonas: string[]) => {
    setFormData(prev => ({ ...prev, selectedPersonas: newPersonas }));
  };

  const handleCreativeChange = (index: number, value: string) => {
    const newCreatives = [...formData.adCreatives];
    newCreatives[index] = value;
    setFormData(prev => ({ ...prev, adCreatives: newCreatives }));
  };

  const addCreative = () => {
    if (formData.adCreatives.length < 5) setFormData(prev => ({ ...prev, adCreatives: [...prev.adCreatives, ''] }));
  };

  const removeCreative = (index: number) => {
    setFormData(prev => ({ ...prev, adCreatives: prev.adCreatives.filter((_, i) => i !== index) }));
  };

  const handleReRoast = (newHook: string, newOffer: string) => {
    setFormData(prev => ({ ...prev, hook: newHook, offer: newOffer }));
    // Small timeout to allow state to update before submitting
    setTimeout(() => {
        document.getElementById('funnel-form-submit')?.click();
    }, 100);
  };

  const handleFunnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);
    setError(null);

    try {
      const res = await fetch('/api/run-funnel-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          personaIds: formData.selectedPersonas,
          email: session?.user?.email
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw data;
      
      setResult(data.report);
      setStep(3);
    } catch (err: any) {
      console.error('Funnel Roast Error:', err);
      setError({
        error: err.error || 'Analysis Failed',
        details: err.details || err.message || 'An unexpected error occurred.',
        usageCounted: err.usageCounted
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);
    setError(null);

    // Ensure the URL has a protocol (matching AiUxAgent logic)
    const fullUrl = formData.url.startsWith('http://') || formData.url.startsWith('https://') ? formData.url : `https://${formData.url}`;

    let finalGoal = 'Quickly understand what this page is about.';
    if (siteTaskType === 'purchase') finalGoal = 'Attempt to make a purchase or sign up, thinking aloud about the decision process.';

    try {
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: fullUrl,
          personaIds: formData.selectedPersonas,
          goal: finalGoal,
          email: session?.user?.email
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw data;
      
      setSiteResult(data);
      setStep(3);
    } catch (err: any) {
      console.error('Site Roast Error:', err);
      setError({
        error: err.error || 'Analysis Failed',
        details: err.details || err.message || 'An unexpected error occurred.',
        usageCounted: err.usageCounted
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintClick = () => setShowDownloadDialog(true);

  const confirmPrint = (mode: 'full' | 'summary') => {
    setPrintMode(mode);
    setShowDownloadDialog(false);
    setTimeout(() => window.print(), 100);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    setWaitlistError(null);
    try {
      const res = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail })
      });
      if (!res.ok) throw new Error('Failed to join');
      setWaitlistSuccess(true);
    } catch (err) {
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(1750px circle at 100% 0%, #ff1493 0%, #ff1493 40%, #ff0000 60%, transparent 80%),
          radial-gradient(at var(--pos-x-1, 50%) var(--pos-y-1, 50%), #ff8c00 0%, transparent 50%),
          radial-gradient(at var(--pos-x-2, 20%) var(--pos-y-2, 80%), #ff1493 0%, transparent 50%),
          radial-gradient(at var(--pos-x-3, 80%) var(--pos-y-3, 20%), #ff0000 0%, transparent 50%),
          #ffffff
        `,
        backgroundSize: '100% 100%',
        transition: '--pos-x-1 3s ease, --pos-y-1 3s ease, --pos-x-2 3s ease, --pos-y-2 3s ease, --pos-x-3 3s ease, --pos-y-3 3s ease'
      }}
    >
      <style>{`
        @property --pos-x-1 { syntax: '<percentage>'; inherits: false; initial-value: 50%; }
        @property --pos-y-1 { syntax: '<percentage>'; inherits: false; initial-value: 50%; }
        /* Add other properties if needed for full browser support, though standard CSS var transition works in most modern browsers */
        
        @media print {
          @page { margin: 1.5cm; size: auto; }
          body * { visibility: hidden; }
          #report-section, #report-section * { visibility: visible; }
          #report-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .screen-only { display: none !important; }
          .grid { display: block !important; }
          .lg\\:col-span-5, .lg\\:col-span-7 { width: 100% !important; margin-bottom: 1cm; }
          .border-2 { border-width: 2px !important; border-color: #000 !important; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>

      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* 3-Prong Toggle */}
          <div className="local-toggle inline-flex bg-[#121212] p-1 rounded-full shadow-[0px_2px_4px_0px_rgba(18,18,18,0.25),0px_4px_8px_0px_rgba(18,18,18,0.35)] mb-8">
            <button
              onClick={() => { setActiveMode('site'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-colors duration-300 ${
                activeMode === 'site' 
                  ? 'text-white bg-[#1a1a1a] border border-gray-600 shadow-[inset_2px_2px_2px_0px_rgba(64,64,64,0.25),inset_-2px_-2px_2px_0px_rgba(16,16,16,0.5)]' 
                  : 'text-gray-500 border border-transparent shadow-[inset_0px_1px_2px_0px_rgba(0,0,0,0.5)] hover:text-white'
              }`}
            >
              <Layout size={18} /> Site Roaster
            </button>
            <button
              onClick={() => { setActiveMode('funnel'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-colors duration-300 ${
                activeMode === 'funnel' 
                  ? 'text-white bg-[#1a1a1a] border border-gray-600 shadow-[inset_2px_2px_2px_0px_rgba(64,64,64,0.25),inset_-2px_-2px_2px_0px_rgba(16,16,16,0.5)]' 
                  : 'text-gray-500 border border-transparent shadow-[inset_0px_1px_2px_0px_rgba(0,0,0,0.5)] hover:text-white'
              }`}
            >
              <Filter size={18} /> Funnel Roaster
            </button>
            <button
              onClick={() => { setActiveMode('app'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-colors duration-300 ${
                activeMode === 'app' 
                  ? 'text-white bg-[#1a1a1a] border border-gray-600 shadow-[inset_2px_2px_2px_0px_rgba(64,64,64,0.25),inset_-2px_-2px_2px_0px_rgba(16,16,16,0.5)]' 
                  : 'text-gray-500 border border-transparent shadow-[inset_0px_1px_2px_0px_rgba(0,0,0,0.5)] hover:text-white'
              }`}
            >
              <Smartphone size={18} /> App Roaster
            </button>
          </div>

          {activeMode === 'site' && (
            <h1 className="text-5xl font-black text-black mb-4 tracking-tight">AI Site Roaster</h1>
          )}
          {activeMode === 'funnel' && (
            <h1 className="text-5xl font-black text-black mb-4 tracking-tight">AI Funnel Roaster</h1>
          )}
          {activeMode === 'app' && (
            <h1 className="text-5xl font-black text-black mb-4 tracking-tight">AI App Roaster</h1>
          )}
          
          <p className="text-xl text-black font-medium max-w-2xl mx-auto">
            {activeMode === 'site' && "Identify friction points and UX issues on any landing page instantly."}
            {activeMode === 'funnel' && "Because cheap acquisition of worthless customers is the most expensive strategy there is"}
            {activeMode === 'app' && "Simulate user flows inside your web app (Coming Soon)."}
          </p>
        </div>

        {/* ==================== FUNNEL ROASTER FORM ==================== */}
        {activeMode === 'funnel' && step === 1 && !error && (
          <form onSubmit={handleFunnelSubmit} className="space-y-8 animate-fade-in-up" id="funnel-form">
            {/* Section 1: The Destination */}
            <NeoCard title="1. The Destination">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="block text-sm font-black text-black mb-1">Landing Page URL *</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="url"
                      name="url"
                      required
                      placeholder="https://your-site.com/landing-page"
                      className="w-full pl-10 p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-0"
                      value={formData.url}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </NeoCard>

            {/* Section 2: The Ad Context */}
            <NeoCard title="2. The Ad Context (The Promise)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ad Creatives (Links)</label>
                  {formData.adCreatives.map((creative, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        placeholder="https://facebook.com/ads/library/..."
                        className="flex-1 p-3 border-2 border-gray-300 rounded-lg"
                        value={creative}
                        onChange={(e) => handleCreativeChange(index, e.target.value)}
                      />
                      {formData.adCreatives.length > 1 && (
                        <button type="button" onClick={() => removeCreative(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg border-2 border-transparent hover:border-red-100"><Trash2 size={20} /></button>
                      )}
                    </div>
                  ))}
                  {formData.adCreatives.length < 5 && (
                    <button type="button" onClick={addCreative} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                      <Plus size={16} /> Add Another Creative
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Link to live ads or hosted screenshots (Meta/Google/LinkedIn). Up to 5.</p>
                </div>
              </div>
            </NeoCard>

            {/* Section 3: The Who (Added Persona Selector) */}
            <PersonaSelector selectedPersonas={formData.selectedPersonas} onPersonaChange={handlePersonaChange} />

            <NeoButton id="funnel-form-submit" type="submit" className="w-full py-4 text-lg" disabled={loading || formData.selectedPersonas.length < 3}>
              {loading ? 'Analyzing Funnel...' : 'Run Funnel Roast'} <Zap className="ml-2" />
            </NeoButton>
          </form>
        )}

        {/* ==================== SITE ROASTER FORM ==================== */}
        {activeMode === 'site' && step === 1 && !error && (
          <form onSubmit={handleSiteSubmit} className="space-y-8 animate-fade-in-up">
            {/* Card 1: The What */}
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">The What</h2>
              <p className="text-gray-600 font-medium mb-6">Which website or URL do you want to check?</p>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <span className="text-black font-bold text-lg">https://</span>
                </div>
                <input
                  type="text"
                  name="url"
                  required
                  placeholder="example.com"
                  className="block w-full pl-24 pr-6 py-6 text-xl font-normal text-gray-900 bg-white border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_#000] focus:shadow-[5.5px_7px_0px_0px_#000] focus:outline-none transition-all duration-200 placeholder-gray-500"
                  value={formData.url.replace(/^https?:\/\//, '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value.replace(/^https?:\/\//, '') }))}
                />
              </div>
            </div>

            {/* Reusing the Persona Grid from Funnel Roaster (Shared Component Logic) */}
            <PersonaSelector selectedPersonas={formData.selectedPersonas} onPersonaChange={handlePersonaChange} />

            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">The Why</h2>
              <p className="text-gray-600 font-medium mb-2">Think about why you are doing this.</p>
              <p className="text-sm text-gray-500 mb-6 italic">Before users can do anything, they need to understand what your website is. We recommend only after passing this the first impression test to then move to the conversion test.</p>
              <div className="space-y-3">
                <div className="flex items-center p-3 border-2 border-transparent hover:bg-gray-50 rounded-lg transition-colors">
                  <input id="task-understand" name="task" type="radio" checked={siteTaskType === 'understand'} onChange={() => setSiteTaskType('understand')} className="h-5 w-5 text-black border-2 border-black focus:ring-0 checked:bg-black cursor-pointer" />
                  <label htmlFor="task-understand" className="ml-3 block text-base text-black font-bold cursor-pointer">General Audit (Understand the page)</label>
                </div>
                <div className="flex items-center p-3 border-2 border-transparent hover:bg-gray-50 rounded-lg transition-colors">
                  <input id="task-purchase" name="task" type="radio" checked={siteTaskType === 'purchase'} onChange={() => setSiteTaskType('purchase')} className="h-5 w-5 text-black border-2 border-black focus:ring-0 checked:bg-black cursor-pointer" />
                  <label htmlFor="task-purchase" className="ml-3 block text-base text-black font-bold cursor-pointer">Conversion Audit (Attempt to buy/signup)</label>
                </div>
              </div>
            </div>

            <NeoButton type="submit" className="w-full py-4 text-lg" disabled={loading || formData.selectedPersonas.length < 3}>
              {loading ? 'Analyzing Site...' : 'Run Site Roast'} <Zap className="ml-2" />
            </NeoButton>
          </form>
        )}

        {/* ==================== APP ROASTER (COMING SOON) ==================== */}
        {activeMode === 'app' && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] animate-fade-in-up">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-6">
              <Smartphone size={48} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-black text-black mb-2">Bring Your Own Key</h2>
            <p className="text-gray-600 font-medium mb-6">Manage LLM cost internally.</p>
            
            <ul className="text-left max-w-md mx-auto space-y-3 mb-8 text-gray-600">
              <li className="flex items-center gap-3"><CheckCircle size={20} className="text-green-500 shrink-0"/> <span className="font-medium">Unlimited tests with your keys</span></li>
              <li className="flex items-center gap-3"><CheckCircle size={20} className="text-green-500 shrink-0"/> <span className="font-medium">Use your own API keys (OpenAI, Anthropic)</span></li>
              <li className="flex items-center gap-3"><CheckCircle size={20} className="text-green-500 shrink-0"/> <span className="font-medium">CI / API integration</span></li>
            </ul>

            {waitlistSuccess ? (
               <div className="p-4 bg-green-50 text-green-700 rounded-lg max-w-md mx-auto border-2 border-green-200">
                 <strong>You're on the list!</strong> We'll notify you when the App Roaster is ready.
               </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter your email" 
                    className="flex-1 p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] transition-all"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                  />
                  <NeoButton type="submit" disabled={waitlistLoading}>
                    {waitlistLoading ? <Loader2 className="animate-spin" /> : 'Join Waitlist'}
                  </NeoButton>
                </div>
                {waitlistError && <p className="text-red-500 text-sm mt-2 font-bold">{waitlistError}</p>}
              </form>
            )}
          </div>
        )}

        {/* ==================== LOADING STATE ==================== */}
        {step === 2 && !error && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-8"></div>
            <h2 className="text-2xl font-black text-black mb-2">
              {activeMode === 'funnel' ? 'Analyzing Congruency...' : 'Simulating Users...'}
            </h2>
            <p className="text-black font-medium">
              {activeMode === 'funnel' 
                ? 'Our AI Media Buyer is checking your Ad against your Landing Page.' 
                : 'Our AI Personas are browsing your site and taking notes.'}
            </p>
          </div>
        )}

        {/* ==================== FUNNEL RESULTS ==================== */}
        {step === 3 && activeMode === 'funnel' && result && !error && (() => {
           const funnelData = typeof result === 'string' ? (() => {
             try {
               const clean = result.replace(/```json/g, '').replace(/```/g, '');
               return JSON.parse(clean);
             } catch(e) { return null; }
           })() : result;

           if (!funnelData || !funnelData.congruencyScore) {
             return (
               <div className="space-y-8">
                 <NeoCard className="border-l-8 border-l-purple-600">
                   <h2 className="text-2xl font-black mb-4">The Verdict</h2>
                   <div className="prose prose-lg">
                     <pre className="whitespace-pre-wrap font-sans text-gray-700">{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
                   </div>
                 </NeoCard>
                 <div className="text-center">
                   <NeoButton onClick={() => setStep(1)} variant="secondary">Run Another Roast</NeoButton>
                 </div>
               </div>
             );
           }

           return (
             <div className="space-y-8 animate-fade-in">
               {/* Header Score Card */}
               <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="text-center md:text-left">
                     <h2 className="text-3xl font-black text-black mb-2">Congruency Score</h2>
                     <div className="flex items-baseline gap-2 justify-center md:justify-start">
                       <span className={`text-6xl font-black ${funnelData.congruencyScore >= 80 ? 'text-green-600' : funnelData.congruencyScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                         {funnelData.congruencyScore}
                       </span>
                       <span className="text-2xl text-gray-400 font-bold">/100</span>
                     </div>
                   </div>
                   
                   <div className="flex-1 w-full max-w-md">
                      <div className="bg-gray-100 rounded-full h-6 border-2 border-black overflow-hidden relative">
                        <div 
                          className={`h-full transition-all duration-1000 ${funnelData.congruencyScore >= 80 ? 'bg-green-500' : funnelData.congruencyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${funnelData.congruencyScore}%` }}
                        ></div>
                      </div>
                      <p className="text-center mt-2 font-bold text-gray-600">{funnelData.congruencyScore >= 80 ? 'Excellent Match' : funnelData.congruencyScore >= 60 ? 'Needs Improvement' : 'Critical Mismatch'}</p>
                   </div>

                   <div className="bg-green-50 border-2 border-green-500 p-4 rounded-xl text-center min-w-[200px]">
                     <div className="flex justify-center mb-1"><TrendingUp className="text-green-600" /></div>
                     <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Projected Uplift</p>
                     <p className="text-xl font-black text-green-700">{funnelData.revenueProjection}</p>
                   </div>
                 </div>
               </div>

               {/* Refine Analysis Section */}
               <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                 <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                   <Target size={24} /> Analysis Context
                 </h3>
                 <p className="text-gray-600 text-sm mb-4">
                   This is what our AI perceived as your Hook and Offer. If this is incorrect, edit it below and re-run the analysis for a more accurate score.
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Perceived Hook</label>
                     <input 
                       type="text" 
                       defaultValue={funnelData.inferredHook || formData.hook} 
                       className="w-full p-2 border-2 border-gray-200 rounded font-medium text-black focus:border-black focus:outline-none"
                       id="refine-hook"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Perceived Offer</label>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         defaultValue={funnelData.inferredOffer || formData.offer} 
                         className="w-full p-2 border-2 border-gray-200 rounded font-medium text-black focus:border-black focus:outline-none"
                         id="refine-offer"
                       />
                       <button 
                         onClick={() => {
                           const h = (document.getElementById('refine-hook') as HTMLInputElement).value;
                           const o = (document.getElementById('refine-offer') as HTMLInputElement).value;
                           handleReRoast(h, o);
                         }}
                         className="bg-black text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-800 transition-colors whitespace-nowrap flex items-center gap-2"
                       >
                         <RefreshCw size={14} /> Re-Roast
                       </button>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Persona Journey Section */}
               {funnelData.personaJourneys && funnelData.personaJourneys.length > 0 && (
                 <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                   <div className="p-6 border-b-2 border-black bg-gray-50">
                     <h2 className="text-2xl font-bold text-black">Persona Journey Timeline</h2>
                     <p className="text-sm text-gray-600 mt-1">Experience the funnel through their eyes.</p>
                   </div>
                   
                   {/* Persona Tabs */}
                   <div className="flex overflow-x-auto p-2 gap-2 bg-white border-b-2 border-black no-scrollbar">
                     {funnelData.personaJourneys.map((journey: any, idx: number) => (
                       <button
                         key={idx}
                         onClick={() => setActiveTab(idx)}
                         className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all border-2 ${activeTab === idx ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#666]' : 'bg-white text-gray-600 border-transparent hover:bg-gray-100'}`}
                       >
                         <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${journey.persona}`} alt={journey.persona} className={`w-6 h-6 rounded-full border-2 ${journey.outcome === 'Converted' ? 'bg-green-200 border-green-500' : 'bg-red-200 border-red-500'}`} />
                         {journey.persona}
                       </button>
                     ))}
                   </div>

                   {/* Timeline Content */}
                   <div className={`p-8 overflow-x-auto transition-colors duration-300 ${funnelData.personaJourneys[activeTab]?.outcome === 'Converted' ? 'bg-green-50' : 'bg-red-50'}`}>
                     <div className="flex gap-6 min-w-max">
                       {funnelData.personaJourneys[activeTab]?.steps.map((step: any, i: number) => (
                         <div key={i} className="relative w-64 bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm flex-shrink-0">
                           <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">{i + 1}</div>
                           <h4 className="font-bold text-black mb-2 mt-2">{step.stage}</h4>
                           <p className="text-sm text-gray-600 italic mb-3">"{step.thought}"</p>
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${step.sentiment.includes('Positive') ? 'bg-green-100 text-green-800' : step.sentiment.includes('Negative') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{step.sentiment}</span>
                           {i < funnelData.personaJourneys[activeTab].steps.length - 1 && (
                             <div className="absolute top-1/2 -right-9 text-gray-300"><ArrowRight size={24} /></div>
                           )}
                         </div>
                       ))}
                       <div className={`w-48 flex items-center justify-center p-6 rounded-xl border-2 font-black text-center uppercase tracking-widest ${funnelData.personaJourneys[activeTab]?.outcome === 'Converted' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
                         {funnelData.personaJourneys[activeTab]?.outcome}
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* LEFT: Fixes (Action Plan) */}
                 <div className="lg:col-span-5 space-y-6">
                   <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                     <div className="p-4 border-b-2 border-black bg-gray-50">
                       <h2 className="text-lg font-bold text-black flex items-center gap-2">
                         <CheckCircle size={20} /> Action Plan
                       </h2>
                     </div>
                     <div className="p-6 space-y-4">
                       {funnelData.fixes.map((fix: string, i: number) => (
                         <div key={i} className="flex gap-3 items-start">
                           <div className="mt-1 min-w-[24px] h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                             {i + 1}
                           </div>
                           <p className="text-sm font-medium text-gray-800 leading-relaxed">{fix}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* RIGHT: Analysis */}
                 <div className="lg:col-span-7">
                   <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] h-full">
                     <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                       <h2 className="text-2xl font-bold text-black m-0">Media Buyer Analysis</h2>
                       <NeoButton variant="secondary" onClick={handlePrintClick} icon={<Download size={16} />} />
                     </div>
                     <div className="prose max-w-none text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                       {funnelData.summary}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="text-center mt-12">
                 <NeoButton onClick={() => setStep(1)} variant="secondary">Run Another Roast</NeoButton>
               </div>
             </div>
           );
        })()}

        {/* ==================== SITE ROASTER RESULTS ==================== */}
        {step === 3 && activeMode === 'site' && siteResult && !error && (
          <div id="report-section" className="w-full animate-fade-in">
            {siteResult.expertReport.startsWith('|||SSL_WARNING_ALERT|||') && <SecurityAlert isBlocking={false} />}
            
            {/* Report Header */}
            <div className="mb-8">
              <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] text-left">
                <h1 className="text-4xl font-black text-black mb-2">{siteResult.title || 'UX Audit Report'}</h1>
                <div className="text-black flex flex-col gap-1">
                  <span className="font-mono text-gray-700 font-bold text-lg">{siteResult.url || formData.url}</span>
                  <span className="text-sm font-medium">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COLUMN: User Sessions */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                  <div className="p-4 border-b-2 border-black bg-gray-50 no-print">
                    <h2 className="text-lg font-bold text-black">User Sessions</h2>
                    <p className="text-xs text-black font-medium">Click a user to view their detailed feedback</p>
                  </div>
                  
                  {/* Tab Bar */}
                  <div className="flex overflow-x-auto p-2 gap-2 bg-white border-b-2 border-black no-scrollbar screen-only">
                    {siteResult.userSessions?.map((res: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`flex flex-col items-center p-3 rounded-lg min-w-[110px] transition-all border-2 ${activeTab === idx ? 'bg-[#ff8c00] border-black shadow-[2px_2px_0px_0px_#000]' : 'bg-white hover:bg-gray-100 border-transparent'}`}
                      >
                        <img src={res.avatar} alt={res.persona} className="w-16 h-16 rounded-full border-2 border-black bg-white" />
                        <span className="text-xs mt-1 font-bold truncate w-full text-center text-black">{res.persona}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Tab Content */}
                  <div className="p-6 bg-white min-h-[400px] screen-only">
                    {siteResult.userSessions?.[activeTab] && (() => {
                      const res = siteResult.userSessions[activeTab];
                      const parts = res.analysis?.split('|||USER_DETAILS|||') || ['', ''];
                      const details = parts[1] || 'No detailed feedback provided.';
                      const bubbleParts = parts[0].split('|||USER_BUBBLE|||') || ['', ''];
                      const userBubble = bubbleParts[1]?.trim() || "I'm analyzing the page...";

                      return (
                        <div className="animate-fade-in">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-bold text-black">{res.persona}</h3>
                            <span className="text-xs text-black font-bold bg-white px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]">{res.description}</span>
                          </div>
                          <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-[4px_4px_0px_0px_#000] border-2 border-black text-black relative mb-6">
                            <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l-2 border-b-2 border-black transform rotate-45"></div>
                            <p className="text-lg italic text-black leading-relaxed">"{userBubble}"</p>
                          </div>
                          <div className="space-y-4 text-sm text-black bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            {formatText(details)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Expert Report */}
              <div className="lg:col-span-7 h-full">
                <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] h-full">
                  <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4 no-print">
                    <div>
                      <h2 className="text-2xl font-bold text-black m-0">UX Research Report</h2>
                      <p className="text-sm text-gray-600 mt-1">Compiled report of all persona experiences.</p>
                    </div>
                    <div className="flex gap-2">
                      {siteResult.reportId && (
                        <a href={`/api/public-report/${siteResult.reportId}`} target="_blank" rel="noopener noreferrer" className="no-print">
                          <NeoButton variant="secondary" icon={<Share2 size={16} />}></NeoButton>
                        </a>
                      )}
                      <NeoButton variant="secondary" onClick={handlePrintClick} className="no-print" icon={<Download size={16} />}></NeoButton>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    {formatText(siteResult.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').find(line => line.includes('TEST RESULT:')) || '')}
                  </div>

                  {siteResult.scores && (
                    <div className="mb-8 p-6 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                      <h3 className="text-lg font-bold text-black mb-4">Performance Metrics</h3>
                      <div className="h-64 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Usability', score: siteResult.scores.usability },
                            { name: 'Desirability', score: siteResult.scores.desirability },
                            { name: 'Clarity', score: siteResult.scores.clarity },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              <Cell key="usability" fill="#ff8c00" />
                              <Cell key="desirability" fill="#ff1493" />
                              <Cell key="clarity" fill="#00bfff" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="prose max-w-none">
                    {formatText(siteResult.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').filter(line => !line.includes('TEST RESULT:')).join('\n'))}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12 no-print">
              <NeoButton onClick={() => setStep(1)} variant="secondary">Run Another Roast</NeoButton>
            </div>
          </div>
        )}

        {/* ==================== ERROR STATE ==================== */}
        {error && (
          <div className="animate-fade-in">
            {error.error === 'Site Security Error' ? (
              <SecurityAlert isBlocking={true} onReset={() => { setError(null); setStep(1); }} />
            ) : (
              <AnalysisErrorCard 
                error={error} 
                onReset={() => { setError(null); setStep(1); }} 
              />
            )}
          </div>
        )}

        {/* Download Dialog */}
        {showDownloadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 no-print" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Download Report</h3>
              <div className="space-y-3 mt-4">
                <button onClick={() => confirmPrint('full')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left">
                  <div className="bg-indigo-100 p-2 rounded-lg"><Users className="text-indigo-600" size={24} /></div>
                  <div><span className="block font-semibold text-gray-900">Full Report</span><span className="text-xs text-gray-500">Includes all User Session transcripts</span></div>
                </button>
                <button onClick={() => confirmPrint('summary')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left">
                  <div className="bg-green-100 p-2 rounded-lg"><FileText className="text-green-700" size={24} /></div>
                  <div><span className="block font-semibold text-gray-900">Summary Only</span><span className="text-xs text-gray-500">Expert Analysis & Scores only</span></div>
                </button>
              </div>
              <button onClick={() => setShowDownloadDialog(false)} className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelRoaster;