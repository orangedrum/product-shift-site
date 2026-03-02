import React from 'react';
import { CheckCircle } from 'lucide-react';

export const PERSONAS = [
  { id: 'alex-busy-pro', name: 'Alex', description: 'Busy professional, 2 kids < 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' },
  { id: 'sam-college-student', name: 'Sam', description: 'Budget-conscious student', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam' },
  { id: 'charlie-family-worker', name: 'Charlie', description: 'Masculine, patriotic worker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie' },
  { id: 'beth-homemaker', name: 'Beth', description: '45+ Homemaker, poor eyesight', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth' },
  { id: 'sarah-social-shopper', name: 'Sarah', description: 'Social influencer & avid shopper', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
  { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', description: 'Wealthy, highly educated', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine' },
  { id: 'marcus-c-suite', name: 'Marcus', description: 'Fortune 500 C-Level Exec', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' },
  { id: 'linda-business-owner', name: 'Linda', description: 'Business Owner (10 employees)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda' }
];

interface PersonaSelectorProps {
  selectedPersonas: string[];
  onToggle: (id: string) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selectedPersonas, onToggle }) => {
  return (
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
          <div key={persona.id} onClick={() => onToggle(persona.id)} className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border-2 border-black ${selectedPersonas.includes(persona.id) ? 'bg-[#ff8c00] shadow-[2px_2px_0px_0px_#000] translate-x-[2px] translate-y-[2px]' : 'bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]'} ${!selectedPersonas.includes(persona.id) && selectedPersonas.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full mr-3 bg-white border border-black" />
            <div><div className="text-black font-bold">{persona.name}</div><div className="text-xs text-black font-medium">{persona.description}</div></div>
            {selectedPersonas.includes(persona.id) && <CheckCircle className="ml-auto text-black" size={20} />}
          </div>
        ))}
      </div>
    </div>
  );
};