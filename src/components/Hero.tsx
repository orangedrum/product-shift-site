import React from 'react';
import { BarChart, Bot, BrainCircuit, Sparkles } from 'lucide-react';

const features = [
  {
    icon: <Bot size={28} className="text-brand-blue" />,
    title: 'AI-Powered Insights',
    description: 'Leverage AI to analyze user feedback and market data at scale.',
  },
  {
    icon: <BrainCircuit size={28} className="text-brand-blue" />,
    title: 'Strategic Roadmaps',
    description: 'Turn research into actionable product roadmaps that drive growth.',
  },
  {
    icon: <BarChart size={28} className="text-brand-blue" />,
    title: 'Data-Driven Results',
    description: 'Measure success with clear ROI and data-backed performance metrics.',
  },
];

const Hero = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
        {/* Main Hero Content */}
        <div className="inline-flex justify-center items-center bg-blue-100 text-brand-blue text-sm font-semibold py-1 px-4 rounded-full mb-4">
          <Sparkles size={16} className="mr-2 -ml-1" />
          Growth, AI UX, & Marketing Strategy Expert
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
            Turn UX Research
          </span>
          <span className="block text-gray-800">Into Higher ROIs</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
          AI-powered UX research and market strategy that delivers real data for successful product launches.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="inline-flex items-center justify-center bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
            Book a Call
          </button>
          <button className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-200 shadow-sm transition-transform transform hover:scale-105">
            View Services
          </button>
        </div>

        {/* Hero Image */}
        <div className="mt-16 relative w-full max-w-4xl mx-auto">
          <div className="absolute -inset-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-cyan opacity-20 blur-2xl"></div>
          <img src="/hero-image.png" alt="Product Shift Hero" className="relative rounded-xl shadow-2xl w-full" />
        </div>

        {/* Three-Column Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-x-8 gap-y-12 text-left">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-1 text-base text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;