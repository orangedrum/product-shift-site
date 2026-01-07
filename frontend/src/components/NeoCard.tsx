import React from 'react';

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const NeoCard: React.FC<NeoCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="p-4 border-b-2 border-black bg-gray-50">
          <h3 className="font-bold text-black text-lg">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};