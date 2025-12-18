import React from 'react';

const clientLogos = [
  'clients-1.png',
  'clients-2.png',
  'clients-3.png',
  'clients-4.png',
  'clients-5.png',
];

const AgencyPartner = () => {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          The Perfect Partner for Agencies
        </h2>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600">
          Partner with Product Shift to leverage proven UX research to level-up your market strategy & deliver predictable successful product launches. Trusted by Disney Parks & Resorts, Pluralsight and start-ups across Silicon Valley, Dallas and beyond.
        </p>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10 items-center">
          {clientLogos.map((logo) => (
            <img key={logo} src={`/${logo}`} alt="Client Logo" className="max-h-10 w-full object-contain" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgencyPartner;