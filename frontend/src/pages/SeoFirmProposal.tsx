import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, TrendingUp, Zap, Calendar, FileText, MessageSquare, Send, MousePointer2, RefreshCw } from 'lucide-react';
import About from '../components/About';
import { SEOMetadata } from '../components/SEOMetadata';
import { DemoSection } from '../components/DemoSection';
import PdfViewer from '../components/PdfViewer';
import { NeoButton } from '../components/NeoButton';

const SeoFirmProposal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [chatStep, setChatStep] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [userData, setUserData] = useState({ clients: 0, atRisk: 0, retainer: 0, hiring: false, hiringCost: 0, concern: 0 });
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'bot', text: "Mission Control active. Google's AI Overviews (SGE) have triggered a 61% drop in CTR for informational keywords. How many clients does your agency currently manage?" }
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
  }, [chatMessages, activeTab]);

  const handleDirectCheckout = async (planId: string) => {
    setIsCheckoutLoading(planId);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          segment: 'seo-onboarding',
          promotekit_referral: (window as any).promotekit_referral 
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to start checkout. Please try again.');
      }
    } catch (e) {
      console.error('Checkout error:', e);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleSendMessage = (e?: React.FormEvent, choice?: string) => {
    if (e) e.preventDefault();
    const value = choice || chatInput;
    if (!value && chatStep !== 3) return;

    // 1. Log user reply
    const newMessages = [...chatMessages, { sender: 'user', text: value }];
    setChatInput('');

    // 2. Determine Bot Response logic
    let botReply: any = "";
    let nextStep = chatStep + 1;

    switch (chatStep) {
      case 0: // Client count
        setUserData({ ...userData, clients: parseInt(value) || 0 });
        botReply = "Understood. And how many of those clients are currently questioning results or blaming you for 'low sales'?";
        break;
      case 1: // At Risk
        setUserData({ ...userData, atRisk: parseInt(value) || 0 });
        botReply = "What is the combined monthly retainer value (revenue) of those specific clients combined? (Rough estimate is fine)";
        break;
      case 2: // Retainer value
        setUserData({ ...userData, retainer: parseInt(value) || 0 });
        botReply = "Are you currently hiring (or planning to hire) for CRO, Client Success, or Retention roles to solve this?";
        break;
      case 3: // Hiring?
        const isHiring = value.toLowerCase() === 'yes';
        setUserData({ ...userData, hiring: isHiring });
        if (isHiring) {
          botReply = "What do you estimate that specific role costing your agency per month (Salary + Overhead)?";
        } else {
          botReply = "Scale of 1-10: How concerned are you about the 61% Organic CTR drop impacting your product value in 2026?";
          nextStep = 5; // Skip salary question
        }
        break;
      case 4: // Hiring Cost
        setUserData({ ...userData, hiringCost: parseInt(value) || 0 });
        botReply = "Final question: On a scale of 1-10, how concerned are you about the SGE/GEO market shifts?";
        break;
      case 5: // Concern & The Math
        const annualRisk = userData.retainer * 12;
        const roi = annualRisk > 0 ? (annualRisk / 495).toFixed(0) : "72";
        botReply = (
          <div className="space-y-4">
            <p className="font-bold">The Math is clear: You have <span className="text-red-600 font-black">${annualRisk.toLocaleString()} per year</span> in revenue at risk.</p>
            <p className="text-sm">Our one-time $495 <strong>Emergency Retainer Shield</strong> is a <span className="font-black text-green-600">{roi}x ROI</span> if just one account is saved. Does it make sense to deploy the shield?</p>
            <div className="flex flex-col gap-3">
              <NeoButton onClick={() => handleDirectCheckout('seo-shield')} className="w-full">Deploy Retainer Shield Now</NeoButton>
              <Link to="/login?segment=smb" className="text-xs text-center font-bold text-gray-500 hover:text-black underline">Or try our DIY User Mirror (Start Free)</Link>
            </div>
          </div>
        );
        break;
    }
    setChatMessages([...newMessages, { sender: 'bot', text: botReply }]);
    setChatStep(nextStep);
  };

  // Background Animation Effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateOrbs = () => {
      const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      for (let i = 1; i <= 15; i++) {
        container.style.setProperty(`--orb-${i}-x`, `${r(-20, 120)}%`);
        container.style.setProperty(`--orb-${i}-y`, `${r(-20, 120)}%`);
      }
    };

    updateOrbs();
    const interval = setInterval(updateOrbs, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative bg-white min-h-screen overflow-hidden font-sans text-gray-900" ref={containerRef}>
      <SEOMetadata
        title="2026 SEO Survival: The CTR Cliff & Retainer Shield"
        description="Google SGE is killing organic CTR by 61%. Use our AI-driven 'Blame Shield' to prove the leak is the landing page, not your SEO."
        canonicalUrl="https://www.theproductshift.com/seo-firm-proposal"
        noindex={true}
      />
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-all duration-[4000ms] ease-in-out"
            style={{
              left: `var(--orb-${i+1}-x, 50%)`,
              top: `var(--orb-${i+1}-y, 50%)`,
              width: `${300 + (i * 20)}px`,
              height: `${300 + (i * 20)}px`,
              backgroundColor: ['#ff1493', '#ff0000', '#ff8c00'][i % 3]
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full border border-indigo-100">
            2026 Market Reality Report
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            A lot of SEO teams chase traffic without caring about conversions<br/>
            <span className="text-indigo-600">But good SEOs care about both</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Informational queries have seen a <span className="text-black font-black underline decoration-red-500">61% drop in organic CTR</span> since AI Overviews. Stop defending "Page 1" rankings to clients who aren't seeing sales. Document the leak before they fire you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left Column: Bullet Points */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                <Check className="text-green-600" strokeWidth={4} /> Core Benefits
              </h3>
              <ul className="space-y-4 text-lg font-medium text-gray-700">
                <li className="flex items-start gap-3">
                  <TrendingUp className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>The CTR Cliff Shield:</strong> Prove the "Attribution Gap" with 2026 Synthetic Buyer data showing exactly where the SERP satisfies the query.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Stop Churn Anxiety:</strong> Don't solve retention by hiring more Account Managers. Solve it with Disney-vetted qualitative proof.</span>
                </li>
                <li className="flex items-start gap-3">
                  <MousePointer2 className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Document the Leak:</strong> Build the "Talk Tracks" and decks that prove the site is the leaky bucket—not your traffic.</span>
                </li>
              </ul>
            </div>

            {/* How We Can Work Together (Consolidated) */}
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6">How We Work Together</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <p className="text-lg font-medium text-gray-700"><span className="font-bold text-black">AIO/GEO Pivot:</span> Use User Mirror to justify why you are rebuilding their content strategy for AI Search.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <p className="text-lg font-medium text-gray-700"><span className="font-bold text-black">The "Blame Shield":</span> Run a report in 24 hours for any "at-risk" client to reset the conversation.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <p className="text-lg font-medium text-gray-700"><span className="font-bold text-black">72x ROI:</span> Spend $495 to save a $36,000/year retainer. It’s the easiest math your CFO will ever do.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Tabs */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[1200px]">
              {/* Unified Tab Header - Integrated into the Card architecture */}
              <div className="flex no-print border-b-2 border-black bg-gray-50">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-black transition-all border-r-2 border-black ${activeTab === 'chat' ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-black'}`}
                >
                  <MessageSquare size={18} /> Strategy Chat
                </button>
                <button 
                  onClick={() => setActiveTab('report')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-black transition-all ${activeTab === 'report' ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-black'}`}
                >
                  <FileText size={18} /> Sample Report
                </button>
              </div>

              {/* Unified Tab Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'chat' ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 bg-gray-900 text-white flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                      <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Strategy Specialist Live</span>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                          <div className={`max-w-[85%] border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-black rounded-tl-none'}`}>
                            {typeof msg.text === 'string' ? <p className="font-bold italic">"{msg.text}"</p> : msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t-2 border-black bg-white">
                      {chatStep === 3 ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSendMessage(undefined, 'Yes')}
                            className="flex-1 py-4 border-2 border-black rounded-xl font-black bg-green-500 hover:bg-green-600 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all"
                          >
                            YES
                          </button>
                          <button 
                            onClick={() => handleSendMessage(undefined, 'No')}
                            className="flex-1 py-4 border-2 border-black rounded-xl font-black bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all"
                          >
                            NO
                          </button>
                        </div>
                      ) : chatStep < 6 ? (
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={
                              chatStep === 0 ? "Enter client count..." :
                              chatStep === 1 ? "How many are blaming you?" :
                              chatStep === 2 ? "Enter total monthly revenue..." :
                              chatStep === 4 ? "Enter monthly salary estimate..." :
                              chatStep === 5 ? "Concern scale (1-10)..." :
                              "Type your answer..."
                            }
                            className="flex-1 p-3 border-2 border-black rounded-lg bg-white font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_#4f46e5]"
                          />
                          <button 
                            type="submit"
                            className="bg-black text-white p-3 rounded-lg border-2 border-black hover:bg-gray-800 transition-colors"
                          >
                            <Send size={18} />
                          </button>
                        </form>
                      ) : (
                        <div className="text-center">
                          <button 
                            onClick={() => {
                              setChatStep(0);
                              setChatMessages([{ sender: 'bot', text: "Mission Control active. How many clients does your agency manage right now?" }]);
                            }}
                            className="text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto transition-colors"
                          >
                            <RefreshCw size={10} /> Restart Math Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in p-4 overflow-y-auto flex-1 bg-white flex justify-center items-start">
                    <PdfViewer file="/Beontag - 2026-03-11.pdf" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <DemoSection />

        {/* Ready to Try Today (Pricing) */}
        <div id="pricing" className="mb-16">
          <div className="text-center mb-12 pt-5">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">The Emergency Retainer Shield</h2>
            <p className="text-xl text-gray-600 font-medium">Save an "at-risk" <span className="text-black font-black underline decoration-green-500 decoration-4">$3,000/mo retainer</span> for a one-time beta rate.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pilot Option */}
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <h4 className="text-2xl font-black mb-2">The Shield</h4>
              <div className="text-4xl font-black mb-6">$495<span className="text-lg font-bold text-gray-500"> / one-time</span></div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Save a $3,000/mo retainer</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Disney-vetted UX Audit</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> 2026 "Synthetic Buyer" Data</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> 'Blame Shield' PDF in 24h</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Full Pitch Deck & Talk Tracks</li>
              </ul>
              <button 
                onClick={() => handleDirectCheckout('seo-shield')}
                disabled={!!isCheckoutLoading}
                className="w-full block text-center bg-black text-white border-2 border-black py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
              >
                {isCheckoutLoading === 'seo-shield' ? 'Initializing...' : 'Deploy Retainer Shield ($495)'}
              </button>
            </div>

            {/* Full Audit Option */}
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-800 text-xs font-black uppercase px-2 py-1 rounded">Best Value</div>
              <h4 className="text-2xl font-black mb-2">Portfolio Defense</h4>
              <div className="text-4xl font-black mb-6">$2,000<span className="text-lg font-bold text-gray-500"> / one-time</span></div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Audit 20 Clients</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> AIO/GEO Content Pivot Guide</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Account Management Training</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> White-Label Pitch Assets</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Portfolio Health Report</li>
              </ul>
              <button 
                onClick={() => handleDirectCheckout('seo-portfolio')}
                disabled={!!isCheckoutLoading}
                className="w-full block text-center bg-gray-100 text-black border-2 border-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isCheckoutLoading === 'seo-portfolio' ? 'Initializing...' : 'Scale Your Defense ($2,000)'}
              </button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg font-medium text-gray-700 mb-8">
            Stop Losing Retainers to SGE. Document the leak before they fire you.
          </p>
          <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg mt-4">
            <Calendar className="mr-2" /> Schedule a Retainer Shield Call
          </a>
        </div>
      </div>

      <div id="about-jean" className="relative z-10 bg-white border-t border-gray-100">
        <About />
      </div>
    </main>
  );
};

export default SeoFirmProposal;