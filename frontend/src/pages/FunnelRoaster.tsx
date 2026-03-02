import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { SecurityAlert } from '../components/SecurityAlert';
import { Zap, Target, Link as LinkIcon, DollarSign, TrendingUp, AlertCircle, Users, MousePointer, ShoppingCart, Info, CheckCircle, Smartphone, Layout, Filter, FileText, Share2, Download, Loader2 } from 'lucide-react';

const PERSONAS = [
  { id: 'alex-busy-pro', name: 'Alex', description: 'Busy professional, 2 kids < 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' },
  { id: 'sam-college-student', name: 'Sam', description: 'Budget-conscious student', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam' },
  { id: 'charlie-family-worker', name: 'Charlie', description: 'Masculine, patriotic worker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie' },
  { id: 'beth-homemaker', name: 'Beth', description: '45+ Homemaker, poor eyesight', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth' },
  { id: 'sarah-social-shopper', name: 'Sarah', description: 'Social influencer & avid shopper', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
  { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', description: 'Wealthy, highly educated', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine' },
  { id: 'marcus-c-suite', name: 'Marcus', description: 'Fortune 500 C-Level Exec', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' },
  { id: 'linda-business-owner', name: 'Linda', description: 'Business Owner (10 employees)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda' }
];

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
    adCreative: '', // Link to Ad
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

  const togglePersona = (id: string) => {
    setFormData(prev => {
      const current = prev.selectedPersonas;
      if (current.includes(id)) return { ...prev, selectedPersonas: current.filter(p => p !== id) };
      if (current.length >= 5) return prev; // Limit to 5
      return { ...prev, selectedPersonas: [...current, id] };
    });
  };

  const handleFunnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);

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
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      
      setResult(data.report);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to run roast. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);

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
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      
      setSiteResult(data);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to run site roast. Please try again.');
      setStep(1);
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
          <div className="local-toggle inline-flex bg-black p-2 rounded-full border-2 border-gray-800 shadow-[0px_8px_0px_0px_rgba(0,0,0,0.5)] mb-8 transform transition-all hover:-translate-y-1">
            <button
              onClick={() => { setActiveMode('site'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all border-2 ${
                activeMode === 'site' 
                  ? 'bg-gray-800 text-white border-gray-600 shadow-[0px_4px_0px_0px_rgba(255,255,255,0.2)] -translate-y-1' 
                  : 'text-gray-400 hover:text-white border-transparent hover:bg-gray-900'
              }`}
            >
              <Layout size={18} /> Site Roaster
            </button>
            <button
              onClick={() => { setActiveMode('funnel'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all border-2 ${
                activeMode === 'funnel' 
                  ? 'bg-gray-800 text-white border-gray-600 shadow-[0px_4px_0px_0px_rgba(255,255,255,0.2)] -translate-y-1' 
                  : 'text-gray-400 hover:text-white border-transparent hover:bg-gray-900'
              }`}
            >
              <Filter size={18} /> Funnel Roaster
            </button>
            <button
              onClick={() => { setActiveMode('app'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all border-2 ${
                activeMode === 'app' 
                  ? 'bg-gray-800 text-white border-gray-600 shadow-[0px_4px_0px_0px_rgba(255,255,255,0.2)] -translate-y-1' 
                  : 'text-gray-400 hover:text-white border-transparent hover:bg-gray-900'
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
          
          <p className="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
            {activeMode === 'site' && "Identify friction points and UX issues on any landing page instantly."}
            {activeMode === 'funnel' && "Because cheap acquisition of worthless customers is the most expensive strategy there is"}
            {activeMode === 'app' && "Simulate user flows inside your web app (Coming Soon)."}
          </p>
        </div>

        {/* ==================== FUNNEL ROASTER FORM ==================== */}
        {activeMode === 'funnel' && step === 1 && (
          <form onSubmit={handleFunnelSubmit} className="space-y-8 animate-fade-in-up">
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">The Hook</label>
                  <input
                    type="text"
                    name="hook"
                    placeholder="e.g. Stop guessing your ad spend..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.hook}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">What caught their attention?</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">The Offer</label>
                  <input
                    type="text"
                    name="offer"
                    placeholder="e.g. Free 5-minute audit..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.offer}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">What are they expecting to get?</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ad Creative (Link)</label>
                  <input
                    type="url"
                    name="adCreative"
                    placeholder="https://facebook.com/ads/library/..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.adCreative}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Link to the live ad or a hosted screenshot (Meta/Google/LinkedIn).</p>
                </div>
              </div>
            </NeoCard>

            <NeoButton type="submit" className="w-full py-4 text-lg" disabled={loading || formData.selectedPersonas.length < 3}>
              {loading ? 'Analyzing Funnel...' : 'Run Funnel Roast'} <Zap className="ml-2" />
            </NeoButton>
          </form>
        )}

        {/* ==================== SITE ROASTER FORM ==================== */}
        {activeMode === 'site' && step === 1 && (
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
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">The Who</h2>
              <p className="text-gray-600 font-medium mb-6">Choose 3-5 synthesized users.</p>
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-xs text-gray-600 mb-6">
                <strong className="font-bold text-gray-800">Why 3-5 users?</strong> According to the Nielsen Norman Group, testing with 5 users typically uncovers 85% of usability problems. 
                We require a minimum of 3 synthesized users to ensure we identify converging patterns rather than isolated opinions.
                <a href="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/" target="_blank" rel="noreferrer" className="underline ml-1 font-medium">Learn more</a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERSONAS.map((persona) => (
                  <div key={persona.id} onClick={() => togglePersona(persona.id)} className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border-2 border-black ${formData.selectedPersonas.includes(persona.id) ? 'bg-[#ff8c00] shadow-[2px_2px_0px_0px_#000] translate-x-[2px] translate-y-[2px]' : 'bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]'} ${!formData.selectedPersonas.includes(persona.id) && formData.selectedPersonas.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full mr-3 bg-white border border-black" />
                    <div><div className="text-black font-bold">{persona.name}</div><div className="text-xs text-black font-medium">{persona.description}</div></div>
                    {formData.selectedPersonas.includes(persona.id) && <CheckCircle className="ml-auto text-black" size={20} />}
                  </div>
                ))}
              </div>
            </div>

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
        {step === 2 && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-8"></div>
            <h2 className="text-2xl font-black text-black mb-2">
              {activeMode === 'funnel' ? 'Analyzing Congruency...' : 'Simulating Users...'}
            </h2>
            <p className="text-gray-600">
              {activeMode === 'funnel' 
                ? 'Our AI Media Buyer is checking your Ad against your Landing Page.' 
                : 'Our AI Personas are browsing your site and taking notes.'}
            </p>
          </div>
        )}

        {/* ==================== FUNNEL RESULTS ==================== */}
        {step === 3 && activeMode === 'funnel' && result && (
          <div className="space-y-8">
            <NeoCard className="border-l-8 border-l-purple-600">
              <h2 className="text-2xl font-black mb-4">The Verdict</h2>
              <div className="prose prose-lg">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </NeoCard>
            <div className="text-center">
              <NeoButton onClick={() => setStep(1)} variant="secondary">Run Another Roast</NeoButton>
            </div>
          </div>
        )}

        {/* ==================== SITE ROASTER RESULTS ==================== */}
        {step === 3 && activeMode === 'site' && siteResult && (
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