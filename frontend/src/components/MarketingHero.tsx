import React from 'react';
import { Link } from 'react-router-dom';

const MarketingHero: React.FC = () => {
  return (
    <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden text-white">
      {/* Video Background Placeholder */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-black/65 z-10"></div>
        {/* TODO: Move 'kaluzasproductreal.mp4' to frontend/public/images/ and uncomment below */}
        {/* <video autoPlay muted loop playsInline poster="/images/poster.jpg" className="w-full h-full object-cover">
            <source src="/images/kaluzasproductreal.mp4" type="video/mp4" />
        </video> */}
        <div className="w-full h-full bg-gray-900"></div> {/* Fallback background */}
      </div>

      <div className="container mx-auto px-4 relative z-20 text-center max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Instant UX Audits
          </span>
          <br />
          Powered by AI Personas
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
          Stop guessing. Get an expert-level usability report, complete with feedback from 5 distinct AI user personas, for a fraction of the cost of traditional testing.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/ai-powered-ux-healthtech" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5">
            Run a Free Analysis
          </Link>
          <a href="#pricing" className="px-8 py-4 border-2 border-gray-400 text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-colors">
            View Pricing
          </a>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;