import React, { useEffect, useRef } from 'react';
import { Check, Shield, TrendingUp, Zap, Calendar } from 'lucide-react';
import About from '../components/About';
import PdfViewer from './PdfViewer';

const FactoringFirmProposal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      {/* Global Background Blobs */}
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
            Proposal for Factoring Firms
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Digital Risk Assessment Partner
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stop funding businesses with broken "buy" buttons. Offer a digital stress test inside your portal to reduce default risk and increase client loyalty.
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
                  <Shield className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Reduce Default Risk:</strong> Identify clients whose sales funnels are technically failing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Stand Out:</strong> Differentiate your factoring firm from the "Cheap Money" competitors.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="text-indigo-600 flex-shrink-0 mt-1" />
                  <span><strong>Zero Integration:</strong> Our Chrome Extension allows your sales reps to run audits live on a prospecting call.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: PDF Viewer */}
          <div className="lg:sticky lg:top-8 flex justify-center">
            <PdfViewer file="/Beontag - 2026-03-11.pdf" />
          </div>
        </div>

        {/* How We Can Work Together Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight">How We Can Work Together</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <h4 className="text-xl font-black mb-4">1. For Your Firm</h4>
              <p className="text-gray-700 font-medium flex-grow">Use our tool to ensure your own public-facing site resonates with your factoring audience to be the high-converting tool you need it to be.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <h4 className="text-xl font-black mb-4">2. For Your Clients</h4>
              <p className="text-gray-700 font-medium flex-grow">Run a digital risk assessment for existing clients internally to ensure their own pages are performing and able to hit their targets.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <h4 className="text-xl font-black mb-4">3. As a Partner</h4>
              <p className="text-gray-700 font-medium flex-grow">Be part of your value-added tools offered to clients as either an affiliate program, license, or white-label lease.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg font-medium text-gray-700 mb-8">
            Let's discuss how we can build a partnership that adds immediate value to your firm and your clients.
          </p>
          <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg mt-4">
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

export default FactoringFirmProposal;