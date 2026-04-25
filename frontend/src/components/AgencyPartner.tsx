import React from 'react';
import { MarketingCard } from './MarketingCard';

const clientLogos = [
  'clients-codeschool.png',
  'clients-disney.png',
  'clients-pluralsight.png',
  'clients-stackpath.png',
];

interface AgencyPartnerProps {
  title?: string;
  description?: string;
  tags?: string[];
}

const AgencyPartner = ({ title, description, tags }: AgencyPartnerProps) => {
  return (
    <section className="bg-white py-8">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        {title && <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>}
        {description && <p className="text-gray-500 mb-8 max-w-2xl mx-auto">{description}</p>}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 border border-gray-100 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-8 md:gap-14 items-center">
          {clientLogos.map((logo, index) => (
            <img 
              key={logo} 
              src={`/${logo}`} 
              alt="Partner Logo" 
              className="max-h-12 md:max-h-16 w-auto object-contain grayscale opacity-50 hover:opacity-100 transition-all duration-500 animate-float" 
              style={{ animationDelay: `${index * 0.8}s` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgencyPartner;