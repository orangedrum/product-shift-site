import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, CheckCircle, ExternalLink, Eye, Mail, MessageSquare, Zap, Globe, Briefcase, Sparkles, Loader2 } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { SpeechBubble } from '../components/SpeechBubble';

const PublicResume: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from('career_resumes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setResume(data);
      }
      setLoading(false);
    };
    fetchResume();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center"><h1 className="text-4xl font-black mb-4">404</h1><p className="text-gray-600 mb-8">This bespoke resume configuration could not be found.</p><Link to="/"><NeoButton>Back to ProductShift</NeoButton></Link></div>;

  const assets = resume.selected_assets || [];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24">
      {/* 2026 Ticker Header: Persistent high-impact wins */}
      <div className="w-full bg-black py-3 overflow-hidden border-b-2 border-black sticky top-0 z-50">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              {assets.filter((a: any) => a.type === 'win').map((win: any, idx: number) => (
                <span key={idx} className="text-[#39ff14] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={14} /> {win.roi_metrics?.[0] || win.title}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-12 md:py-20">
        {/* Header Section */}
        <header className="mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-[10px] font-black text-indigo-600 mb-6 uppercase tracking-widest">
            Bespoke Strategy for {resume.target_role}
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-end">
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-none text-gray-900">
                Jean Kaluza
              </h1>
              <p className="text-xl md:text-2xl font-bold text-gray-500 max-w-xl italic">
                Product Strategist & UX Discovery Lead specializing in end-to-end growth for high-velocity teams.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 relative shadow-sm">
               <Sparkles className="absolute -top-3 -left-3 text-brand-pink" size={32} />
               <p className="text-sm font-black uppercase text-gray-400 mb-4 tracking-widest">Professional Summary</p>
               <p className="text-2xl font-bold text-gray-900 leading-tight italic">
                 "{resume.professional_summary}"
               </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Work History */}
            <section>
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-8 flex items-center gap-3">
                <Briefcase size={16} /> Work History
              </h3>
              <div className="space-y-12">
                {assets.filter((a: any) => a.type === 'work_history').map((job: any, idx: number) => (
                  <div key={idx} className="group relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gray-100 group-hover:bg-marketing-gradient transition-colors rounded-full" />
                    <h4 className="text-2xl font-black text-gray-900 mb-1">{job.title}</h4>
                    <p className="text-lg font-bold text-indigo-600 mb-4">{job.company}</p>
                    <ul className="space-y-3">
                      {job.description?.map((bullet: string, bIdx: number) => (
                        <li key={bIdx} className="text-gray-600 leading-relaxed font-medium flex items-start gap-3">
                          <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Publications & Talks (The "Extra Extra" Section) */}
            {(assets.some((a: any) => a.type === 'writing_sample' || a.type === 'talk')) && (
              <section>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-8 flex items-center gap-3">
                  <Globe size={16} /> Publications & Authority
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {assets.filter((a: any) => a.type === 'writing_sample' || a.type === 'talk').map((item: any, idx: number) => (
                    <MarketingCard key={idx} className="p-6 hover:translate-y-[-4px] transition-transform duration-300">
                       <span className="text-[10px] font-black uppercase text-brand-pink mb-2 block">{item.type.replace('_', ' ')}</span>
                       <h4 className="text-lg font-black mb-2 leading-tight">{item.title}</h4>
                       <p className="text-sm text-gray-500 font-bold mb-4">{item.company}</p>
                       {item.source_url && item.source_url !== 'N/A' && (
                         <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                           Read Full Piece <ExternalLink size={12} />
                         </a>
                       )}
                    </MarketingCard>
                  ))}
                </div>
              </section>
            )}

            {/* User Mirror SaaS Showcase: Recycled from homepage */}
            <section className="pt-12">
              <NeoCard className="bg-gray-900 text-white p-10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center px-2 py-1 rounded bg-indigo-600 text-[10px] font-black mb-6 uppercase">Active SaaS Product</div>
                  <h3 className="text-3xl font-black mb-4">User Mirror: AI-Powered Research</h3>
                  <p className="text-gray-400 text-lg mb-8 max-w-xl">
                    I don't just strategy; I build. I launched User Mirror to solve the discovery speed gap. It leverages synthesized personas to run usability audits in seconds, proving end-to-end product/growth leadership.
                  </p>
                  <div className="flex gap-4">
                    <a href="https://www.theproductshift.com/ai-powered-ux" target="_blank" rel="noreferrer">
                      <NeoButton className="bg-white text-black hover:bg-gray-100">Live Product Demo</NeoButton>
                    </a>
                  </div>
                </div>
                <Zap className="absolute -bottom-8 -right-8 text-white/5" size={300} />
              </NeoCard>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            {/* Skills & Tooling */}
            <div>
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-6">Pillars of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {assets.filter((a: any) => a.type === 'skill' || a.type === 'tooling').map((item: any, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-black border border-gray-200">
                    {item.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {assets.some((a: any) => a.type === 'recommendation') && (
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em]">Validation</h3>
                {assets.filter((a: any) => a.type === 'recommendation').map((rec: any, idx: number) => (
                  <div key={idx} className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 relative">
                    <p className="text-sm font-bold text-gray-800 italic leading-relaxed mb-4">"{rec.description?.[0]}"</p>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">— {rec.company}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Final Conversion CTA */}
            <div className="sticky top-24">
              <SpeechBubble 
                imageSrc="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/jean-avatar.png" // Fallback to provided logic
                name="Jean Kaluza"
                role="Product Strategist"
                quote={`Seen enough proofs? Let's talk ROI for ${resume.target_role}.`}
                mood="positive"
              />
              <div className="mt-6 flex flex-col gap-3">
                <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer">
                  <NeoButton className="w-full bg-marketing-gradient text-white py-4 font-black">Book Strategy Call</NeoButton>
                </a>
                <a href="mailto:jean@theproductshift.com" className="w-full">
                  <NeoButton variant="secondary" className="w-full flex items-center justify-center gap-2 font-black">
                    <Mail size={16} /> Email Direct
                  </NeoButton>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Footer Ticker (Mobile only or persistent) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 no-print block md:hidden z-50">
         <NeoButton onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-full bg-marketing-gradient text-white">Back to Top</NeoButton>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PublicResume;
