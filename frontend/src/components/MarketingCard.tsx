import React from 'react';

interface MarketingCardProps {
  children: React.ReactNode;
  className?: string;
}

export const MarketingCard: React.FC<MarketingCardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-gradient-to-b from-white to-gray-50 border border-gray-200/50 rounded-xl shadow-sm p-8 ${className}`}
      style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
    >
      {children}
    </div>
  );
};

export default MarketingCard;