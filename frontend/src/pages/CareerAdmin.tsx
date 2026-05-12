import React, { useState, useEffect, useRef } from 'react';
import { Database, Link as LinkIcon, FileText, Send, Loader2, Trophy, MessageSquare, Sparkles, Trash2, Upload, ExternalLink, Check, Eye, Layout, Wand2, FileSearch, Zap, Globe, Copy, PenTool, AlertCircle, ListChecks, RefreshCcw } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import AdminHeader from '../components/AdminHeader';
import { NeoButton } from '../components/NeoButton';
import { AssetCard } from '../components/AssetCard';
import { supabase } from '../lib/supabase';

const CareerAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'media' | 'library' | 'builder' | 'published'>('builder');
  const [chatInput, setChatInput] = useState('');
  const [sidekickInput, setSidekickInput] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('all');
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
  const [pitchReasoning, setPitchReasoning] = useState<string>('');
  const [pitchGaps, setPitchGaps] = useState<string[]>([]);

  const [publishedResumes, setPublishedResumes] = useState<any[]>([]);
  const [pitchPreview, setPitchPreview] = useState<{
    assets: any[],
    strategicHook: string,
    targetTitle: string,
    mappedTitle: string,
    coverLetter?: string
  } | null>(null);
  const [previewMode, setPreviewMode] = useState<'resume' | 'cover'>('resume');
  const [documentTypeHint, setDocumentTypeHint] = useState<'auto' | 'resume' | 'cover_letter' | 'linkedin_profile'>('auto'); // New state for document type hint
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filtering logic for the Content Vault
  const filteredResults = results.filter(asset => {
    const searchLower = (librarySearch || '').toLowerCase();
    const matchesSearch = 
      (asset.title?.toLowerCase() || '').includes(searchLower) ||
      (asset.company?.toLowerCase() || '').includes(searchLower) ||
      (Array.isArray(asset.description) && asset.description.some((d: any) => typeof d === 'string' && d.toLowerCase().includes(searchLower)));
    
    const matchesFilter = libraryFilter === 'all' || asset.type === libraryFilter;
    
    return matchesSearch && matchesFilter;
  });

  // CTO Helper: Enable live editing of assets within the review queue before approval
  const updateReviewAsset = (index: number, field: string, value: any) => {
    const updatedQueue = [...reviewQueue];
    const asset = { ...updatedQueue[index] };
    if (field.includes('.')) {
      const [obj, sub] = field.split('.');
      asset[obj] = { ...asset[obj], [sub]: value };
    } else {
      asset[field] = value;
    }
    updatedQueue[index] = asset;
    setReviewQueue(updatedQueue);
  };

  // CTO Helper: Enable live editing of assets within the pitch preview
  const updatePitchAsset = (id: string, field: string, value: any) => {
    if (!pitchPreview) return;
    const updatedAssets = pitchPreview.assets.map(a => {
      if (a.id === id) {
        if (field.includes('.')) {
          const [obj, sub] = field.split('.');
          return { ...a, [obj]: { ...a[obj], [sub]: value } };
        }
        return { ...a, [field]: value };
      }
      return a;
    });
    setPitchPreview({ ...pitchPreview, assets: updatedAssets });
  };

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
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    
    setSelectedFiles(files);
    setSidekickMessages(prev => [...prev, { sender: 'bot', text: `${files.length} file(s) loaded. Select document type and click 'Extract' to analyze.` }]);
  };

  const handleBulkIngest = async () => {
    setLoading(true);
    setSidekickMessages(prev => [...prev, { sender: 'user', text: `Ingesting documents and/or media links.` }]);

    const ingestionItems: { rawData?: string; sourceUrl?: string; documentTypeHint?: 'resume' | 'cover_letter' | 'auto'; label?: string; }[] = [];

    // 1. Process multiple uploaded files
    for (const file of selectedFiles) {
      try {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        ingestionItems.push({ rawData: text, documentTypeHint, label: file.name });
      } catch (err) {
        console.error(`Error reading file ${file.name}:`, err);
      }
    }

    if (chatInput.trim()) {
      ingestionItems.push({ rawData: chatInput, documentTypeHint: documentTypeHint, label: 'Pasted Text' });
    }
    if (mediaUrl.trim()) {
      ingestionItems.push({ sourceUrl: mediaUrl, documentTypeHint: 'auto', label: mediaLabel });
    }

    if (ingestionItems.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/career/ingest', { // Changed to accept array
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ items: ingestionItems }) // Send array of items
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Server error');

      setReviewQueue(prev => [...data.assets, ...prev]);
      setChatInput(''); 
      setMediaUrl('');
      setSelectedFiles([]); // Clear queue after successful ingest
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `I found ${data.assets.length} strategic assets! Review them in the queue below.` }]);
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
        setActiveTab('published'); // Provide immediate feedback by switching tabs
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

  const handleAddAssetToPitch = (asset: any) => {
    if (!pitchPreview) {
      setPitchPreview({
        assets: [asset],
        strategicHook: "Manually curated resume draft.",
        targetTitle: "Bespoke Role",
        mappedTitle: "Product Strategist & Growth Lead",
        coverLetter: "Bespoke cover letter draft."
      });
      return;
    }
    if (pitchPreview.assets.some(a => a.id === asset.id)) return;
    setPitchPreview({ ...pitchPreview, assets: [asset, ...pitchPreview.assets] });
  };

  const handleSyncNarrative = async () => {
    if (!pitchPreview) return;
    setLoading(true);
    setSidekickMessages(prev => [...prev, { sender: 'user', text: "Syncing narrative with my curated selection..." }]);
    
    try {
      const res = await fetch('/api/admin/career/sidekick-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ 
          message: "Please re-sculpt my professional summary and cover letter based ONLY on the assets I have hand-picked for this draft.",
          currentResume: pitchPreview
        })
      });
      const data = await res.json();
      if (data.success && data.updatedResume) {
        setPitchPreview(data.updatedResume);
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: "Narrative synced! I've updated your summary and cover letter to bridge your selected proof points." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidateWorkHistory = async () => {
    if (!window.confirm("This will combine all duplicate work history entries into single 'Master Cards' with unique bullet points. Continue?")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/career/consolidate-work-history', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        }
      });
      const data = await res.json();
      if (data.success) {
        const { data: updatedAssets } = await supabase.from('career_assets').select('*').order('created_at', { ascending: false });
        if (updatedAssets) setResults(updatedAssets);
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: `✨ Library Cleaned! Consolidated ${data.consolidatedCount} duplicate entries into giant work history Master Cards.` }]);
      }
    } catch (e: any) {
      console.error(e);
      setSidekickMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Clean failed: ${e.message}` }]);
    } finally {
      setLoading(false);
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
        setPitchReasoning(data.data.strategicReasoning || '');
        setPitchGaps(data.data.gapAnalysis || []);
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: "Analysis complete! I've exhaustively mapped your assets to every requirement in the JD. Review your curated draft below." }]);
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
        if (data.updatedResume) {
          setPitchPreview(data.updatedResume);
          setSidekickMessages(prev => [...prev, { sender: 'bot', text: `✨ I've recalibrated your resume and cover letter drafts to reflect the '${userMsg}' direction. You can see the live changes in the Brag Engine preview.` }]);
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
      <div className={`container mx-auto px-4 py-12 ${activeTab === 'builder' ? 'max-w-7xl' : 'max-w-5xl'}`}>
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
          <button onClick={() => setActiveTab('media')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'media' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}> {/* Renamed to Ingest Media */}
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
                <MarketingCard className="p-8 border-dashed border-4 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center"> {/* Changed to accept multiple files */}
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" multiple />
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-gray-400 cursor-pointer hover:scale-105 transition-transform" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={32} />
                   </div>
                   <h2 className="text-xl font-bold mb-2">Bulk Document Ingestion</h2> {/* Updated text */}
                   <p className="text-gray-500 max-w-sm mb-6 text-sm">Upload your resumes and cover letters. I'll extract strategic points.</p> {/* Updated text */}
                   
                   <div className="w-full space-y-4">
                      {selectedFiles.length > 0 && ( /* Display selected files */
                        <div className="mb-4 text-left">
                          <p className="text-sm font-bold text-gray-700 mb-2">Selected Files:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {selectedFiles.map((file, index) => (
                              <li key={index}>{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <textarea 
                        className="w-full h-24 p-4 bg-white border border-gray-200 rounded-xl text-sm"
                        placeholder="Or paste resume text here..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <div> {/* New dropdown for document type hint */}
                         <label className="block text-xs font-black uppercase text-gray-400 mb-1">Document Type Hint</label>
                         <select 
                           className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
                           value={documentTypeHint}
                           onChange={(e) => setDocumentTypeHint(e.target.value as 'auto' | 'resume' | 'cover_letter')}
                         >
                            <option value="auto">Auto-detect</option>
                            <option value="linkedin_profile">LinkedIn Profile (Ground Truth)</option>
                            <option value="resume">Resume</option>
                            <option value="cover_letter">Cover Letter</option>
                         </select>
                      </div>
                      <NeoButton 
                        onClick={() => handleBulkIngest()}
                        disabled={loading || (!chatInput && selectedFiles.length === 0 && !mediaUrl.trim())} // Disable if no input
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
                      disabled={loading || (!chatInput && selectedFiles.length === 0 && !mediaUrl.trim())} // Disable if no input
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
                           {asset.type === 'narrative_theme' && ( /* Display for new narrative_theme type */
                              <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-1 rounded-md flex items-center gap-1">
                                <MessageSquare size={10}/> Cover Letter Voice
                              </span>
                            )}
                         </div>
                         <input 
                           className="w-full text-lg font-bold text-gray-900 bg-transparent border-b border-transparent focus:border-indigo-200 focus:ring-0 p-0 mt-2"
                           value={asset.title}
                           onChange={(e) => updateReviewAsset(i, 'title', e.target.value)}
                           placeholder="Asset Title"
                         />
                         <input 
                           className="w-full text-sm text-gray-400 font-bold bg-transparent border-b border-transparent focus:border-indigo-200 focus:ring-0 p-0 mb-4"
                           value={asset.company || ''}
                           onChange={(e) => updateReviewAsset(i, 'company', e.target.value)}
                           placeholder="Company Name"
                         />
                      </div>

                      {asset.type === 'work_history' && asset.is_proposed_new_employer && (
                         <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl animate-fade-in">
                            <p className="text-[10px] font-black text-amber-800 uppercase mb-2 flex items-center gap-2">
                               <AlertCircle size={14}/> Identity Verification Required
                            </p>
                            <p className="text-sm font-bold text-amber-900 mb-3">I found a new potential employer: <span className="underline decoration-amber-400 decoration-2 underline-offset-4">{asset.company}</span>. Did you actually work here?</p>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => updateReviewAsset(i, 'is_proposed_new_employer', false)} 
                                 className="px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm hover:bg-amber-700 transition-all active:scale-95"
                               >
                                 Yes, Verify Employer
                               </button>
                               <button 
                                 onClick={() => {
                                    updateReviewAsset(i, 'type', 'narrative_theme'); // Pivot if not work history
                                    updateReviewAsset(i, 'is_proposed_new_employer', false);
                                 }} 
                                 className="px-4 py-2 bg-white border-2 border-amber-300 text-amber-700 text-[10px] font-black uppercase rounded-lg hover:bg-amber-100 transition-all active:scale-95"
                               >
                                 No, this is a Target/Pitch
                               </button>
                            </div>
                         </div>
                      )}

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
                                         <div className="flex flex-col gap-0.5">
                                            <span className="truncate leading-none uppercase text-[6px] font-black text-gray-400">{v.description}</span>
                                            {v.section_mapping && (
                                              <span className="text-[5px] font-bold text-indigo-500 uppercase">📍 {v.section_mapping}</span>
                                            )}
                                            {v.is_hero && <span className="text-[5px] font-bold text-amber-500 uppercase">🌟 Hero</span>}
                                         </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                         </div>
                      ) : (
                         <textarea 
                           className="w-full text-sm text-gray-600 bg-gray-50/50 p-3 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 mb-4 resize-none italic" 
                           rows={asset.description?.length || 2}
                           value={asset.description?.join('\n')}
                           onChange={(e) => updateReviewAsset(i, 'description', e.target.value.split('\n'))}
                           placeholder="Asset Description (One bullet per line)"
                         />
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
                    <div className="animate-fade-in p-8 bg-white border border-gray-100 rounded-3xl shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                         <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                              onClick={() => setPreviewMode('resume')}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${previewMode === 'resume' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                            >
                              Resume
                            </button>
                            <button 
                              onClick={() => setPreviewMode('cover')}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${previewMode === 'cover' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                            >
                              Cover Letter
                            </button>
                         </div>
                         <NeoButton onClick={handlePublishResume} className="bg-marketing-gradient text-white text-xs px-6 font-bold">{loading ? <Loader2 className="animate-spin" /> : 'Publish Live Resume'}</NeoButton>
                      </div>

                      {previewMode === 'resume' ? (
                        <div className="space-y-8 animate-fade-in">
                           {/* Bespoke Header */}
                           <div className="mb-8">
                              <h2 className="text-3xl font-black text-gray-900 mb-2">Jean Kaluza</h2>
                              <input 
                                type="text"
                                className="w-full text-lg text-indigo-600 font-bold mb-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-200 rounded-lg p-2 outline-none"
                                value={pitchPreview.mappedTitle}
                                onChange={(e) => setPitchPreview({...pitchPreview, mappedTitle: e.target.value})}
                                placeholder="Mapped Role Title..."
                              />
                              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 focus-within:border-indigo-200 transition-all">
                                 <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-[0.2em] flex items-center gap-2">
                                    <PenTool size={12} className="text-indigo-400" /> Bespoke Summary (Editable)
                                 </p>
                                 <textarea 
                                   className="w-full text-xl font-bold text-gray-900 leading-tight italic bg-transparent border-none focus:ring-0 resize-none p-0"
                                   value={pitchPreview.strategicHook}
                                   onChange={(e) => setPitchPreview({...pitchPreview, strategicHook: e.target.value})}
                                   rows={3}
                                 />
                              </div>
                           </div>

                           {/* Million Dollar Wins Ticker */}
                           <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-xl flex flex-wrap gap-x-6 gap-y-2 items-center shadow-sm">
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
                              <div key={idx} className="mb-6 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                                <input 
                                  className="w-full font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 mb-1" 
                                  value={job.title} 
                                  onChange={(e) => updatePitchAsset(job.id, 'title', e.target.value)}
                                />
                                <input 
                                  className="w-full text-xs text-indigo-600 font-bold bg-transparent border-none focus:ring-0 p-0 mb-2 uppercase" 
                                  value={job.company} 
                                  onChange={(e) => updatePitchAsset(job.id, 'company', e.target.value)}
                                />
                                <textarea 
                                  className="w-full text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 resize-none" 
                                  rows={job.description?.length || 2}
                                  value={job.description?.join('\n')}
                                  onChange={(e) => updatePitchAsset(job.id, 'description', e.target.value.split('\n'))}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Case Studies */}
                          {pitchPreview.assets.some(a => a.type === 'case_study') && (
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Case Studies (Logic Proofs)</h3>
                            {pitchPreview.assets.filter(a => a.type === 'case_study').map((cs, idx) => (
                              <div key={idx} className="mb-6 p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl">
                                <input 
                                  className="w-full font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 mb-1" 
                                  value={cs.title} 
                                  onChange={(e) => updatePitchAsset(cs.id, 'title', e.target.value)}
                                />
                                {cs.story?.teaser ? (
                                  <div className="bg-white p-3 rounded-lg border border-indigo-100 mb-2 mt-2">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Key Proof</p>
                                    <textarea 
                                      className="w-full text-sm text-indigo-900 font-bold italic bg-transparent border-none focus:ring-0 p-0 resize-none"
                                      value={cs.story.teaser}
                                      onChange={(e) => updatePitchAsset(cs.id, 'story.teaser', e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-700 italic">{cs.description?.[0]}</p>
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
                                <input 
                                  className="w-full font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 mb-1" 
                                  value={item.title} 
                                  onChange={(e) => updatePitchAsset(item.id, 'title', e.target.value)}
                                />
                                <p className="text-xs text-gray-400 font-bold uppercase">{item.company}</p>
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
                                <input 
                                  key={idx} 
                                  className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700 border-none focus:ring-2 focus:ring-indigo-200 w-24" 
                                  value={skill.title}
                                  onChange={(e) => updatePitchAsset(skill.id, 'title', e.target.value)}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Technical Tools */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Technical Tools</h3>
                            <div className="flex flex-wrap gap-2">
                              {pitchPreview.assets.filter(a => a.type === 'tooling').map((tool, idx) => (
                                <input 
                                  key={idx} 
                                  className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700 border-none focus:ring-2 focus:ring-indigo-200 w-24" 
                                  value={tool.title}
                                  onChange={(e) => updatePitchAsset(tool.id, 'title', e.target.value)}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Recommendations</h3>
                            {pitchPreview.assets.filter(a => a.type === 'recommendation').map((rec, idx) => (
                              <div key={idx} className="mb-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <input 
                                  className="w-full text-sm font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 mb-1" 
                                  value={rec.recommender_name || ''} 
                                  onChange={(e) => updatePitchAsset(rec.id, 'recommender_name', e.target.value)}
                                  placeholder="Recommender Name"
                                />
                                <input 
                                  className="w-full text-xs text-gray-500 font-bold bg-transparent border-none focus:ring-0 p-0 mb-2 uppercase" 
                                  value={rec.recommender_title || ''} 
                                  onChange={(e) => updatePitchAsset(rec.id, 'recommender_title', e.target.value)}
                                  placeholder="Recommender Title"
                                />
                                <textarea 
                                  className="w-full text-xs italic text-gray-700 bg-transparent border-none focus:ring-0 p-0 resize-none mb-1" 
                                  rows={3}
                                  value={rec.description?.[0]}
                                  onChange={(e) => updatePitchAsset(rec.id, 'description', [e.target.value])}
                                  placeholder="Recommendation Quote"
                                />
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
                      ) : (
                        <div className="animate-fade-in space-y-4">
                           <div className="bg-indigo-50/40 p-8 rounded-3xl border border-indigo-50">
                              <p className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-[0.3em] border-b border-indigo-100 pb-2 flex items-center gap-2">
                                 <PenTool size={12} /> Bespoke ROI Cover Letter (Editable)
                              </p>
                              <textarea 
                                className="w-full text-lg font-medium text-gray-700 leading-relaxed bg-transparent border-none focus:ring-0 min-h-[550px] resize-none"
                                value={pitchPreview.coverLetter || ''}
                                onChange={(e) => setPitchPreview({...pitchPreview, coverLetter: e.target.value})}
                                placeholder="Refining the strategy..."
                              />
                           </div>
                        </div>
                      )}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <input 
                      type="text" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)}
                      className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm"
                      placeholder="Search your career history..."
                    />
                    <select 
                      value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value)}
                      className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm font-bold text-sm"
                    >
                      <option value="all">All Assets</option>
                      <option value="work_history">Experience</option>
                      <option value="case_study">Case Studies</option>
                      <option value="win">Logic Proofs</option>
                      <option value="skill">Skills</option>
                    </select>
                    <NeoButton 
                      onClick={handleConsolidateWorkHistory} 
                      variant="secondary"
                      className="h-14 px-6 border-indigo-100 text-indigo-600 font-black whitespace-nowrap"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={18} className="mr-2"/>}
                      Clean Library
                    </NeoButton>
                 </div>

                 <div className="grid md:grid-cols-2 gap-4">
                    {filteredResults.length === 0 && (
                       <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400">Your library is currently empty. Start ingesting files or links.</div>
                    )}
                    {filteredResults.map((asset) => (
                       <AssetCard key={asset.id} asset={asset} mode="library" onAction={(_, id) => id && deleteAsset(id)} />
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
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                              Published {new Date(res.created_at).toLocaleDateString()}
                            </p>
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