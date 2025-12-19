import React from 'react';

const FinalCta = () => {
  return (
    <section className="bg-gray-800">
      <div className="container mx-auto max-w-4xl text-center py-20 px-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Ready to build a product that wins?
        </h2>
        <p className="mt-6 text-lg text-gray-300">Let's talk about how AI-powered UX research can transform your product strategy.</p>
        <button className="mt-8 inline-flex items-center justify-center bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105">
          Book a Free Consultation
        </button>
      </div>
    </section>
  );
};

export default FinalCta;