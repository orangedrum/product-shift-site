import React from 'react';

interface SpeechBubbleProps {
  imageSrc: string;
  name: string;
  role: string;
  quote: string;
  mood?: 'positive' | 'negative' | 'neutral';
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ imageSrc, name, role, quote, mood = 'neutral' }) => {
  const borderColor = mood === 'negative' ? 'border-red-200 bg-red-50' : mood === 'positive' ? 'border-green-200 bg-green-50' : 'border-blue-100 bg-blue-50';
  const textColor = mood === 'negative' ? 'text-red-800' : mood === 'positive' ? 'text-green-800' : 'text-gray-800';

  return (
    <div className="flex flex-col items-center text-center max-w-xs mx-auto">
      <div className="relative mb-4">
        <img 
          src={imageSrc} 
          alt={name} 
          className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-100" 
        />
      </div>
      <div className={`relative p-4 rounded-xl border-2 ${borderColor} shadow-sm`}>
        {/* Triangle Pointer */}
        <div className={`absolute left-1/2 -top-2.5 w-4 h-4 ${borderColor} border-b-0 border-r-0 transform rotate-45 -translate-x-1/2 bg-inherit`}></div>
        <p className={`text-base italic font-medium ${textColor} leading-relaxed`}>"{quote}"</p>
      </div>
      <div className="mt-3">
        <h4 className="font-bold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{role}</p>
      </div>
    </div>
  );
};