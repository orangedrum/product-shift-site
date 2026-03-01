import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Zap, Target, Link as LinkIcon, DollarSign, TrendingUp, AlertCircle, Users, MousePointer, ShoppingCart, Info, CheckCircle, Smartphone, Layout, Filter } from 'lucide-react';

const PERSONAS = [
    { id: 'alex-busy-pro', name: 'Alex', role: 'Busy professional, 2 kids < 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' },
  { id: 'sam-college-student', name: 'Sam', role: 'Budget-conscious student', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam' },
  { id: 'charlie-family-worker', name: 'Charlie', role: 'Masculine, patriotic worker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie' },
  { id: 'beth-homemaker', name: 'Beth', role: '45+ Homemaker, poor eyesight', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth' },
  { id: 'sarah-social-shopper', name: 'Sarah', role: 'Social influencer & avid shopper', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
  { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', role: 'Wealthy, highly educated', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine' },
  { id: 'marcus-c-suite', name: 'Marcus', role: 'Fortune 500 C-Level Exec', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' },
  { id: 'linda-business-owner', name: 'Linda', role: 'Business Owner (10 employees)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda' }
];

const FunnelRoaster = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<'site' | 'funnel' | 'app'>('funnel');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=Inputs, 2=Analyzing, 3=Results
  const [result, setResult] = useState<any>(null);
  const [siteResult, setSiteResult] = useState<any>(null); // Specific for Site Roaster results

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
        body: JSON.stringify(formData)
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

    let finalGoal = 'Quickly understand what this page is about.';
    if (siteTaskType === 'purchase') finalGoal = 'Attempt to make a purchase or sign up, thinking aloud about the decision process.';

    try {
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url,
          personaIds: formData.selectedPersonas,
          goal: finalGoal,
          // email: session?.user?.email // Assuming auth middleware handles this or we add it if needed
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
      `}</style>

      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* 3-Prong Toggle */}
          <div className="inline-flex bg-gray-100 p-1.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] mb-8">
            <button
              onClick={() => { setActiveMode('site'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black transition-all ${
                activeMode === 'site' 
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Layout size={18} /> Site Roaster
            </button>
            <button
              onClick={() => { setActiveMode('funnel'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black transition-all ${
                activeMode === 'funnel' 
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Filter size={18} /> Funnel Roaster
            </button>
            <button
              onClick={() => { setActiveMode('app'); setStep(1); setResult(null); setSiteResult(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black transition-all ${
                activeMode === 'app' 
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]' 
                  : 'text-gray-500 hover:text-black'
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
            {activeMode === 'funnel' && <>Don't just fix the page. Fix the <span className="font-black bg-yellow-300 px-1">congruency</span> between your ad and your offer.</>}
            {activeMode === 'app' && "Simulate user flows inside your web app (Coming Soon)."}
          </p>
        </div>

        {/* ==================== FUNNEL ROASTER FORM ==================== */}
        {activeMode === 'funnel' && step === 1 && (
          <form onSubmit={handleFunnelSubmit} className="space-y-8">
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
          <form onSubmit={handleSiteSubmit} className="space-y-8">
            <NeoCard title="1. The Target">
              <div className="w-full">
                <label className="block text-sm font-black text-black mb-1">Website URL *</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="url"
                    name="url"
                    required
                    placeholder="https://your-site.com"
                    className="w-full pl-10 p-3 border-2 border-black rounded-lg focus:ring-0 font-medium"
                    value={formData.url}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </NeoCard>

            {/* Reusing the Persona Grid from Funnel Roaster (Shared Component Logic) */}
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">2. The Who</h2>
              <p className="text-gray-600 font-medium mb-6">Choose 3-5 synthesized users.</p>
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

            <NeoCard title="3. The Goal">
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
            </NeoCard>

            <NeoButton type="submit" className="w-full py-4 text-lg" disabled={loading || formData.selectedPersonas.length < 3}>
              {loading ? 'Analyzing Site...' : 'Run Site Roast'} <Zap className="ml-2" />
            </NeoButton>
          </form>
        )}

        {/* ==================== APP ROASTER (COMING SOON) ==================== */}
        {activeMode === 'app' && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-6">
              <Smartphone size={48} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-black text-black mb-4">Coming Soon</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              We are building a specialized agent capable of logging into your app, navigating complex flows, and stress-testing your SaaS product.
            </p>
            <NeoButton variant="secondary" onClick={() => setActiveMode('funnel')}>
              Try Funnel Roaster Instead
            </NeoButton>
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
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-3xl font-black text-black mb-6 border-b-2 border-black pb-4">UX Audit Report</h2>
              
              {/* Scores */}
              {siteResult.scores && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-black text-center">
                    <div className="text-xs font-black uppercase text-gray-500 mb-1">Usability</div>
                    <div className="text-4xl font-black text-black">{siteResult.scores.usability}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-black text-center">
                    <div className="text-xs font-black uppercase text-gray-500 mb-1">Desirability</div>
                    <div className="text-4xl font-black text-black">{siteResult.scores.desirability}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-black text-center">
                    <div className="text-xs font-black uppercase text-gray-500 mb-1">Clarity</div>
                    <div className="text-4xl font-black text-black">{siteResult.scores.clarity}</div>
                  </div>
                </div>
              )}

              <div className="prose prose-lg max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm">
                  {siteResult.expertReport}
                </pre>
              </div>
            </div>
            
            <div className="text-center">
              <NeoButton onClick={() => setStep(1)} variant="secondary">Run Another Roast</NeoButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelRoaster;