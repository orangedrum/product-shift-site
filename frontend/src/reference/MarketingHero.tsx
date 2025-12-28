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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[rgb(255,119,51)] via-[rgb(255,102,255)] to-[rgb(77,210,255)]">
            UX for Health & Neuro Apps
          </span>
          <br />
          That Need Patient-Friendly Adoption
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
          Is patient engagement low? Are users getting confused? Watch how users actually struggle with standard health app interfaces.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-colors">
            &#9658; Watch Full User Testing Session
          </button>
          <a href="#value-prop" className="px-8 py-4 bg-gradient-to-r from-[rgb(255,119,51)] via-[rgb(255,102,255)] to-[rgb(77,210,255)] text-white font-bold rounded-lg hover:opacity-95 transition-transform transform hover:-translate-y-0.5">
            Get Free Checklist
          </a>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;