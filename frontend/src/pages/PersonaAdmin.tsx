import React, { useState } from 'react';
import { Users, Sparkles, Plus, LayoutGrid } from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';

/**
 * The Mirror User Flow (Persona Workshop)
 * Step 5 of the Community Analyzer Roadmap.
 */
const PersonaAdmin: React.FC = () => {
  const [activePersona, setActivePersona] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-marketing-gradient rounded-xl shadow-lg">
              <Users className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Persona Workshop</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Mirror User Flow</p>
            </div>
          </div>
          <NeoButton variant="tertiary" icon={<Plus size={20}/>}>
            Build My Own Persona
          </NeoButton>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Alex Persona (Example) */}
          <NeoCard title="Alex" className="hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra" alt="Alex" className="w-16 h-16 rounded-full border-2 border-black" />
              <div>
                <p className="text-xs font-black uppercase text-gray-400">Stable Baseline</p>
                <h3 className="font-bold text-lg">Busy Professional</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 italic mb-6">"I just need this to work without me having to think about it."</p>
            <NeoButton variant="secondary" className="w-full" icon={<Sparkles size={16}/>}>
              Review & Recalibrate
            </NeoButton>
          </NeoCard>

          {/* Placeholder for future personas */}
          <div className="border-4 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-12 text-gray-300">
            <LayoutGrid size={48} className="mb-4" />
            <p className="font-black uppercase text-sm">No Custom Personas Yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaAdmin;