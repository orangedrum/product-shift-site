import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { NeoButton } from './NeoButton';
import { NeoCard } from './NeoCard';

interface InsufficientCreditsCardProps {
  onBuy: (plan: string) => void;
  onClose: () => void;
}

export const InsufficientCreditsCard: React.FC<InsufficientCreditsCardProps> = ({ onBuy, onClose }) => (
  <div className="max-w-md mx-auto mt-8 animate-fade-in relative">
    <NeoCard title="Insufficient Credits">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
      >
        <X size={24} />
      </button>
      <div className="text-center mb-6">
        <div className="bg-amber-100 p-4 rounded-full inline-block mb-4">
          <AlertCircle className="text-amber-600" size={48} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Out of Credits</h3>
        <p className="text-gray-600 font-medium">
          You have used all your available credits. Top up your account to continue analyzing websites.
        </p>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => onBuy('pack-3')}
          className="w-full flex items-center justify-between p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
        >
          <span className="font-bold text-black">9 Credits</span>
          <span className="font-black text-black">$14</span>
        </button>

        <button 
          onClick={() => onBuy('pack-15')}
          className="w-full flex items-center justify-between p-4 border-2 border-black bg-[#ff8c00] rounded-xl hover:bg-[#ffa500] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
        >
          <div className="text-left">
            <span className="block font-bold text-black">45 Credits</span>
            <span className="text-xs text-black font-medium">Best Value</span>
          </div>
          <span className="font-black text-black">$69</span>
        </button>
        
        <div className="pt-4 border-t border-gray-200 text-center">
             <p className="text-sm text-gray-600">
                Have your own AI API Keys and want infinite tests? <br/>
                <button onClick={() => window.location.href = '/waitlist'} className="text-indigo-600 font-bold hover:underline">Switch to our Agency plan</button>
             </p>
        </div>
      </div>
    </NeoCard>
  </div>
);