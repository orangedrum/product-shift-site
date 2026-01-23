import React from 'react';

interface SpeechBubbleProps {
  imageSrc: string;
  name: string;
  role: string;
  quote: string;
  mood?: 'positive' | 'negative' | 'neutral'; // Kept for API compatibility, but styling is now Neo (B&W)
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ imageSrc, name, role, quote }) => {
  return (
    <div className="flex flex-col items-center text-center max-w-xs mx-auto">
      {/* Bubble on Top */}
      <div className="relative p-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] mb-6">
        {/* Triangle Pointer pointing down */}
        <div className="absolute left-1/2 -bottom-2.5 w-4 h-4 border-2 border-black border-t-0 border-l-0 transform rotate-45 -translate-x-1/2 bg-white"></div>
        <p className="text-base italic font-medium text-black leading-relaxed">"{quote}"</p>
      </div>

      {/* Persona Below */}
      <div className="relative">
        <img 
          src={imageSrc} 
          alt={name} 
          className="w-20 h-20 rounded-full border-2 border-black shadow-sm bg-gray-100" 
        />
      </div>
      <div className="mt-3">
        <h4 className="font-bold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{role}</p>
      </div>
    </div>
  );
};