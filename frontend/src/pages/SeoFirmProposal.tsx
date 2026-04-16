import React, { useEffect, useRef, useState } from 'react';
import { Check, TrendingUp, Zap, MessageSquare, FileText, Layout, Send, Loader2, ArrowRight, MousePointer2 } from 'lucide-react';
import About from '../components/About';
import { SEOMetadata } from '../components/SEOMetadata';
import { DemoSection } from '../components/DemoSection';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';

const SeoFirmProposal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');

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
        title="CRO Partnership for SEO Agencies"
        description="Maximize the ROI of your SEO traffic with AI-driven Conversion Rate Optimization."
        canonicalUrl="https://www.theproductshift.com/seo-firm-proposal"
        noindex={true}
      />
      
      {/* Background Blobs */}
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
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full border border-indigo-100">
            Agency Strategic Partnership
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            SEO Gets the Traffic. <br/>
            <span className="text-indigo-600">CRO Keeps the Clients.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stop reporting on "rankings" while your clients' sales stay flat. Partner with Product Shift to deliver high-impact conversion audits that prove the value of every click you generate.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left Column: Why SEO Agencies Need CRO */}
          <div className="space-y-8">
            <NeoCard title="The Strategic Advantage">
              <ul className="space-y-6 text-lg font-medium text-gray-700">
                <li className="flex items-start gap-4">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <span><strong>Maximize Traffic ROI:</strong> Don't let your hard-won #1 rankings go to waste on landing pages that don't convert.</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0">
                    <Zap size={24} />
                  </div>
                  <span><strong>Reduce Client Churn:</strong> Clients stay longer when they can see a direct line from your SEO work to their bottom line.</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-pink-100 p-2 rounded-lg text-pink-600 shrink-0">
                    <MousePointer2 size={24} />
                  </div>
                  <span><strong>Instant Competitive Edge:</strong> Most SEO firms stop at the metadata. You provide a full-funnel experience that makes your agency indispensable.</span>
                </li>
              </ul>
            </NeoCard>

            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6">How We Scale Together</h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Check className="text-green-600" strokeWidth={4} />
                  <p className="text-lg font-bold">White-Label Performance Audits</p>
                </div>
                <div className="flex gap-4 items-center">
                  <Check className="text-green-600" strokeWidth={4} />
                  <p className="text-lg font-bold">Priority API Access for Batch Testing</p>
                </div>
                <div className="flex gap-4 items-center">
                  <Check className="text-green-600" strokeWidth={4} />
                  <p className="text-lg font-bold">Revenue-Focused Client Reporting</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Tabs */}
          <div className="lg:sticky lg:top-8">
            <div className="flex gap-2 mb-4 no-print">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-black font-black transition-all ${activeTab === 'chat' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(79,70,229,1)]' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <MessageSquare size={18} /> CRO Strategy Chat
              </button>
              <button 
                onClick={() => setActiveTab('report')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-black font-black transition-all ${activeTab === 'report' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(236,72,153,1)]' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <FileText size={18} /> See Sample Report
              </button>
            </div>

            <div className="min-h-[500px]">
              {activeTab === 'chat' ? (
                <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[600px]">
                  <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-sm uppercase tracking-widest">Strategy Specialist Live</span>
                    </div>
                  </div>
                  
                  {/* Chat Message Area */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-white border-2 border-black p-4 rounded-2xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="font-bold text-black italic">"Welcome to the Product Shift SEO Partnership portal. To help me provide the best strategy for your agency, what is the biggest conversion hurdle your clients are facing right now?"</p>
                      </div>
                    </div>
                    {/* Future messages will be rendered here */}
                  </div>

                  {/* Chat Input Placeholder */}
                  <div className="p-4 border-t-2 border-black bg-white">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        disabled 
                        placeholder="Chat logic coming in next step..." 
                        className="flex-1 p-3 border-2 border-gray-200 rounded-lg bg-gray-50 italic"
                      />
                      <NeoButton variant="primary" disabled className="px-4">
                        <Send size={18} />
                      </NeoButton>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
                   <p className="text-center text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Live Example Report Preview</p>
                   <DemoSection />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-black mb-8">Ready to evolve your agency?</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
             <NeoButton className="px-10 py-5 text-xl group">
                Apply for Agency Access <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
             </NeoButton>
             <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer" className="font-black text-indigo-600 hover:text-indigo-800 underline underline-offset-8 decoration-4">
                Schedule a Strategy Call
             </a>
          </div>
          <p className="mt-12 text-gray-500 italic">"SEO gets them to the party. We make sure they stay to dance."<br/> - Jean, Product Shift Growth Strategist</p>
        </div>
      </div>

      <div className="relative z-10 bg-white border-t-2 border-black">
        <About />
      </div>
    </main>
  );
};

export default SeoFirmProposal;