import React, { useState } from 'react';
import { Trophy, TrendingUp, Users, Target, MessageSquare, Zap, Info } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { SEOMetadata } from '../components/SEOMetadata';

/**
 * The Pilot Dashboard (Kickstarter View)
 * Step 4: Refactored from PublicResume.tsx for Science & Proof.
 */
const PublicExperiment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'discussion'>('overview');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <SEOMetadata title="Pilot Progress - FreeBrain" description="Validating product development through real-world experiments." />
      
      {/* Hero: Kickstarter Treatment */}
      <header className="bg-black text-white py-20 border-b-4 border-indigo-600">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-indigo-600 text-[10px] font-black uppercase tracking-widest">
              Live Pilot Experiment
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">The Tango Workshop Series</h1>
            <p className="text-xl text-gray-400 font-bold italic">"Can synthesized UX research predict real-world community friction?"</p>
            
            <div className="grid grid-cols-3 gap-8 py-8 border-y border-white/10">
              <div>
                <div className="text-3xl font-black text-indigo-400">$1,320</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Raised of $3,200</div>
              </div>
              <div>
                <div className="text-3xl font-black">42%</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Funded</div>
              </div>
              <div>
                <div className="text-3xl font-black text-green-400">14</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Backers</div>
              </div>
            </div>

            <NeoButton variant="secondary" className="px-12 py-4 text-lg bg-[#39ff14] border-none text-black">
              Back This Project
            </NeoButton>
          </div>
          
          <div className="w-full md:w-[400px] aspect-square bg-gray-900 rounded-[2.5rem] border-4 border-white shadow-[12px_12px_0px_0px_#4f46e5] flex items-center justify-center">
            <Zap size={64} className="text-indigo-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Tabbed Navigation */}
      <div className="border-b-4 border-black sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 max-w-6xl flex gap-12">
          {['overview', 'findings', 'discussion'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={`py-6 text-xs font-black uppercase tracking-[0.3em] transition-all border-b-8 ${activeTab === tab ? 'border-indigo-600 text-black' : 'border-transparent text-gray-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-6xl py-20">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-12">
               <h2 className="text-4xl font-black tracking-tighter">About This Project</h2>
               <p className="text-xl text-gray-600 leading-relaxed font-medium">This pilot leverages synthesized personas to guide physical workshop logistics...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicExperiment;