import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles, Plus, LayoutGrid } from 'lucide-react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';

// CTO: Import existing personas logic (Mocked list from analysis-controller for frontend visibility)
const EXISTING_PERSONAS = [
  { id: 'alex-busy-pro', name: 'Alex', description: 'a busy professional with two kids under 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra', category: 'Stable Baseline' },
  { id: 'sam-college-student', name: 'Sam', description: 'a budget-conscious college student', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam', category: 'Standard' },
  { id: 'charlie-family-worker', name: 'Charlie', description: 'a masculine, patriotic blue-collar worker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie', category: 'Standard' },
  { id: 'beth-homemaker', name: 'Beth', description: 'a 45+ family-oriented homemaker with poor eyesight', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth', category: 'Standard' },
  { id: 'sarah-social-shopper', name: 'Sarah', description: 'a social influencer and avid shopper', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah', category: 'Standard' },
  { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', description: 'a highly educated and wealthy individual with deep connections', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine', category: 'Standard' },
  { id: 'marcus-c-suite', name: 'Marcus', description: 'a C-level executive of a Fortune 500 company', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus', category: 'Standard' },
  { id: 'linda-business-owner', name: 'Linda', description: 'a business owner with 10 employees', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda', category: 'Standard' },
];

/**
 * The Mirror User Flow (Persona Workshop)
 * Step 5 of the Community Analyzer Roadmap.
 */
const PersonaAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activePersona, setActivePersona] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
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
          {/* Redirect to Vault as the starting point for custom building */}
          <NeoButton variant="tertiary" icon={<Plus size={20}/>} onClick={() => navigate('/community-vault')}>
            Build My Own Persona
          </NeoButton>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Render Existing Personas from the AI Tester tool */}
          {EXISTING_PERSONAS.map(p => (
            <NeoCard key={p.id} title={p.name} className="hover:scale-[1.02] transition-transform cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <img src={p.avatar} alt={p.name} className="w-16 h-16 rounded-full border-2 border-black bg-gray-100" />
                <div>
                  <p className="text-xs font-black uppercase text-gray-400">{p.category}</p>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic mb-6 line-clamp-2">"{p.description}"</p>
              <NeoButton variant="secondary" className="w-full" icon={<Sparkles size={16}/>}>
                Review & Recalibrate
              </NeoButton>
            </NeoCard>
          ))}

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