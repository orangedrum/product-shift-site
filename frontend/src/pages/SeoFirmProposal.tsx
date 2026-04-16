import React, { useEffect, useRef, useState } from 'react';
import { Check, TrendingUp, Zap, Calendar, FileText, MessageSquare, Send, MousePointer2 } from 'lucide-react';
import About from '../components/About';
import { SEOMetadata } from '../components/SEOMetadata';
import { DemoSection } from '../components/DemoSection';
import PdfViewer from '../components/PdfViewer';
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
          {/* Left Column: Bullet Points */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                <Check className="text-green-600" strokeWidth={4} /> Core Benefits
              </h3>
              <ul className="space-y-4 text-lg font-medium text-gray-700">
                <li className="flex items-start gap-3">
                  <TrendingUp className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Maximize Traffic ROI:</strong> Don't let your hard-won #1 rankings go to waste on landing pages that don't convert.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Reduce Client Churn:</strong> Clients stay longer when they can see a direct line from your SEO work to their bottom line.</span>
                </li>
                <li className="flex items-start gap-3">
                  <MousePointer2 className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Instant Competitive Edge:</strong> Most SEO firms stop at the metadata. You provide a full-funnel experience that makes your agency indispensable.</span>
                </li>
              </ul>
            </div>

            {/* How We Can Work Together (Consolidated) */}
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6">How We Work Together</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <p className="text-lg font-medium text-gray-700"><span className="font-bold text-black">Internal Tool:</span> Audit your own agency site to ensure you convert the leads you attract.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <p className="text-lg font-medium text-gray-700"><span className="font-bold text-black">Conversion Reports:</span> Run AI UX audits on client pages to find the "revenue leaks" rankings can't fix.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <p className="text-lg font-medium text-gray-700"><span className="font-bold text-black">Strategy Upsell:</span> Use audit data to upsell high-margin CRO services or redesigns.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Tabs */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[650px]">
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
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Strategy Specialist Live</span>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-white border-2 border-black p-4 rounded-2xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="font-bold text-black italic">"Welcome to the Product Shift SEO Partnership portal. To help me provide the best strategy for your agency, what is the biggest conversion hurdle your clients are facing right now?"</p>
                        </div>
                      </div>
                    </div>

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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to keep your clients longer?</h2>
            <p className="text-xl text-gray-600 font-medium">We deliver comprehensive audit results in <span className="text-black font-black underline decoration-indigo-500 decoration-4">10 business days</span>.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pilot Option */}
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200"></div>
              <h4 className="text-2xl font-black mb-2">Pilot Test</h4>
              <div className="text-4xl font-black mb-6">$500<span className="text-lg font-bold text-gray-500"> / one-time</span></div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Audit 5 Clients</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> PDF Reports for each</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Risk Scorecard</li>
              </ul>
              <a href="https://calendly.com/jean-kaluza/productshift-pitch?a=pilot" target="_blank" rel="noreferrer" className="w-full block text-center bg-gray-100 text-black border-2 border-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Book Pilot ($500)
              </a>
            </div>

            {/* Full Audit Option */}
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-800 text-xs font-black uppercase px-2 py-1 rounded">Best Value</div>
              <h4 className="text-2xl font-black mb-2">Full Digital Audit</h4>
              <div className="text-4xl font-black mb-6">$2,000<span className="text-lg font-bold text-gray-500"> / one-time</span></div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Audit 20 Clients</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Deep Dive Analysis</li>
                <li className="flex items-center gap-2 font-medium text-gray-700"><Check size={20} className="text-green-600" /> Portfolio Health Report</li>
              </ul>
              <a href="https://calendly.com/jean-kaluza/productshift-pitch?a=full" target="_blank" rel="noreferrer" className="w-full block text-center bg-black text-white border-2 border-black py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg transform hover:-translate-y-1">
                Book Full Audit ($2,000)
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg font-medium text-gray-700 mb-8">
            Let's discuss how we can build a partnership that adds immediate value to your firm and your clients.
          </p>
          <a href="https://calendly.com/jean-kaluza/productshift-pitch" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg mt-4">
            <Calendar className="mr-2" /> Schedule a Partnership Call
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