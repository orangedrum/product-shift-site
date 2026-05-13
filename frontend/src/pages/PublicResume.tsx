import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Trophy, CheckCircle, ExternalLink, Globe, Briefcase, Sparkles, Loader2, X, 
  ArrowRight, Search, Target, TrendingUp, Download, FileText, ChevronUp, 
  Zap, AlertCircle, Info, Globe as GlobeIcon 
} from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import AgencyPartner from '../components/AgencyPartner';
import StatsSection from '../components/StatsSection';
import { SEOMetadata } from '../components/SEOMetadata';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { SpeechBubble } from '../components/SpeechBubble';
import { DemoSection } from '../components/DemoSection';
import { LavalampBackground } from '../components/LavalampBackground';

const PublicResume: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [expandedStudies, setExpandedStudies] = useState<Record<number, boolean>>({});

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

  const toggleStudy = (idx: number) => {
    setExpandedStudies(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // CTO FIX: Defensive Resolver to handle "Terminology Drift" from the AI
  const resolveStoryContent = (story: any, key: string) => {
    const synonyms: Record<string, string[]> = {
      problem: ['problem', 'the_problem', 'business_threat', 'challenge'],
      results: ['results', 'outcome', 'impact', 'roi_impact'],
      methodology: ['methodology', 'strategic_methodology', 'strategy', 'approach'],
      process: ['process', 'the_process', 'strategic_process', 'execution'],
      findings: ['findings', 'key_findings', 'critical_findings', 'insights']
    };
    const targetKeys = synonyms[key] || [key];
    const content = targetKeys.map(k => story?.[k]).find(val => val !== undefined);
    return Array.isArray(content) ? content : (content ? [content] : []);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  if (error || !resume) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <h1 className="text-4xl font-black mb-4 tracking-tighter">404</h1>
      <p className="text-gray-600 mb-8 font-bold">Bespoke resume configuration not found.</p>
      <Link to="/"><NeoButton variant="primary">Back to ProductShift</NeoButton></Link>
    </div>
  );

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
      "description": Array.isArray(j.description) ? j.description.join(' ') : (j.description || ''),
      "hiringOrganization": { "@type": "Organization", "name": j.company }
    })),
    "sameAs": assets.filter((a: any) => a.type === 'writing_sample' || a.type === 'talk')
      .map((item: any) => item.source_url)
      .filter((url: any) => url && url !== 'N/A')
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100">
      <SEOMetadata 
        title={`Jean Kaluza - ${resume.mapped_title || 'Executive Strategist'}`}
        description={resume.professional_summary}
        canonicalUrl={window.location.href}
        jsonLd={jsonLd}
      />

      {/* --- ATS-OPTIMIZED PRINT LAYER --- */}
      <div className="hidden print:block font-sans text-black leading-tight">
        {/* PAGE 1: ROI COVER LETTER */}
        {resume.cover_letter && (
          <div className="break-after-page mb-12">
            <div className="border-b-4 border-black pb-4 mb-10 text-center">
              <h1 className="text-4xl font-bold uppercase tracking-tighter">Jean Kaluza</h1>
              <div className="text-[10px] mt-2 font-sans uppercase tracking-widest font-bold">
                jean@theproductshift.com • theproductshift.com • linkedin.com/in/jean-kaluza
              </div>
            </div>
            <section className="mb-8">
          <p className="text-[12px] leading-relaxed font-bold mb-4">Dear Hiring Manager,</p>
          <p className="text-[12px] leading-relaxed font-medium whitespace-pre-wrap">{resume.cover_letter}</p>
            </section>
            <div className="mt-12 text-[10px] font-bold">
              — Jean Kaluza
            </div>
          </div>
        )}

        {/* PAGE 2+: RESUME HEADER */}
        <div className="border-b-4 border-black pb-4 mb-6 text-center">
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Jean Kaluza</h1>
          <p className="text-xl font-bold text-gray-800">{resume.mapped_title}</p>
          <div className="text-[10px] mt-2 font-sans uppercase tracking-widest font-bold">
            jean@theproductshift.com • theproductshift.com • linkedin.com/in/jean-kaluza
          </div>
        </div>

        <section className="mb-8 break-inside-avoid mt-[1em]">
          <h2 className="text-xs font-black uppercase border-b-2 border-black mb-3 pb-1 tracking-widest">Key Accomplishments</h2>
          <ul className="list-disc pl-5 text-[11px] space-y-1">
            {assets.filter((a: any) => a.type === 'win').map((win: any, i: number) => (
              <li key={i}>
                <strong>{win.title}:</strong> {win.roi_metrics?.[0] || (Array.isArray(win.description) ? win.description[0] : win.description)}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-black uppercase border-b-2 border-black mb-3 pb-1 tracking-widest">Executive Summary</h2>
          <p className="text-[11px] leading-relaxed italic font-medium">"{resume.professional_summary}"</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-black uppercase border-b-2 border-black mb-4 pb-1 tracking-widest">Professional Experience</h2>
          <div className="space-y-6">
            {assets.filter((a: any) => a.type === 'work_history').map((job: any, i: number) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-extrabold text-sm uppercase">{job.title}</h3>
                  <span className="font-black text-[10px] uppercase text-indigo-700">{job.company}</span>
                </div>
                <ul className="list-disc pl-5 text-[10px] space-y-1 font-medium text-gray-800">
                  {(Array.isArray(job.description) 
                    ? job.description 
                    : (typeof job.description === 'string' 
                        ? job.description.split('\n').map((s: string) => s.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean) 
                        : [])
                  ).map((bullet: string, bi: number) => (
                    <li key={bi}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black uppercase border-b-2 border-black mb-3 pb-1 tracking-widest">Expertise & Tooling</h2>
          <p className="text-[10px] font-bold leading-relaxed tracking-wider">
            {assets.filter((a: any) => a.type === 'skill' || a.type === 'tooling').map((s: any) => s.title).join(' • ')}
          </p>
        </section>
      </div>

      {/* --- INTERACTIVE EXPERIENCE LAYER --- */}
      <div className="print:hidden">
        {/* Sticky Header Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 shadow-sm">
          <div className="container mx-auto px-4 max-w-6xl flex justify-center">
            <div className="flex gap-6 md:gap-12">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors">Top</button>
              <button onClick={() => document.getElementById('experience')?.scrollIntoView({behavior: 'smooth'})} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors">Experience</button>
              <button onClick={() => document.getElementById('case-studies')?.scrollIntoView({behavior: 'smooth'})} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors">Case Studies</button>
              <button onClick={() => document.getElementById('saas-lab')?.scrollIntoView({behavior: 'smooth'})} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors">Extra Credit</button>
            </div>
          </div>
        </nav>

        {/* Header & Reel - Full width hero */}
        <header className="relative w-full min-h-[70vh] flex items-center -mt-12 md:-mt-20 overflow-hidden group">
          {/* Background Image & Gradient treatment for legibility */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/66a8f3cd-cec2-47f4-a67e-1ead53ccdc28.png" 
              className="w-full h-full object-cover object-center opacity-80 group-hover:scale-105 transition-all duration-[5000ms] ease-out" 
              alt="Jean Kaluza Background" 
            />
            {/* Adjusted gradient for better focus on center and text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-marketing-gradient opacity-10 mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 py-20 px-4 md:px-8 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-[7px] font-black text-white uppercase tracking-widest mb-6">
              Bespoke Strategy: {resume.target_role}
            </div>
            
            <h1 className="text-[2.5rem] md:text-[3.5rem] font-black tracking-tighter mb-3 leading-none text-white drop-shadow-2xl">
              Jean Kaluza
            </h1>
            
            <p className="text-base md:text-xl font-extrabold text-[#00bfff] tracking-tight italic mb-6 drop-shadow-lg leading-tight">
              {resume.mapped_title}
            </p>

            <div className="space-y-6 mb-10 max-w-2xl">
              <p className="text-sm md:text-base font-bold leading-snug text-white drop-shadow-md italic">
                "{resume.professional_summary}"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <NeoButton 
                variant="primary" 
                onClick={() => window.print()} 
                className="px-6 h-10 text-sm bg-marketing-gradient text-white border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <Download size={14} className="mr-2" /> Print Resume
              </NeoButton>
              
              <NeoButton 
                variant="primary" 
                onClick={() => setIsProcessModalOpen(true)} 
                className="px-6 h-10 text-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                Strategic Process <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </NeoButton>

              <button 
                onClick={() => setIsVideoOpen(true)}
                className="flex items-center gap-2 text-[7px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors ml-2 sm:ml-0"
              >
                <Sparkles size={12} className="text-brand-pink" /> Watch Authority Reel
              </button>
            </div>
          </div>

          {/* Animated Scroll Down Arrow */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <ChevronUp size={20} className="text-white rotate-180" />
          </div>

          {/* 2px Gradient Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-marketing-gradient z-10"></div>
        </header>

        <div className="container mx-auto px-4 max-w-6xl py-8 md:py-12">
          <div className="mb-12 border-t border-gray-100 pt-8">
            <AgencyPartner />
          </div>

          <div className="mb-16">
            <StatsSection />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* MAIN COLUMN */}
            <div className="lg:col-span-8 space-y-24">
              
              {/* Work History */}
              <section id="experience" className="scroll-mt-24">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.4em] mb-12 flex items-center gap-4">
                  <Briefcase size={20} className="text-black" /> Professional Experience
                </h3>
                <div className="space-y-16">
                  {assets.filter((a: any) => a.type === 'work_history').map((job: any, idx: number) => (
                    <div key={idx} className="group relative">
                      <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gray-100 group-hover:bg-marketing-gradient transition-all duration-500 rounded-full" />
                      <div className="flex justify-between items-baseline mb-4">
                        <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{job.title}</h4>
                        <span className="text-sm font-black uppercase tracking-widest text-indigo-600">{job.company}</span>
                      </div>
                      <ul className="space-y-4">
                        {(Array.isArray(job.description) 
                          ? job.description 
                          : (typeof job.description === 'string' 
                              ? job.description.split('\n').map((s: string) => s.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean) 
                              : [])
                        ).map((bullet: string, bIdx: number) => (
                          <li key={bIdx} className="text-gray-600 text-lg leading-snug font-medium flex items-start gap-4">
                            <CheckCircle className="mt-1 text-green-500 shrink-0" size={20} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Case Study Adventures */}
              {assets.some((a: any) => a.type === 'case_study') && (
                <section id="case-studies" className="scroll-mt-24">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.4em] mb-8 flex items-center gap-4">
                    <Zap size={20} className="text-brand-pink" /> Strategic Case Studies
                  </h3>
                  <div className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide -mx-4 px-4">
                    {assets.filter((a: any) => a.type === 'case_study').map((cs: any, idx: number, filteredArr: any[]) => (
                      <div key={idx} id={`case-study-${idx}`} className="w-[320px] md:w-[450px] flex-shrink-0 snap-start group rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative">
                        {/* Card Hook (Always Visible) */}
                        <div className="relative flex flex-col h-full">
                          <div className="absolute inset-0 z-0 bg-black rounded-3xl">
                            {((cs.story?.visuals?.find((v: any) => v.is_hero) || cs.story?.visuals?.[0])?.url) && (
                               <>
                                 <img 
                                   src={cs.story.visuals.find((v: any) => v.is_hero)?.url || cs.story.visuals[0].url} 
                                   className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[3000ms]" 
                                   alt="" 
                                 />
                                 <div className="absolute inset-0 bg-black/40" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                               </>
                            )}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-marketing-gradient rounded-t-3xl" />
                          </div>

                          <div className="relative z-10 p-10 flex flex-col justify-between text-white" style={{minHeight: '350px'}}>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 mb-3 block">{cs.company}</span>
                              <h4 className="text-2xl font-black leading-tight mb-4 tracking-tighter">{cs.title}</h4>
                              {cs.story?.teaser && (
                                <p className="text-sm font-medium italic text-gray-200 border-l-2 border-brand-pink pl-4 leading-relaxed">
                                  "{cs.story.teaser}"
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-8 pt-8 mt-auto">
              {/* Scanable ROI Phrase Wins */}
              <div className="flex flex-wrap gap-2">
                 {resolveStoryContent(cs.story, 'results').slice(0, 2).map((m: any, mIdx: number) => {
                   const text = typeof m === 'object' ? (m.content || m.text) : m;
                   const shortText = text && text.length > 50 ? text.substring(0, 47) + '...' : text;
                   return (
                     <div key={mIdx} className="bg-[#39ff14] text-black px-3 py-1 rounded-full text-[9px] font-bold tracking-tight shadow-lg">
                       {shortText}
                     </div>
                   );
                 })}
              </div>

              <NeoButton 
                onClick={() => toggleStudy(idx)}
                variant="primary"
                className="h-10 px-6 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg"
              >
                 {expandedStudies[idx] ? <><ChevronUp size={16} className="mr-2"/> Hide</> : <><Search size={16} className="mr-2"/> Explore</>}
              </NeoButton>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Adventure Content */}
                        {expandedStudies[idx] && (
                          <div className="animate-slide-down border-t border-gray-100 bg-white">
                             <div className="p-8 space-y-6">
                                {/* dashboard quick-scan view */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   <div className="space-y-2">
                                      <h5 className="font-black text-[9px] uppercase text-gray-400 tracking-widest flex items-center gap-2"><AlertCircle size={12} className="text-red-500"/> Problem</h5>
                                      <p className="text-gray-900 text-xs font-semibold leading-snug line-clamp-2">
                                         {resolveStoryContent(cs.story, 'problem')[0]?.content || resolveStoryContent(cs.story, 'problem')[0]}
                                      </p>
                                   </div>
                                   <div className="space-y-2">
                                      <h5 className="font-black text-[9px] uppercase text-gray-400 tracking-widest flex items-center gap-2"><Target size={12} className="text-indigo-600"/> Method</h5>
                                      <p className="text-gray-600 text-xs font-medium italic leading-snug line-clamp-2">
                                         {resolveStoryContent(cs.story, 'methodology')[0]?.content || resolveStoryContent(cs.story, 'methodology')[0]}
                                      </p>
                                   </div>
                                   <div className="space-y-2">
                                      <h5 className="font-black text-[9px] uppercase text-gray-400 tracking-widest flex items-center gap-2"><Zap size={12} className="text-pink-500"/> Process</h5>
                                      <p className="text-gray-700 text-xs font-medium leading-snug line-clamp-2">
                                         {resolveStoryContent(cs.story, 'process')[0]?.content || resolveStoryContent(cs.story, 'process')[0] || "Rapid prototyping & visual validation."}
                                      </p>
                                   </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                   <h5 className="font-black text-[9px] uppercase text-gray-400 tracking-widest flex items-center gap-2 mb-2"><Search size={12} className="text-amber-500"/> Standout Discovery</h5>
                                   <div className="text-gray-900 bg-indigo-50/30 p-4 rounded-xl border-l-2 border-indigo-600 text-xs font-bold">
                                      "{resolveStoryContent(cs.story, 'findings')[0]?.content || resolveStoryContent(cs.story, 'findings')[0]}"
                                   </div>
                                </div>

                                {cs.source_url && (
                                  <a 
                                    href={cs.source_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors pt-2"
                                  >
                                    Drill into Technical Specs <ExternalLink size={10} />
                                  </a>
                                )}
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section id="saas-lab" className="pt-12 scroll-mt-24">
                {/* Resume-specific ProductLab with first person narrative using shared LavalampBackground */}
                <LavalampBackground className="py-12 border-y-4 border-black">
                  <div className="container mx-auto max-w-6xl px-4">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                      {/* Left: Content Card */}
                      <div className="bg-white/95 backdrop-blur-sm text-left p-8 rounded-2xl border-2 border-gray-100 shadow-xl">
                        <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl mb-2">
                          I Also Build My Services into SaaS Products
                        </h2>
                        <h3 className="text-xl font-bold text-black mb-6">I'm so excited about the launch of my latest tool!</h3>
                        <p className="text-lg text-gray-700 mb-8">
                          See demo of my tool I took from concept to ICL to launch. I productized my proven methodologies and learned all about marketing while launching my research tool for all.
                        </p>
                        <button 
                          onClick={() => setIsDemoModalOpen(true)}
                          className="inline-flex items-center justify-center h-14 px-8 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg transition-all hover:-translate-y-1"
                        >
                          See the demo
                        </button>
                      </div>

                      {/* Right: User Bubble */}
                      <div className="flex justify-center lg:justify-start">
                        <SpeechBubble 
                          imageSrc="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah"
                          name="Sarah"
                          role="Freelancer"
                          quote="Our budget rarely afforded testing with real humans. Now we can use synthesized tests whenever we need them. Instantly!"
                          mood="positive"
                        />
                      </div>
                    </div>
                  </div>
                </LavalampBackground>
              </section>

              {/* Publications & Talks */}
              {assets.some((a: any) => a.type === 'writing_sample' || a.type === 'talk') && (
                <section className="space-y-12">
                  <div className="flex items-center gap-6">
                    <div className="bg-black text-white px-8 py-3 text-3xl font-black uppercase tracking-tighter shadow-xl">
                      Extra! Extra!
                    </div>
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.4em]">Thought Leadership</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-12">
                    {assets.filter((a: any) => a.type === 'writing_sample' || a.type === 'talk').map((item: any, idx: number) => {
                      const extraIdx = 5000 + idx;
                      const hasStory = item.story && Object.keys(item.story).some(k => item.story[k]?.length > 0);

                      return (
                        <div key={idx} className="group rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl relative">
                          <div className="relative min-h-[320px] flex flex-col">
                            <div className="absolute inset-0 z-0 bg-black">
                              {((item.story?.visuals?.find((v: any) => v.is_hero) || item.story?.visuals?.[0])?.url) && (
                                 <>
                                   <img 
                                     src={item.story.visuals.find((v: any) => v.is_hero)?.url || item.story.visuals[0].url} 
                                     className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-[3000ms]" 
                                     alt="" 
                                   />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                 </>
                              )}
                              <div className="absolute top-0 left-0 right-0 h-1.5 bg-marketing-gradient" />
                            </div>

                            <div className="relative z-10 p-10 flex-1 flex flex-col justify-between text-white">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 mb-3 block">{item.company} • {item.type.replace('_', ' ')}</span>
                                <h4 className="text-4xl md:text-5xl font-black leading-[1] mb-6 max-w-2xl tracking-tighter">{item.title}</h4>
                                <p className="text-xl font-medium italic text-gray-200 border-l-4 border-brand-pink pl-6 leading-relaxed line-clamp-2">
                                  {Array.isArray(item.description) 
                                    ? item.description[0] 
                                    : (typeof item.description === 'string' ? item.description : 'Explore the full strategic piece.')}
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-8 pt-8">
                                <div className="flex flex-wrap gap-3">
                                   {item.roi_metrics?.slice(0, 2).map((m: any, mIdx: number) => (
                                     <div key={mIdx} className="bg-[#39ff14] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                       {m}
                                     </div>
                                   ))}
                                </div>
                                
                                <div className="flex gap-4">
                                  {hasStory && (
                                    <NeoButton 
                                      onClick={() => toggleStudy(extraIdx)}
                                      variant={expandedStudies[extraIdx] ? "secondary" : "primary"}
                                      className="h-12 px-8 rounded-full text-xs"
                                    >
                                       {expandedStudies[extraIdx] ? <ChevronUp size={18}/> : <><Search size={18} className="mr-2"/> Explore Story</>}
                                    </NeoButton>
                                  )}
                                  {item.source_url && item.source_url !== 'N/A' && (
                                    <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                                      <NeoButton variant="secondary" className="h-12 px-8 rounded-full text-xs flex items-center gap-2">
                                        {item.type === 'talk' ? 'Watch Reel' : 'Read Piece'} <ExternalLink size={16} />
                                      </NeoButton>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {expandedStudies[extraIdx] && (
                            <div className="animate-slide-down bg-white border-t border-gray-100">
                               <div className="p-10 grid md:grid-cols-2 gap-16">
                                  <div className="space-y-10">
                                     <h5 className="font-black text-xs uppercase text-gray-400 tracking-[0.3em] flex items-center gap-3"><AlertCircle size={16} className="text-red-500"/> The Thesis</h5>
                                     <ul className="space-y-4">
                                        {resolveStoryContent(item.story, 'problem').map((b: any, bIdx: number) => (
                                          <li key={bIdx} className="text-gray-900 leading-snug flex items-start gap-4 font-bold text-lg tracking-tight">
                                             <div className="w-2 h-2 bg-red-500 rounded-full mt-2.5 shrink-0" />
                                             <span>{typeof b === 'object' ? b.content : b}</span>
                                          </li>
                                        ))}
                                     </ul>
                                  </div>
                                  <div className="space-y-10">
                                     <h5 className="font-black text-xs uppercase text-gray-400 tracking-[0.3em] flex items-center gap-3"><Search size={16} className="text-amber-500"/> Core Logic</h5>
                                     <ul className="space-y-4">
                                        {resolveStoryContent(item.story, 'findings').map((b: any, bIdx: number) => (
                                          <li key={bIdx} className="text-gray-900 leading-tight bg-gray-50 p-6 rounded-2xl border-l-4 border-indigo-600 flex items-start gap-4 shadow-sm font-black italic">
                                             <span>"{typeof b === 'object' ? b.content : b}"</span>
                                          </li>
                                        ))}
                                     </ul>
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4 space-y-16">
              {/* Skills & Tooling */}
                <div className="space-y-8 px-[30px]">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.4em]">Expertise Pillars</h3>
                <div className="flex flex-wrap gap-2.5">
                  {assets.filter((a: any) => a.type === 'skill' || a.type === 'tooling').map((item: any, idx: number) => (
                    <span key={idx} className="px-4 py-2 bg-gray-50 text-gray-800 rounded-xl text-xs font-black border border-gray-100 hover:border-indigo-200 transition-colors cursor-default">
                      {item.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {assets.some((a: any) => a.type === 'recommendation') && (
                  <div className="space-y-8 px-[30px]">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.4em]">Validation</h3>
                  <div className="space-y-8">
                    {assets.filter((a: any) => a.type === 'recommendation').map((rec: any, idx: number) => (
                      <div key={idx} className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 relative shadow-md">
                        <p className="text-lg font-bold text-gray-900 italic leading-relaxed mb-6">"{rec.description?.[0]}"</p>
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">— {rec.company}</p>
                        <div className="absolute -bottom-3 -right-3 p-3 bg-white border border-gray-100 rounded-full text-indigo-600 shadow-md"><Info size={20} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversion CTA */}
                <div className="sticky top-28 space-y-8">
                  <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl bg-white">
                  <div className="p-[0.75em]">
                    <SpeechBubble 
                      imageSrc="/jeankaluza.png"
                      name="Jean Kaluza"
                      role={resume.mapped_title}
                      quote={`Can I help your team next? Let's continue the conversation about the ${resume.target_role}.`}
                      mood="positive"
                    />
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noreferrer" className="block">
                      <NeoButton className="w-full bg-marketing-gradient text-white py-5 font-black text-lg h-auto rounded-[1.25rem] border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        Schedule Interview
                      </NeoButton>
                    </a>
                    <NeoButton 
                      variant="secondary" 
                      onClick={() => window.print()}
                      className="w-full py-5 font-black h-auto rounded-[1.25rem] flex items-center justify-center gap-3 bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <Download size={20} /> Get PDF Version
                    </NeoButton>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {isProcessModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in no-print" onClick={() => setIsProcessModalOpen(false)}>
          <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsProcessModalOpen(false)} className="absolute top-8 right-8 p-3 text-gray-400 hover:text-black transition-colors z-10">
              <X size={32} />
            </button>
            <div className="p-10 md:p-16 overflow-y-auto">
              <div className="mb-16">
                <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">This is How We Work</h2>
                <p className="text-indigo-600 font-black uppercase text-xs tracking-[0.3em]">End-to-End Strategic Delivery</p>
              </div>
              <div className="grid md:grid-cols-2 gap-x-16 gap-y-16">
                {[
                  { title: "1. Discovery", icon: <Search size={28}/>, color: "bg-indigo-100 text-indigo-600", text: "Deep dives into user behavior data and competitive analysis to find the logical 'leak' in your funnel." },
                  { title: "2. Strategy", icon: <Target size={28}/>, color: "bg-pink-100 text-brand-pink", text: "Defining functional requirements and strategic hooks that align product vision with immediate user needs." },
                  { title: "3. Execution", icon: <Zap size={28}/>, color: "bg-amber-100 text-amber-600", text: "High-velocity prototyping and Vibe-Coding to test functional proofs in the real world before scale." },
                  { title: "4. Growth", icon: <TrendingUp size={28}/>, color: "bg-green-100 text-green-600", text: "ROI tracking and conversion optimization loops to refine metrics and ensure long-term success." }
                ].map((step, i) => (
                  <div key={i} className="space-y-5">
                    <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center shadow-md`}>
                      {step.icon}
                    </div>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tight">{step.title}</h4>
                    <p className="text-gray-600 leading-relaxed italic font-medium">{step.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-20 pt-10 border-t border-gray-100 flex justify-center">
                <NeoButton onClick={() => setIsProcessModalOpen(false)} variant="primary" className="px-16 h-14 rounded-full text-lg">
                  Got it, Let's Build
                </NeoButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {isCoverLetterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in no-print" onClick={() => setIsCoverLetterOpen(false)}>
          <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsCoverLetterOpen(false)} className="absolute top-8 right-8 p-3 text-gray-400 hover:text-black transition-colors z-10">
              <X size={32} />
            </button>
            <div className="p-10 md:p-16 overflow-y-auto">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Strategic Proposal</h2>
                <p className="text-indigo-600 font-black uppercase text-xs tracking-[0.3em]">{resume.mapped_title}</p>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {resume.cover_letter}
                </p>
                <p className="mt-8 font-black text-black">— Jean Kaluza</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 no-print" onClick={() => setIsVideoOpen(false)}>
          <div className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsVideoOpen(false)} className="absolute top-6 right-6 text-white hover:text-brand-pink z-50 p-2 bg-black/50 rounded-full border border-white/10 transition-colors">
              <X size={28} />
            </button>
            <div className="aspect-video bg-black flex items-center justify-center">
               <iframe className="w-full h-full" src="https://player.vimeo.com/video/203961200?autoplay=1" title="Jean Kaluza Authority" allow="autoplay; encrypted-media" />
            </div>
          </div>
        </div>
      )}

      {/* Demo Modal - Shows the actual interactive demo */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in no-print" onClick={() => setIsDemoModalOpen(false)}>
          <div className="relative w-full max-w-6xl bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsDemoModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black z-50 p-2 bg-white/80 rounded-full border border-gray-200 transition-colors">
              <X size={28} />
            </button>
            <div className="overflow-y-auto p-8 md:p-12">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Try It Now: Free Demo Audit</h2>
                <p className="text-lg text-gray-600">See exactly what your users see. Run a live test on any URL right now.</p>
              </div>
              {/* Embedded DemoSection Component */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <DemoSection />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Million Dollar Win Ticker */}
      <div className="w-full bg-black py-3 overflow-hidden border-t border-white/10 sticky bottom-0 z-50 no-print">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-4">
              {assets.filter((a: any) => a.type === 'win').map((win: any, idx: number) => (
                <span key={idx} className="text-[#39ff14] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={14} /> {win.roi_metrics?.[0] || win.title}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-size: 11pt !important; }
          @page { margin: 0.75in; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PublicResume;
