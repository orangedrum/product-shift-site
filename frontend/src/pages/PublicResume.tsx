import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, CheckCircle, ExternalLink, Eye, Mail, MessageSquare, Zap, Globe, Briefcase, Sparkles, Loader2, X, ArrowRight, Search, Target, Layout, TrendingUp, Download, FileText } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { SpeechBubble } from '../components/SpeechBubble';
import AgencyPartner from '../components/AgencyPartner';
import ProductLab from '../components/ProductLab';
import StatsSection from '../components/StatsSection';
import { SEOMetadata } from '../components/SEOMetadata';
import { VideoThumbnail } from '../components/VideoThumbnail';

const PublicResume: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

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

  // CTO Logic: Leveraging the state to open the speaking reel modal
  const handleVideoPlay = () => {
    setIsVideoOpen(true);
  };

  const assets = resume.selected_assets || [];

  // CTO BOT-PROOFING: Generate Structured Data for ATS/LLM Agents
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Jean Kaluza",
    "jobTitle": resume?.mapped_title || "Executive Product Strategist",
    "url": window.location.href,
    "description": resume?.professional_summary,
    "knowsAbout": assets.filter((a: any) => a.type === 'skill').map((s: any) => s.title).join(', '),
    "hasOccupation": assets.filter((a: any) => a.type === 'work_history').map((j: any) => ({
      "@type": "Occupation",
      "name": j.title,
      "description": j.description?.join(' '),
      "hiringOrganization": {
        "@type": "Organization",
        "name": j.company
      }
    })),
    "sameAs": assets.filter((a: any) => a.type === 'writing_sample' || a.type === 'talk').map((item: any) => item.source_url).filter((url: any) => url && url !== 'N/A')
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24">
      {/* SEO & Machine Readability Metadata */}
      <SEOMetadata 
        title={`Jean Kaluza - ${resume.mapped_title || 'Executive Strategist'}`}
        description={resume.professional_summary}
        canonicalUrl={window.location.href}
        jsonLd={jsonLd}
      />

      {/* 
        ATS-OPTIMIZED PRINT LAYER
        Visible only when printing/downloading. decupled from interactive UI for maximum polish.
      */}
      <div className="hidden print:block font-sans text-black leading-tight">
        <div className="border-b-4 border-black pb-2 mb-6 text-center">
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Jean Kaluza</h1>
          <p className="text-xl font-bold text-gray-800">{resume.mapped_title || "Executive Product Strategist"}</p>
          <div className="text-[10px] mt-1 font-sans uppercase tracking-widest">
            jean@theproductshift.com • theproductshift.com • linkedin.com/in/jean-kaluza
          </div>
        </div>

        <section className="mb-6">
          <h2 className="text-sm font-black uppercase border-b border-gray-300 mb-2">Professional Summary</h2>
          <p className="text-[11px] leading-relaxed italic">"{resume.professional_summary}"</p>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-black uppercase border-b border-gray-300 mb-2">Strategic Accomplishments</h2>
          <ul className="list-disc pl-5 text-[11px] space-y-1">
            {assets.filter((a: any) => a.type === 'win').map((win: any, i: number) => (
              <li key={i}><strong>{win.title}:</strong> {win.roi_metrics?.[0] || win.description?.[0]}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-black uppercase border-b border-gray-300 mb-2">Pillars of Expertise</h2>
          <p className="text-[10px] font-sans leading-relaxed tracking-wider">
            {assets.filter((a: any) => a.type === 'skill' || a.type === 'tooling').map((s: any) => s.title).join(' • ')}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase border-b border-gray-300 mb-3">Professional Experience</h2>
          <div className="space-y-4">
            {assets.filter((a: any) => a.type === 'work_history').map((job: any, i: number) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-sm">{job.title}</h3>
                  <span className="font-bold text-[10px] font-sans uppercase">{job.company}</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5 leading-snug">
                  {job.description?.map((bullet: string, bi: number) => (
                    <li key={bi}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* INTERACTIVE EXPERIENCE LAYER: Completely hidden when printing */}
      <div className="print:hidden">
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
              Bespoke Strategy for {resume.target_role}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-end">
            <div>
              {/* Authority Header: Exact Speaking Reel logic from Speaker.tsx */}
              <div className="max-w-[480px] mb-8">
                <div className="relative animate-float">
                  <VideoThumbnail 
                    imageSrc="/66a8f3cd-cec2-47f4-a67e-1ead53ccdc28.png"
                    alt="Jean speaking at conference"
                    onPlay={handleVideoPlay}
                    label="Watch Speaking Reel"
                  />
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-marketing-gradient rounded-full opacity-20 animate-pulse blur-xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-brand-pink rounded-full opacity-30 animate-pulse delay-1000 blur-xl"></div>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-none text-gray-900">
                Jean Kaluza
              </h1>
              <p className="text-xl md:text-2xl font-bold text-gray-500 max-w-xl italic">
                {resume.mapped_title || "Executive Product Strategist"}
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 relative shadow-sm">
               <Sparkles className="absolute -top-3 -left-3 text-brand-pink" size={32} />
               <p className="text-[7px] font-black uppercase text-gray-400 mb-4 tracking-widest">Professional Summary</p>
               <p className="text-lg font-bold text-gray-900 leading-tight italic">
                 "{resume.professional_summary}"
               </p>

               <div className="mt-8 flex flex-col items-start gap-4 no-print">
                 <NeoButton onClick={() => window.print()} className="bg-black text-white px-8 text-sm h-10">
                   <Download size={16} /> Print this resume
                 </NeoButton>
                 <button 
                   onClick={() => setIsProcessModalOpen(true)}
                   className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 group"
                 >
                   My Process <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
          </div>
        </header>

        {/* Agency Partner Logo Fold: Directly below Header */}
        <div className="mb-12 border-t border-gray-50 pt-4">
          <AgencyPartner />
        </div>

        {/* Performance Stats Row: Using exact modular component from homepage */}
        <div className="mb-20">
          <StatsSection />
        </div>

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

            {/* Case Studies (Logic Proofs) */}
            {assets.some((a: any) => a.type === 'case_study') && (
              <section>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-8 flex items-center gap-3">
                  <FileText size={16} /> Logic Proofs: Case Studies
                </h3>
                <div className="space-y-16">
                  {assets.filter((a: any) => a.type === 'case_study').map((cs: any, idx: number) => (
                    <div key={idx} className="group border-2 border-black rounded-3xl overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="bg-black text-white p-8">
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 block">{cs.company}</span>
                         <h4 className="text-3xl font-black leading-tight mb-4">{cs.title}</h4>
                         <div className="grid md:grid-cols-2 gap-8 mt-8 border-t border-white/20 pt-8">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">The Challenge</p>
                               <p className="text-lg leading-relaxed">{cs.story?.problem || cs.description?.[0]}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-[#39ff14] mb-2">The Outcome</p>
                               <p className="text-lg leading-relaxed font-bold">{cs.story?.results || "Successful strategic delivery."}</p>
                            </div>
                         </div>
                      </div>
                      <div className="p-8 grid md:grid-cols-3 gap-12">
                         <div className="md:col-span-2 space-y-8">
                            <div>
                               <h5 className="font-black text-sm uppercase mb-3 flex items-center gap-2"><Target size={14} className="text-indigo-600"/> Methodology</h5>
                               <p className="text-gray-600 leading-relaxed italic">{cs.story?.method}</p>
                            </div>
                            <div>
                               <h5 className="font-black text-sm uppercase mb-3 flex items-center gap-2"><Search size={14} className="text-indigo-600"/> Key Findings</h5>
                               <p className="text-gray-600 leading-relaxed">{cs.story?.findings}</p>
                            </div>
                         </div>
                         <div className="space-y-6">
                            {(cs.story?.data?.length > 0 || cs.roi_metrics?.length > 0) && (
                               <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                  <h5 className="font-black text-[10px] uppercase mb-4 tracking-widest">Hard Evidence</h5>
                                  <ul className="space-y-4">
                                     {(cs.story?.data || cs.roi_metrics || []).map((d: string, di: number) => (
                                        <li key={di} className="text-xs font-bold text-indigo-900 flex items-start gap-2">
                                           <CheckCircle size={14} className="text-indigo-600 shrink-0" /> {d}
                                        </li>
                                     ))}
                                  </ul>
                               </div>
                            )}
                            {cs.source_url && cs.source_url !== 'N/A' && (
                               <a href={cs.source_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-4 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors">
                                  View Visual Assets <ExternalLink size={14} />
                               </a>
                            )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Product Lab Section: Using modular component from homepage */}
            <section className="pt-12">
              <ProductLab />
            </section>

            {/* Publications & Talks (The "Extra Extra" Section) */}
            {(assets.some((a: any) => a.type === 'writing_sample' || a.type === 'talk')) && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-black text-white px-10 py-4 text-4xl font-black uppercase tracking-tighter rotate-[-2deg] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
                    Extra! Extra!
                  </div>
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em]">
                    Published Pieces
                  </h3>
                </div>
                
                <div className="border-t border-b border-gray-900 py-8">
                  <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
                    {assets.filter((a: any) => a.type === 'writing_sample' || a.type === 'talk').map((item: any, idx: number) => (
                      <div key={idx} className="group cursor-pointer">
                        <span className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest border-b border-gray-100 pb-1">
                          {item.company} — {item.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-2xl font-black text-gray-900 mb-3 leading-none group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3 italic">
                          {item.description?.[0]}
                        </p>
                        {item.source_url && item.source_url !== 'N/A' && (
                          <a 
                            href={item.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black hover:text-indigo-600 transition-colors"
                          >
                            View Full Archive <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
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
              <div className="relative mb-6 rounded-2xl overflow-hidden shadow-elegant bg-white border border-gray-100">
                <SpeechBubble 
                  imageSrc="/jeankaluza.png"
                  name="Jean Kaluza"
                  role={resume.mapped_title || "Executive Product Strategist"}
                  quote={`Seen enough proofs? Let's talk ROI for ${resume.target_role}.`}
                  mood="positive"
                />
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer">
                  <NeoButton className="w-full bg-marketing-gradient text-white py-4 font-black">Book Interview</NeoButton>
                </a>
                <button onClick={() => window.print()} className="w-full">
                  <NeoButton variant="secondary" className="w-full flex items-center justify-center gap-2 font-black">
                    <Download size={16} /> Download Resume
                  </NeoButton>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      </div>

      {/* "How We Work" Modal */}
      {isProcessModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in no-print" onClick={() => setIsProcessModalOpen(false)}>
          <div className="relative w-full max-w-4xl bg-white rounded-[2rem] border-2 border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsProcessModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-colors z-10">
              <X size={24} />
            </button>
            <div className="p-8 md:p-12 overflow-y-auto">
              <div className="mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-2">This is How We Work</h2>
                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">End-to-End Strategic Delivery</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Search size={24} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900">1. Discovery</h4>
                  <p className="text-gray-600 leading-relaxed italic text-sm">
                    Deep dives into user behavior data, stakeholder interviews, and competitive analysis to find the logical "leak" in your current funnel.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-pink-100 text-brand-pink rounded-xl flex items-center justify-center shadow-sm">
                    <Target size={24} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900">2. Strategy</h4>
                  <p className="text-gray-600 leading-relaxed italic text-sm">
                    Mapping the UX logic. We define the functional requirements and strategic hooks that align your product vision with the user's immediate needs.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Layout size={24} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900">3. Execution</h4>
                  <p className="text-gray-600 leading-relaxed italic text-sm">
                    High-velocity prototyping and Vibe-Coding. We build and test functional proofs quickly to ensure the design handles real-world friction before scale.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shadow-sm">
                    <TrendingUp size={24} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900">4. Growth</h4>
                  <p className="text-gray-600 leading-relaxed italic text-sm">
                    ROI tracking and conversion optimization loops. We monitor results post-launch to refine metrics and ensure the long-term success of the product.
                  </p>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
                <NeoButton onClick={() => setIsProcessModalOpen(false)} className="bg-black text-white px-12">
                  Got it, Let's Build
                </NeoButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal for Speaking Reel */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 no-print" onClick={() => setIsVideoOpen(false)}>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-black/50 rounded-full"
            >
              <X size={24} />
            </button>
            <div className="aspect-video bg-black flex items-center justify-center">
               <iframe 
                 className="w-full h-full"
                 src="https://player.vimeo.com/video/203961200?autoplay=1" 
                 title="Jean Kaluza Speaking Reel"
                 allow="autoplay; encrypted-media"
               />
            </div>
          </div>
        </div>
      )}

      {/* Floating Footer Ticker (Mobile only or persistent) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 no-print block md:hidden z-50">
         <NeoButton onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-full bg-marketing-gradient text-white">Back to Top</NeoButton>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-size: 11pt !important; }
          @page { margin: 0.75in; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>

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
