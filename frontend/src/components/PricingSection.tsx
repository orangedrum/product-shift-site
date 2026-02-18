import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const PricingSection = () => (
  <section id="pricing" className="py-24 bg-white border-t-2 border-black">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-black mb-4">Simple, Transparent Pricing</h2>
        <p className="text-xl text-gray-600">Start for free. Scale as you grow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Pay As You Go Card */}
        <div className="relative p-8 bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_#000] flex flex-col">
          <div className="mb-4">
            <h3 className="text-2xl font-black text-black">Pay As You Go</h3>
            <p className="text-gray-600 mt-2">Start free, pay only for what you use.</p>
          </div>
          <div className="mb-8">
            <span className="text-5xl font-black text-black">$0</span>
            <span className="text-gray-600 font-bold"> / mo</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <span className="font-bold">No commitment required</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <span className="font-bold">Get 3 Free Credits</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <span className="font-bold">Top up credits anytime</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-500 mt-1 shrink-0" />
              <span className="font-bold text-sm">Choose From 9 Personas</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-500 mt-1 shrink-0" />
              <span className="font-bold text-sm">Data-based, Actionable Report</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-500 mt-1 shrink-0" />
              <span className="font-bold text-sm">Clear Performance Metrics</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <span className="font-bold">Download & Share Reports</span>
            </li>
          </ul>
          <Link 
            to="/login"
            className="w-full block text-center py-4 bg-black text-white font-black text-lg rounded-lg hover:translate-y-[-2px] hover:shadow-lg transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Pro Subscription Card */}
        <div className="relative p-8 bg-[#f3f4f6] border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_#000] flex flex-col opacity-75 hover:opacity-100 transition-opacity">
          <div className="absolute -top-4 right-8 bg-[#ff1493] text-white font-black px-4 py-1 border-2 border-black rounded-full text-sm transform rotate-2">
            WAITLIST
          </div>
          <div className="mb-4">
            <h3 className="text-2xl font-black text-black">Bring Your Own Key</h3>
            <p className="text-gray-600 mt-2">Manage LLM cost internally.</p>
          </div>
          <div className="mb-8">
            <span className="text-5xl font-black text-black">$29</span>
            <span className="text-gray-600 font-bold"> / mo</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-black" />
              <span className="font-bold">Everything in the free plan</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-black" />
              <span className="font-bold">Unlimited tests with your keys</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-black" />
              <span className="font-bold">Use your own API keys (e.g. OpenAI, Anthropic)</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-black" />
              <span className="font-bold">300 EC2 compute minutes / month</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-black" />
              <span className="font-bold">CI / API integration</span>
            </li>
          </ul>
          <Link 
            to="/waitlist" 
            className="block w-full py-4 bg-white text-black border-2 border-black font-black text-lg rounded-lg text-center hover:bg-gray-50 transition-all"
          >
            Join Waitlist
          </Link>
        </div>
      </div>
    </div>
  </section>
);