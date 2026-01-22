import React from 'react';
import { Badge } from 'lucide-react'; // Using lucide icon as placeholder if Badge component isn't available, or standard HTML
import { MarketingCard } from './MarketingCard';

const clientLogos = [
  'clients-codeschool.png',
  'clients-disney.png',
  'clients-pluralsight.png',
  'clients-stackpath.png',
];

const tags = [
  "White-label Services",
  "Agency Partnerships",
  "Client Expansion",
  "Revenue Growth"
];

const AgencyPartner = () => {
  return (
    <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-16">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <MarketingCard>
          <h3 className="text-2xl font-bold text-gray-800 leading-8 mb-4">
            The Perfect Partner for Agencies & Health Tech Startups
          </h3>
          <p className="text-gray-500 leading-6 mb-6 max-w-3xl mx-auto">
            Enhance your agency's offerings with our specialized UX research and AI expertise. We seamlessly integrate with your existing client relationships to deliver exceptional results.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tags.map(tag => <span key={tag} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full border border-gray-200">{tag}</span>)}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-12 items-center">
            {clientLogos.map((logo, index) => (
              <img 
                key={logo} 
                src={`/${logo}`} 
                alt="Client Logo" 
                className="max-h-20 w-auto object-contain grayscale opacity-70 hover:opacity-100 transition-opacity duration-300 animate-float" 
                style={{ animationDelay: `${index * 1.2}s` }}
              />
            ))}
          </div>
        </MarketingCard>
      </div>
    </section>
  );
};

export default AgencyPartner;