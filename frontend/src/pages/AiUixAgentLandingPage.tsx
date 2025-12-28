import React from 'react';
import MarketingHero from '../components/MarketingHero';
import { Link } from 'react-router-dom';
import { BarChart, Bot, BrainCircuit, Check, Users } from 'lucide-react';

// --- Internal Components for Landing Page Sections ---

const FeaturesSection = () => (
  <section className="bg-white py-24 sm:py-32">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wider uppercase">How It Works</h2>
        <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          From URL to Actionable Insights in 3 Steps
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Our AI agent simulates a full usability study, so you can focus on building, not recruiting.
        </p>
      </div>
      <div className="mt-20 grid md:grid-cols-3 gap-x-8 gap-y-12 text-left">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">1. Select Personas</h3>
            <p className="mt-1 text-base text-gray-600">Choose from a panel of 6 diverse AI-powered user personas to match your target audience.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Bot size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">2. Run Analysis</h3>
            <p className="mt-1 text-base text-gray-600">The AI agents browse your site, performing tasks and analyzing the UX based on NN/g heuristics.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">3. Get Your Report</h3>
            <p className="mt-1 text-base text-gray-600">Receive a consolidated report with raw user feedback, performance charts, and actionable fixes.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PricingSection = () => (
  <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Affordable UX Research for Every Stage
      </h2>
      <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
        Get the insights of a full usability study without the five-figure price tag.
      </p>
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="pricing-card bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-left flex flex-col">
          <h3 className="text-2xl font-bold text-center">Free Demo</h3>
          <p className="text-center text-gray-500 mt-2">Experience the power of AI analysis</p>
          <hr className="my-6" />
          <ul className="space-y-3 text-gray-600 flex-grow">
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Run <strong>1 Free Test</strong></li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Analysis with 3 Personas</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Includes Visual & Heuristic Analysis</li>
          </ul>
          <Link to="/ai-powered-ux-healthtech" className="mt-8 block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Run Free Demo
          </Link>
        </div>
        {/* Pro Plan */}
        <div className="pricing-card best-value bg-white p-8 border-2 border-indigo-500 rounded-xl shadow-2xl text-left flex flex-col relative">
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full">Full Access</div>
          <h3 className="text-2xl font-bold text-center">Pro & Enterprise</h3>
          <p className="text-center text-gray-500 mt-2">For teams that need to ship with confidence</p>
          <hr className="my-6" />
          <ul className="space-y-3 text-gray-600 flex-grow">
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Up to 5 Personas per Test</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Visual & Heuristic Analysis</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Downloadable PDF Reports</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Performance Charts</li>
            <li className="flex items-center gap-3"><Check className="text-green-500" size={20} />Unlimited Monthly Tests</li>
          </ul>
          <a href="mailto:sales@theproductshift.com?subject=Inquiry about Pro Access" className="mt-8 block w-full text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-95">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  </section>
);

const AiUixAgentLandingPage: React.FC = () => {
  return (
      <main>
        <MarketingHero />
        <FeaturesSection />
        <PricingSection />
      </main>
  );
};

export default AiUixAgentLandingPage;