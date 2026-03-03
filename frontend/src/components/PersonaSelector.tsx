import React from 'react';
import { CheckCircle, Plus, Minus } from 'lucide-react';

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
  onPersonaChange: (ids: string[]) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selectedPersonas, onPersonaChange }) => {
  const getCount = (id: string) => selectedPersonas.filter(p => p === id).length;
  const totalCount = selectedPersonas.length;

  const handleAdd = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (totalCount >= 5) return;
    onPersonaChange([...selectedPersonas, id]);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const index = selectedPersonas.indexOf(id);
    if (index > -1) {
      const newSelection = [...selectedPersonas];
      newSelection.splice(index, 1);
      onPersonaChange(newSelection);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
      <h2 className="text-2xl font-black text-black mb-1">The Who</h2>
      <p className="text-gray-600 font-medium mb-6">Choose 3-5 synthesized users. (Max 5 total)</p>
      <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-xs text-gray-600 mb-6">
        <strong className="font-bold text-gray-800">Why 3-5 users?</strong> According to the Nielsen Norman Group, testing with 5 users typically uncovers 85% of usability problems. 
        We require a minimum of 3 synthesized users to ensure we identify converging patterns rather than isolated opinions.
        <a href="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/" target="_blank" rel="noreferrer" className="underline ml-1 font-medium">Learn more</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PERSONAS.map((persona) => {
          const count = getCount(persona.id);
          const isSelected = count > 0;
          
          return (
            <div 
              key={persona.id} 
              onClick={(e) => !isSelected && handleAdd(e, persona.id)}
              className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all border-2 border-black ${isSelected ? 'bg-[#ff8c00] shadow-[2px_2px_0px_0px_#000] translate-x-[2px] translate-y-[2px]' : 'bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]'} ${!isSelected && totalCount >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full mr-3 bg-white border border-black" />
              <div className="flex-1 min-w-0">
                <div className="text-black font-bold flex items-center gap-2">
                  {persona.name}
                  {count > 1 && <span className="text-xs bg-black text-white px-1.5 rounded-full">{count}</span>}
                </div>
                <div className="text-xs text-black font-medium truncate">{persona.description}</div>
              </div>
              
              {isSelected ? (
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    type="button"
                    onClick={(e) => handleRemove(e, persona.id)}
                    className="p-1 bg-white rounded-full border border-black hover:bg-red-100 transition-colors"
                    title="Remove one"
                  >
                    <Minus size={14} className="text-black" />
                  </button>
                  <span className="font-bold text-black w-4 text-center">{count}</span>
                  <button 
                    type="button"
                    onClick={(e) => handleAdd(e, persona.id)}
                    disabled={totalCount >= 5}
                    className={`p-1 bg-white rounded-full border border-black transition-colors ${totalCount >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}`}
                    title="Add another like this"
                  >
                    <Plus size={14} className="text-black" />
                  </button>
                </div>
              ) : (
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   {/* Placeholder for hover effect */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};