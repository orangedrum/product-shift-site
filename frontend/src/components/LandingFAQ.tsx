// frontend/src/components/LandingFAQ.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const LandingFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    { 
      q: "Is the free demo really free?", 
      a: (<span>
          Yes. You get one complete analysis with our 'Alex' persona for free. No credit card required. <a href="#demo" onClick={scrollToDemo} className="text-indigo-600 font-bold hover:underline">Try it now ➡️</a>
         </span>)
    },
    { 
      q: "How can I test if my website works for customers?", 
      a: "There is no technical setup or learning curve. Simply enter your URL, pick your most likely site visitor, and we take care of the rest." 
    },
    { 
      q: "Do I need to be technical to use this website checkup?", 
      a: "No. We take care of that. You just enter your URL, choose who you want insights from, hit enter and you'll have individual insights and a full report in seconds.  Everything is written in plain language. You don’t need to know UX or analytics. We provide clear suggestions and fixes to take action on." 
    },
    { 
      q: "Can I use tests across multiple landing pages?", 
      a: "Yes. You can use your tests on any pages you own: homepages, booking pages, sales pages, or link‑in‑bio landing pages. You could even run it against high performing sites, your favorite sites, or even competitor sites to learn what works, what doesn't, and why." 
    },
    { 
      q: "What’s the difference between packs and the monthly plan?", 
      a: "Packs are one‑time purchases you can use whenever you want and never expire. They can be bought as you go or used on top of monthly credits. The monthly plan gives you fresh tests every month so you can stay on top of new pages, campaigns, and changes." 
    },
    { 
      q: "How is this different from Google Analytics?", 
      a: "Google Analytics tells you WHAT is happening (e.g., high bounce rate). But knowing 'the what' doesn't usually tell you how to fix it. Our AI Agent tells you WHY (e.g., 'The pricing is confusing') so you know exactly how to take action towards improvement." 
    },
    { 
      q: "Do I need to install anything?", 
      a: "No. No setup, no learning curve, no consultant costs. Just enter your URL and we do the rest." 
    },
    { 
      q: "Can I test my competitor's site?", 
      a: "Absolutely. It's a great way to see what they are doing right (or wrong)." 
    }
  ];

  return (
    <section className="bg-transparent py-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Common Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-gray-900">{faq.q}</span>
                {openIndex === i ? <ChevronUp size={20} className="text-black" /> : <ChevronDown size={20} className="text-black" />}
              </button>
              {openIndex === i && (
                <div className="p-4 bg-gray-200 border-t border-gray-300 text-gray-800 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
