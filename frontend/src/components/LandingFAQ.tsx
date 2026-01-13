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
      a: "You paste your website link, pick who you want to test as (new visitor, potential client, etc.), and the tool walks through your page like a visitor would. You get a short report showing where they’d get confused and what to fix first." 
    },
    { 
      q: "Do I need to be technical to use this website checkup?", 
      a: "No. Everything is written in plain language. You don’t need to know UX or analytics—just read the suggestions and decide which fixes to try." 
    },
    { 
      q: "Can I use tests across multiple landing pages?", 
      a: "Yes. You can use your tests on any pages you own: homepages, booking pages, sales pages, or link‑in‑bio landing pages." 
    },
    { 
      q: "What’s the difference between packs and the monthly plan?", 
      a: "Packs are one‑time purchases you can use whenever you want. The monthly plan gives you fresh tests every month so you can stay on top of new pages, campaigns, and changes." 
    },
    { 
      q: "How is this different from Google Analytics?", 
      a: "Google Analytics tells you WHAT is happening (e.g., high bounce rate). Our AI Agent tells you WHY (e.g., 'The pricing is confusing')." 
    },
    { 
      q: "Do I need to install anything?", 
      a: "No. Just enter your URL and we do the rest." 
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
