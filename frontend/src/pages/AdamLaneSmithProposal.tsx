import React, { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';
import { Check, ArrowRight, Calendar, Clock, DollarSign } from 'lucide-react';

const AdamLaneSmithProposal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Background Animation Effect (Lavalamp)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateOrbs = () => {
      const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      for (let i = 1; i <= 15; i++) {
        container.style.setProperty(`--orb-${i}-x`, `${r(-20, 120)}%`);
        container.style.setProperty(`--orb-${i}-y`, `${r(-20, 120)}%`);
      }
    };

    updateOrbs();
    const interval = setInterval(updateOrbs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePayment = async () => {
    if (!email) {
      alert('Please enter your email to proceed to payment.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'pilot-localization',
          email: email,
          segment: 'proposal'
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong initializing the payment.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative bg-white min-h-screen overflow-hidden font-sans text-gray-900" ref={containerRef}>
      {/* Global Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-all duration-[4000ms] ease-in-out"
            style={{
              left: `var(--orb-${i+1}-x, 50%)`,
              top: `var(--orb-${i+1}-y, 50%)`,
              width: `${300 + (i * 20)}px`,
              height: `${300 + (i * 20)}px`,
              backgroundColor: ['#ff1493', '#ff0000', '#ff8c00'][i % 3]
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full border border-indigo-100">
            Proposal for Adam Lane Smith
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Global Expansion Pilot
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            I want to take your top-performing course and handle the end-to-end localization into Spanish and German.
          </p>
        </div>

        {/* Video Section */}
        <div className="bg-black rounded-2xl shadow-2xl overflow-hidden border-4 border-black mb-12 transform hover:scale-[1.01] transition-transform duration-500">
          <VideoPlayer 
            src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/adamlanesmithespanolsample.mov" 
            className="w-full aspect-video"
          />
        </div>

        {/* Proposal Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Check className="text-green-600" strokeWidth={4} /> Deliverables
            </h3>
            <ul className="space-y-4 text-lg font-medium text-gray-700">
              <li className="flex items-start gap-3">
                <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-1">1</span>
                Fully dubbed/lip-synced video lessons
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-1">2</span>
                Translated workbooks
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-1">3</span>
                UX audit of the checkout flow for international users
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Clock size={16}/> Timeline</h4>
              <p className="text-3xl font-black">10 Days</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2"><DollarSign size={16}/> Investment</h4>
              <p className="text-3xl font-black">$2,500 <span className="text-lg font-medium text-gray-500">flat for the pilot</span></p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg font-medium text-gray-700 mb-8">
            You get a turnkey, global product without recording a single new minute of footage. If the demo looks as good to you as it does to me, let’s get started.
          </p>

          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg mb-8">
            <label className="block text-left text-sm font-bold text-gray-700 mb-2">Enter email to generate invoice:</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="adam@example.com" 
                className="flex-1 p-3 border-2 border-gray-300 rounded-lg font-medium focus:border-black focus:ring-0 outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button 
                onClick={handlePayment}
                disabled={loading}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Processing...' : 'Pay $2,500'}
              </button>
            </div>
          </div>

          <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer" className="inline-flex items-center text-indigo-600 font-bold hover:underline text-lg">
            <Calendar className="mr-2" /> Or talk for 10 minutes about the rollout
          </a>
          
          <p className="mt-12 text-gray-500 italic">"Thanks for taking the time and for all you do,<br/>Jean"</p>
        </div>
      </div>
    </main>
  );
};

export default AdamLaneSmithProposal;