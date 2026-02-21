import React from 'react';
import { BarChart, CheckCircle } from 'lucide-react';

export const AnalyticsUxTech = () => (
  <section className="pt-20 pb-0 bg-white border-t-2 border-black relative overflow-hidden">
      {/* Diagonal Line Separator */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block z-10">
        <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-black transform -skew-x-6 origin-top"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-20">
        {/* VS Badge */}
        <div 
          className="absolute top-1/2 left-[50%] z-30 bg-black border-4 border-white rounded-full p-4 shadow-xl hidden lg:block"
          style={{ transform: 'translate(-113%, -50%)' }}
        >
          <span className="text-sm font-black text-white">VS</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Analytics (The What) */}
          <div className="flex flex-col justify-start lg:pr-24 pb-12 lg:pb-0 relative">
            <h2 className="text-3xl font-black text-gray-500 mb-6">
            Other Analytics tell you <span className="italic underline text-black">what</span> is happening.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Analytics dashboards show you high bounce rates and abandoned carts, but they don't tell you <em>why</em> users are leaving. 
            </p>
            
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm max-w-xs mx-auto lg:mx-0 w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm w-fit">
                  <BarChart className="w-4 h-4 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Analytics Dashboard</h4>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px]">
                   <span className="text-gray-500">Bounce Rate</span>
                   <span className="font-mono font-bold text-gray-700 text-xs">65%</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-1.5">
                   <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                 </div>
                 <p className="text-[10px] text-gray-400 mt-2">"Users are leaving /checkout"</p>
              </div>
            </div>
          </div>

          {/* Mobile Separator (Horizontal) */}
          <div className="relative h-12 lg:hidden flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-black"></div>
            <div className="relative z-10 bg-black border-4 border-white rounded-full p-3 shadow-lg">
              <span className="text-xs font-black text-white">VS</span>
            </div>
          </div>

          {/* Right: Product Shift (The Why) */}
          <div className="flex flex-col justify-end gap-8 lg:pl-12 relative p-8 rounded-3xl overflow-hidden min-h-[600px]">
            <div className="relative z-10">
                <h2 className="text-3xl font-black text-gray-900 mb-6">
                  We tell you <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">WHY</span>.
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">
                  Our AI agents browse your site like real humans, verbalizing their confusion so you can fix it.
                </p>
            </div>

            {/* Anchored Persona */}
            <div className="relative z-10 mt-auto w-full flex items-end justify-between">
                 {/* 1. Marcus Group (Left) */}
                 <div className="flex flex-col items-start relative z-20 lg:-ml-24 lg:-mb-8">
                    {/* Bubble */}
                    <div className="relative bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] mb-4 max-w-sm transform -rotate-1 ml-4 sm:ml-12">
                        <p className="text-sm font-bold italic text-gray-900 leading-snug">"I'm ready to buy, but I have no idea if this integrates with Salesforce. I can't risk it."</p>
                        <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white border-b-2 border-r-2 border-black transform rotate-45"></div>
                    </div>
                    {/* Marcus */}
                    <img 
                        src="https://api.dicebear.com/7.x/notionists/svg?seed=Marcus" 
                        alt="Marcus" 
                        className="h-52 w-52 object-contain" 
                     />
                 </div>

                 {/* 3. Actionable Recommendation (Right) */}
                 <div className="bg-white text-gray-900 p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] relative z-10 w-full max-w-xs mb-12 ml-4">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold uppercase tracking-wider text-[10px]">
                      <CheckCircle size={14} /> Actionable Recommendation
                    </div>
                    <h3 className="text-sm font-bold mb-3 leading-tight">Clarify Salesforce Integration</h3>
                    <div className="p-2 bg-indigo-50 border-2 border-indigo-100 rounded text-[10px] font-bold text-indigo-900 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div> 
                      <span>FIX: Add "Works with Salesforce" logo strip.</span>
                    </div>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);