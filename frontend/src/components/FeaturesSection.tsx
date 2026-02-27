import React from 'react';

interface FeaturesSectionProps {
  onWatchVideo: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onWatchVideo }) => (
  <section id="how-it-works" className="py-24 bg-white overflow-hidden">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="text-center mb-24">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Turn Visitors Into Buyers in 3 Steps</h2>
        <p className="text-xl text-gray-600">Stop guessing. Start converting. Here is how we reveal the hidden revenue on your site.</p>
        <button 
          onClick={onWatchVideo}
          className="text-gray-500 font-medium hover:text-indigo-600 transition-colors inline-flex items-center gap-2 mt-4"
        >
          Watch Video 🎬
        </button>
      </div>

      <div className="relative max-w-3xl mx-auto z-0">
        {/* The Dotted Line */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 h-full w-48 pointer-events-none -z-10">
          <svg width="100%" height="100%" viewBox="0 0 192 800" fill="none" preserveAspectRatio="none">
            <path d="M96 0 C-30 150, 222 250, 96 400 S -30 550, 96 800" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="10 10" strokeLinecap="round"/>
          </svg>
        </div>

        <div className="space-y-16">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img src="/youput.gif" alt="Input" className="w-full max-w-sm md:w-96 h-auto" />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-2">1. Enter Your URL</h3>
              <p className="text-gray-600 font-medium">Paste your website link. No code to install, no complex setup. Just paste and go.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <img src="/wedo.gif" alt="Simulate" className="w-full max-w-sm md:w-96 h-auto" />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-2">2. We Simulate Traffic</h3>
              <p className="text-gray-600 font-medium">Our AI agents browse your site like real humans, voicing their confusion and frustration in real-time.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img src="/youget.gif" alt="Reveal" className="w-full max-w-[18rem] md:w-72 h-auto" />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-2">3. You Get The Fixes</h3>
              <p className="text-gray-600 font-medium">Receive a prioritized checklist of exactly what to fix to stop losing sales immediately.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-center">
        <a href="#pricing" className="inline-flex items-center justify-center h-14 px-10 text-lg font-bold text-white bg-marketing-gradient rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          Start Free Now
        </a>
      </div>
    </div>
  </section>
);