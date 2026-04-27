import React, { useState, useEffect, useRef } from 'react';
import { Database, Link as LinkIcon, FileText, Video, Send, Loader2, CheckCircle, Trophy, History, MessageSquare, Sparkles, Plus, Trash2, Tag, Upload, Edit3, ExternalLink, X, Check, Eye, Layout, Wand2, FileSearch, Zap, Globe, Copy, Sparkle } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import AdminHeader from '../components/AdminHeader';
import { NeoButton } from '../components/NeoButton';
import { supabase } from '../lib/supabase';

const CareerAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'media' | 'library' | 'builder' | 'published'>('builder');
  const [chatInput, setChatInput] = useState('');
  const [sidekickInput, setSidekickInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Media State
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaLabel, setMediaLabel] = useState('Article');
  const [jdLink, setJdLink] = useState('');

  // Sidebar Chat State
  const [sidekickMessages, setSidekickMessages] = useState<any[]>([
    { sender: 'bot', text: "Ready to assist. Upload a PDF or add a link, and I'll help you refine the results." }
  ]);

  const [results, setResults] = useState<any[]>([]);
  const [publishedResumes, setPublishedResumes] = useState<any[]>([]);
  const [pitchPreview, setPitchPreview] = useState<{
    assets: any[],
    strategicHook: string,
    targetTitle: string,
    mappedTitle: string
  } | null>(null);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // CTO FIX: Fetch existing library assets on mount to prevent "data loss" on refresh
  useEffect(() => {
    const fetchLibrary = async () => {
      const { data, error } = await supabase
        .from('career_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setResults(data);
      }
    };
    fetchLibrary();

    // CTO FIX: Consolidated duplicate declarations to a single instance
    const fetchResumes = async () => {
      const { data } = await supabase.from('career_resumes').select('*').order('created_at', { ascending: false });
      if (data) setPublishedResumes(data);
    };
    fetchResumes();
  }, []);

  const roles = ['Product Management', 'UX Research', 'Design', 'Development', 'Media Buying'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setChatInput(text);
      setLoading(false);
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `File "${file.name}" loaded. Click 'Extract' to let me analyze the strategic points.` }]);
    };
    reader.readAsText(file);
  };

  const handleBulkIngest = async () => {
    setLoading(true);
    const payload = activeTab === 'media' 
      ? { sourceUrl: mediaUrl, label: mediaLabel, assetType: 'media' }
      : { rawData: chatInput, assetType: 'resume' };

    try {
      const res = await fetch('/api/admin/career/ingest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Server error');

      setReviewQueue(prev => [...data.assets, ...prev]);
      setChatInput(''); 
      setMediaUrl('');
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `I found ${data.assets.length} strategic assets in that resume! Review them in the queue below.` }]);
    } catch (e: any) {
      console.error(e);
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const approveAsset = async (index: number) => {
    const asset = reviewQueue[index];
    
    const payload = {
      title: asset.title,
      company: asset.company || null,
      type: asset.type,
      description: asset.description,
      roi_metrics: asset.roi_metrics,
      role_tag: asset.role_tag || null,
      industry: asset.industry || null,
      is_published: !!asset.is_published,
      skills_demonstrated: asset.skills_demonstrated,
      source_url: asset.source_url,
      story: asset.story || null
    };

    const { data, error } = await supabase.from('career_assets').insert([payload]).select().single();
    
    if (error) {
      console.error('❌ Supabase Save Error:', error);
      setSidekickMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `⚠️ Database Error: ${error.message}. Please ensure the 'career_assets' table has columns for: company, role_tag, industry, is_published, and story (JSONB).` 
      }]);
    } else {
      setResults(prev => [data, ...prev]);
      setReviewQueue(prev => prev.filter((_, i) => i !== index));
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `"${asset.title}" approved and saved to database.` }]);
    }
  };

  const discardAsset = (index: number) => {
    setReviewQueue(reviewQueue.filter((_, i) => i !== index));
  };

  const deleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this from your library?")) return;
    try {
      const res = await fetch(`/api/admin/career/assets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setResults(prev => prev.filter(a => a.id !== id));
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: "Asset deleted from the registry." }]);
    } catch (e: any) {
      console.error(e);
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Delete failed: ${e.message}` }]);
    }
  };

  const handlePublishResume = async () => {
    if (!pitchPreview) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/career/publish-resume', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ resumeData: pitchPreview })
      });
      const data = await res.json();
      if (data.success) {
        setPublishedResumes(prev => [data.data, ...prev]);
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: `🚀 RESUME LIVE! Link: ${window.location.origin}${data.url}` }]);
        window.open(data.url, '_blank');
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Publish Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id: string) => {
    if (!window.confirm("Permanently delete this published resume?")) return;
    const { error } = await supabase.from('career_resumes').delete().eq('id', id);
    if (!error) {
      setPublishedResumes(prev => prev.filter(r => r.id !== id));
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: "Bespoke resume removed from live status." }]);
    }
  };

  const handleGeneratePitch = async () => {
    setLoading(true);
    setSidekickMessages(prev => [...prev, { sender: 'user', text: `Building pitch for: ${jdLink}` }]);
    
    try {
      const res = await fetch('/api/admin/career/generate-pitch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ 
          jdUrl: jdLink,
          currentResume: pitchPreview 
        })
      });
      const data = await res.json();
      if (data.success) {
        setPitchPreview(data.data);
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: "Analysis complete! I've selected the 24 assets that best prove your ROI for this role. You can review the page layout below." }]);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Pitch Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSidekickSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sidekickInput.trim()) return;

    const userMsg = sidekickInput;
    setSidekickInput('');
    setSidekickMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/career/sidekick-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ 
          message: userMsg,
          currentResume: pitchPreview
        })
      });
      const data = await res.json();
      if (data.success) {
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
        if (data.suggestedAssets && data.suggestedAssets.length > 0) {
           setReviewQueue(prev => [...data.suggestedAssets, ...prev]);
           setSidekickMessages(prev => [...prev, { sender: 'bot', text: `💡 I've sculpted new strategic points based on User Mirror to fill your gaps. Check the Review Queue!` }]);
        }
      }
    } catch (e: any) {
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Sidekick Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-marketing-gradient rounded-xl shadow-lg">
            <Database className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Career Registry Manager</h1>
            <p className="text-gray-500">Dump your resumes, links, and talk points here. AI will structure them.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button onClick={() => setActiveTab('pdf')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'pdf' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Upload size={16}/> Ingest Resumes</div>
          </button>
          <button onClick={() => setActiveTab('media')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'media' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><LinkIcon size={16}/> Ingest Media</div>
          </button>
          <button onClick={() => setActiveTab('library')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'library' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Database size={16}/> Library</div>
          </button>
          <button onClick={() => setActiveTab('builder')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'builder' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Wand2 size={16}/> The Brag Engine</div>
          </button>
          <button onClick={() => setActiveTab('published')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'published' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Globe size={16}/> Published</div>
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Active Tab Content */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'pdf' && (
              <div className="space-y-6">
                <MarketingCard className="p-8 border-dashed border-4 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" />
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-gray-400 cursor-pointer hover:scale-105 transition-transform" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={32} />
                   </div>
                   <h2 className="text-xl font-bold mb-2">Bulk PDF Ingestion</h2>
                   <p className="text-gray-500 max-w-sm mb-6 text-sm">Upload your 141+ resume variations. I'll deduplicate and extract the strongest ROI points for each role.</p>
                   
                   <div className="w-full space-y-4">
                      <textarea 
                        className="w-full h-24 p-4 bg-white border border-gray-200 rounded-xl text-sm"
                        placeholder="Or paste resume text here..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <NeoButton 
                        onClick={() => handleBulkIngest()} 
                        disabled={loading || !chatInput}
                        className="bg-marketing-gradient text-white px-12"
                      >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2"/>}
                        Extract Strategic Assets
                      </NeoButton>
                   </div>
                </MarketingCard>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6">
              <MarketingCard className="p-8">
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LinkIcon className="text-indigo-600" /> Strategic Media Ingestion</h2>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-black uppercase text-gray-400 mb-1">Source URL</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
                         placeholder="https://dovetailapp.com/blog/..."
                         value={mediaUrl}
                         onChange={(e) => setMediaUrl(e.target.value)}
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-black uppercase text-gray-400 mb-1">Content Type</label>
                       <select 
                         className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
                         value={mediaLabel}
                         onChange={(e) => setMediaLabel(e.target.value)}
                       >
                          <option>Article</option>
                          <option>Video/Talk</option>
                          <option>Case Study</option>
                          <option>Social Content</option>
                          <option>Recommendation</option>
                       </select>
                    </div>
                    <NeoButton 
                      onClick={() => handleBulkIngest()} 
                      disabled={loading || !mediaUrl}
                      className="w-full bg-black text-white py-4 mt-4"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                      Extract Strategic Value
                    </NeoButton>
                 </div>
              </MarketingCard>
              </div>
            )}

            {/* Global Review Queue UI (Shows on PDF and Media Ingestion) */}
            {(activeTab === 'pdf' || activeTab === 'media') && reviewQueue.length > 0 && (
              <div className="space-y-4 animate-fade-in pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                     <FileSearch size={16} /> Extracted - Review & Approve
                  </h3>
                  <button onClick={() => setReviewQueue([])} className="text-[10px] font-bold text-red-500 hover:underline uppercase">Clear Queue</button>
                </div>
                {reviewQueue.map((asset, i) => (
                  <div key={i} className="p-6 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm relative group overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 flex gap-1">
                        <button onClick={() => approveAsset(i)} className="p-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors"><Check size={18} /></button>
                        <button onClick={() => discardAsset(i)} className="p-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"><Trash2 size={18} /></button>
                     </div>
                     <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{asset.type}</span>
                           {asset.is_published && (
                              <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-md flex items-center gap-1">
                                <Trophy size={10}/> Reputable Source
                              </span>
                            )}
                         </div>
                         <h4 className="text-lg font-bold text-gray-900 mt-2">{asset.title}</h4>
                         <p className="text-sm text-gray-400 font-bold">{asset.company || asset.role_tag}</p>
                      </div>

                      {asset.type === 'case_study' && asset.story ? (
                         <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 text-[10px] space-y-3 text-gray-600">
                            {[
                               { label: 'Problem', key: 'problem', color: 'border-indigo-600', text: 'text-indigo-900' },
                               { label: 'Methodology', key: 'methodology', color: 'border-purple-500', text: 'text-purple-900' },
                               { label: 'Process', key: 'process', color: 'border-pink-500', text: 'text-pink-900' },
                               { label: 'Findings', key: 'findings', color: 'border-amber-500', text: 'text-amber-900' },
                               { label: 'Results', key: 'results', color: 'border-green-500', text: 'text-green-900' }
                            ].map((s) => {
                               const content = asset.story[s.key];
                               if (!content) return null;
                               return (
                                 <div key={s.key} className={`border-l-2 ${s.color} pl-3`}>
                                    <p className={`font-black uppercase mb-1 ${s.text}`}>{s.label}</p>
                                    {Array.isArray(content) ? (
                                      <ul className="list-disc pl-4 space-y-0.5">
                                        {content.map((b: any, idx: number) => (
                                          <li key={idx}>{typeof b === 'object' ? (b.content || b.text || JSON.stringify(b)) : b}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="italic leading-relaxed">
                                        {typeof content === 'object' ? (content.content || content.text || JSON.stringify(content)) : content}
                                      </p>
                                    )}
                                 </div>
                               );
                            })}
                            
                            {asset.story.teaser && (
                               <div className="bg-black text-white p-2 rounded mt-2 border border-brand-pink">
                                  <p className="text-[8px] font-black uppercase text-brand-pink mb-0.5">ROI Teaser</p>
                                  <p className="font-bold italic">"{asset.story.teaser}"</p>
                               </div>
                            )}

                            {asset.story.visuals?.length > 0 && (
                              <div className="pt-2 border-t border-gray-200">
                                 <p className="text-[8px] font-black uppercase text-gray-400 mb-2">Artifacts Found</p>
                                 <div className="grid grid-cols-2 gap-2">
                                    {asset.story.visuals.map((v: any, idx: number) => (
                                      <div key={idx} className="bg-white p-2 rounded-lg border border-gray-100 flex flex-col gap-2">
                                         {v.url ? (
                                           <img src={v.url} alt={v.description} className="w-full h-12 object-cover rounded border border-gray-100" />
                                         ) : (
                                           <div className="w-full h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                             {v.type === 'wireframe' ? <Layout size={10} /> : v.type === 'sketch' ? <Edit3 size={10}/> : <FileText size={10} />}
                                           </div>
                                         )}
                                         <span className="truncate leading-none uppercase text-[6px] font-black text-gray-400">{v.description}</span>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                         </div>
                      ) : (
                         <ul className="space-y-2 mb-4">
                            {asset.description?.map((bullet: string, idx: number) => (
                               <li key={idx} className="text-sm text-gray-600 flex items-start gap-2 italic">"{bullet}"</li>
                            ))}
                         </ul>
                      )}

                     {asset.source_url && asset.source_url !== 'direct_upload' && (
                       <div className="mt-2 pt-2 border-t border-gray-50">
                         <a href={asset.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                           <ExternalLink size={10} /> View Original Source
                         </a>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'builder' && (
               <div className="space-y-8 animate-fade-in">
                  <MarketingCard className="p-8 bg-black text-white">
                     <h2 className="text-2xl font-black mb-4 flex items-center gap-2 text-brand-pink"><Wand2 /> The Brag Engine - Resume Builder for Jean Kaluza in 2026</h2>
                     <p className="text-gray-400 mb-6">Paste a Job Description link below. I will orchestrate your best assets to create a tailored, interactive resume for this specific role. This is NOT a pitch, this is your resume.</p>
                     <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={jdLink}
                          onChange={(e) => setJdLink(e.target.value)}
                          className="flex-1 p-4 bg-gray-900 border-2 border-gray-800 rounded-xl focus:border-brand-pink focus:outline-none"
                          placeholder="Paste Job Description URL here..."
                        />
                        <NeoButton onClick={handleGeneratePitch} disabled={loading || !jdLink} className="bg-brand-pink border-brand-pink text-black font-bold">
                           {loading ? <Loader2 className="animate-spin" /> : 'Build My Resume'}
                        </NeoButton>
                     </div>
                  </MarketingCard>

                  {!pitchPreview ? (
                    <div className="p-12 border-4 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
                       <Layout size={48} className="text-gray-300 mb-4" />
                       <h3 className="text-xl font-bold text-gray-400">Interactive Resume Preview</h3>
                       <p className="text-sm text-gray-400 max-w-xs">Your tailored 'Logic Proof' resume will render here once a JD is processed. This is the actual page a hiring manager will see.</p>
                    </div>
                  ) : (
                    <div className="animate-fade-in p-8 bg-white border-2 border-gray-200 rounded-3xl shadow-lg">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                         <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">Resume Structure: {pitchPreview.targetTitle}</h3>
                         <NeoButton onClick={handlePublishResume} className="bg-marketing-gradient text-white text-xs px-4 font-bold">{loading ? <Loader2 className="animate-spin" /> : 'Publish Live Resume'}</NeoButton>
                      </div>

                      {/* Resume Header & Summary */}
                      <div className="mb-8">
                         <h2 className="text-3xl font-black text-gray-900 mb-2">Jean Kaluza</h2>
                         <p className="text-lg text-indigo-600 font-bold mb-4">{pitchPreview.mappedTitle}</p>
                         <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <p className="text-sm font-black uppercase text-gray-400 mb-2 tracking-widest">Professional Summary</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight italic">"{pitchPreview.strategicHook}"</p>
                         </div>
                      </div>

                      {/* Million Dollar Wins Ticker (Placeholder for actual component) */}
                      <div className="mb-8 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex flex-wrap gap-x-6 gap-y-2 items-center shadow-sm">
                         <h4 className="text-sm font-black uppercase text-green-800 flex items-center gap-2"><Trophy size={16} className="text-green-600" /> Million Dollar Wins:</h4>
                         {pitchPreview.assets.filter(a => a.type === 'win').slice(0, 6).map((w, idx) => (
                            <span key={idx} className="text-xs font-black text-green-700 bg-white px-2 py-1 rounded border border-green-100">{w.roi_metrics?.[0] || w.title}</span>
                         ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Column */}
                        <div className="lg:col-span-2 space-y-8">
                          {/* Work History */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Work History</h3>
                            {pitchPreview.assets.filter(a => a.type === 'work_history').map((job, idx) => (
                              <div key={idx} className="mb-6 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <h4 className="text-lg font-bold text-gray-900">{job.title}</h4>
                                <p className="text-sm text-gray-600 mb-2 font-bold">{job.company}</p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                                  {job.description?.map((bullet: string, bIdx: number) => (
                                    <li key={bIdx}>{bullet}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>

                          {/* Case Studies */}
                          {pitchPreview.assets.some(a => a.type === 'case_study') && (
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Case Studies (Logic Proofs)</h3>
                            {pitchPreview.assets.filter(a => a.type === 'case_study').map((cs, idx) => (
                              <div key={idx} className="mb-6 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <h4 className="text-lg font-bold text-gray-900">{cs.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{cs.company}</p>
                                {cs.story?.teaser ? (
                                  <div className="bg-indigo-50 p-3 rounded border border-indigo-100 mb-2">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Key Proof</p>
                                    <p className="text-sm text-indigo-900 font-bold italic">"{cs.story.teaser}"</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-700 italic">{cs.description?.[0]}</p>
                                )}
                                {cs.source_url && (
                                  <a href={cs.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline mt-2">
                                    <ExternalLink size={14} /> View Interactive Proof
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                          )}

                          {/* Writing Samples & Talks */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Publications & Talks</h3>
                            {pitchPreview.assets.filter(a => a.type === 'writing_sample' || a.type === 'talk').map((item, idx) => (
                              <div key={idx} className="mb-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                                <p className="text-sm text-gray-600 mb-2 font-bold">{item.company}</p>
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline mt-1">
                                    <ExternalLink size={14} /> Read/Watch
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sidebar Column */}
                        <div className="lg:col-span-1 space-y-8">
                          {/* Skills */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {pitchPreview.assets.filter(a => a.type === 'skill').map((skill, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-800">{skill.title}</span>
                              ))}
                            </div>
                          </div>

                          {/* Technical Tools */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Technical Tools</h3>
                            <div className="flex flex-wrap gap-2">
                              {pitchPreview.assets.filter(a => a.type === 'tooling').map((tool, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-800">{tool.title}</span>
                              ))}
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Recommendations</h3>
                            {pitchPreview.assets.filter(a => a.type === 'recommendation').map((rec, idx) => (
                              <div key={idx} className="mb-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <p className="text-sm italic text-gray-700 mb-2">"{rec.description?.[0]}"</p>
                                <p className="text-xs font-bold text-gray-500">- {rec.company}</p>
                              </div>
                            ))}
                          </div>

                          {/* Interactive Sections */}
                          <div className="bg-gray-900 p-6 rounded-xl text-white">
                             <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-brand-pink"><Eye size={14} /> Interactive Sections</h4>
                             <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold"><input type="checkbox" defaultChecked /> User Mirror Lab</label>
                                <label className="flex items-center gap-2 text-[10px] font-bold"><input type="checkbox" defaultChecked /> Vibe-Coding Loop</label>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                       <h3 className="font-bold text-gray-900 mb-4">Registry Health</h3>
                       <div className="space-y-3">
                         <div className="flex justify-between text-sm"><span>Work History</span> <span className="font-bold">{results.filter(r => r.type === 'work_history').length}</span></div>
                         <div className="flex justify-between text-sm"><span>Case Studies</span> <span className="font-bold">{results.filter(r => r.type === 'case_study').length}</span></div>
                         <div className="flex justify-between text-sm"><span>Talks/Articles</span> <span className="font-bold">{results.filter(r => r.type === 'talk' || r.type === 'writing_sample').length}</span></div>
                         <div className="flex justify-between text-sm"><span>Floating Wins</span> <span className="font-bold">{results.filter(r => r.type === 'win').length}</span></div>
                       </div>
                    </div>
                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col justify-center">
                       <h3 className="font-bold text-indigo-900 mb-2 text-xs uppercase tracking-widest flex items-center gap-1"><Sparkles size={14}/> Pro Tip</h3>
                       <p className="text-xs text-indigo-700 leading-relaxed">
                         Use the Sidekick chat to ask for specific subsets of your work history (e.g., "Show me my Disney ROI wins").
                       </p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">Extrapolated Results <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{results.length} total</span></h2>
                    {results.length === 0 && (
                       <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400">Your library is currently empty. Start ingesting files or links.</div>
                    )}
                    {results.length > 1 && (
                       <div className="flex justify-end">
                          <button className="text-xs font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                             <CheckCircle size={12} /> Auto-Deduplicate Library
                          </button>
                       </div>
                    )}
                    {results.map((asset, i) => (
                       <div key={i} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                   <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{asset.type}</span>
                                   <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{asset.role_tag}</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">{asset.title}</h4>
                                <p className="text-sm text-gray-500 font-bold mb-4">{asset.company}</p>
                                <ul className="space-y-2 mb-6">
                                   {asset.description?.map((bullet: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-1 flex-shrink-0" /> {bullet}</li>
                                   ))}
                                </ul>
                                {asset.source_url && asset.source_url !== 'direct_upload' && asset.source_url !== 'N/A' && (
                                   <div className="mb-4">
                                      <a href={asset.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-200 underline-offset-4">
                                         <ExternalLink size={14} /> View Full Article
                                      </a>
                                   </div>
                                )}
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-gray-50 rounded-lg" title="Edit coming soon"><Edit3 size={18} className="text-gray-400" /></button>
                                <button onClick={() => deleteAsset(asset.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18} className="text-red-400" /></button>
                             </div>
                          </div>
                          {asset.roi_metrics?.length > 0 && (
                             <div className="pt-4 border-t border-gray-100 flex gap-4">
                                {asset.roi_metrics.map((metric: string, idx: number) => (
                                   <div key={idx} className="flex items-center gap-1 text-xs font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full"><Trophy size={12}/> {metric}</div>
                                ))}
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'published' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><Globe /> Live Resume Vault</h2>
                {publishedResumes.length === 0 ? (
                  <div className="p-12 bg-white border-2 border-dashed border-gray-200 rounded-3xl text-center text-gray-400 font-bold">You haven't published any bespoke resumes yet. Use the Brag Engine to start.</div>
                ) : (
                  <div className="grid gap-4">
                    {publishedResumes.map((res) => (
                      <div key={res.id} className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-black text-gray-900">{res.target_role}</h3>
                            <p className="text-sm text-indigo-600 font-bold mb-4">{res.mapped_title}</p>
                            <div className="flex gap-4">
                              <a 
                                href={`/resume/${res.slug}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs font-black uppercase text-gray-400 hover:text-indigo-600 flex items-center gap-1"
                              >
                                <ExternalLink size={14} /> View Live
                              </a>
                              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/resume/${res.slug}`); alert("Link copied!"); }} className="text-xs font-black uppercase text-gray-400 hover:text-black flex items-center gap-1">
                                <Copy size={14} /> Copy Link
                              </button>
                            </div>
                          </div>
                          <button onClick={() => deleteResume(res.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sidekick Column */}
          <div className="lg:col-span-4 space-y-6">
            <MarketingCard className="p-0 overflow-hidden flex flex-col h-[600px] lg:sticky lg:top-8">
              <div className="p-4 bg-gray-900 text-white flex items-center gap-2">
                <Sparkles size={18} className="text-brand-pink" />
                <span className="font-bold text-xs uppercase tracking-widest">Registry Sidekick</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {sidekickMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-marketing-gradient text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-tl-none'}`}>
                       {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSidekickSend} className="relative">
                  <input 
                    value={sidekickInput}
                    onChange={(e) => setSidekickInput(e.target.value)}
                    className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-pink"
                    placeholder="Ask Sidekick to refine or paste text..."
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </MarketingCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAdmin;