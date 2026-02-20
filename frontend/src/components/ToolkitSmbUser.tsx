import React from 'react';
import { Zap, Target, Puzzle } from 'lucide-react';

export const ToolkitSmbUser = () => (
  <section className="py-24 bg-gray-50">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Your New Conversion Toolkit</h2>
        <p className="text-xl text-gray-600">Everything you need to understand your users.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Easy</h3>
          <ul className="text-gray-500 mb-6 text-sm leading-relaxed space-y-2">
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Full web page audit in seconds</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Visitor agents act just like real-life users</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Test for CRO</li>
          </ul>
        </div>
        <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Useful</h3>
          <ul className="text-gray-500 mb-6 text-sm leading-relaxed space-y-2">
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Test Redesigns Instantly</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Diagnose sales drops</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Optimize ad spend</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Try Your Competitor's Sites</li>
          </ul>
        </div>
        <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Puzzle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Portable</h3>
          <ul className="text-gray-500 mb-6 text-sm leading-relaxed space-y-2">
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Audit on the fly</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>Chrome Extension included</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>1-click Audits Anywhere</li>
          </ul>
          <a href="#" className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">Download Extension ↗</a>
        </div>
      </div>
      <div className="mt-16 text-center">
        <div className="inline-block">
          <a href="#pricing" className="inline-flex items-center justify-center h-14 px-10 text-lg font-bold text-white bg-marketing-gradient rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            Start Free Now
          </a>
        </div>
      </div>
    </div>
  </section>
);