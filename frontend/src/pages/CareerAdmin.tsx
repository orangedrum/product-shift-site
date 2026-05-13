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

  // CTO Diagnostic: Log state to help identify why layout might be missing
  useEffect(() => {
    if (activeTab === 'builder') {
      console.log('🛠️ [DRAFTING ROOM] Rendered', { 
        hasResults: results.length > 0, 
        hasDraft: !!pitchPreview 
      });
    }
  }, [activeTab, results.length, pitchPreview]);

  // Filtering logic for the Content Vault
  const filteredResults = (results || []).filter(asset => {
    if (!asset) return false;

    // LEAD ENGINEER UX FIX: Exclude if already present in the active draft
    if (pitchPreview?.assets.some(a => a.id === asset.id)) return false;

    const searchLower = (librarySearch || '').toLowerCase();
    
    const titleMatch = (asset.title || '').toLowerCase().includes(searchLower);
    const companyMatch = (asset.company || '').toLowerCase().includes(searchLower);
    const descriptionMatch = Array.isArray(asset.description) 
      ? asset.description.some((d: any) => typeof d === 'string' && d.toLowerCase().includes(searchLower))
      : (typeof asset.description === 'string' && asset.description.toLowerCase().includes(searchLower));

    const matchesSearch = titleMatch || companyMatch || descriptionMatch;
    
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
        console.log('📚 [LIBRARY DATA]', data.map(a => ({ title: a.title, descType: typeof a.description, isArray: Array.isArray(a.description) })));
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
    console.log('➕ [DRAFTING ROOM] "Add to Draft" triggered for:', asset.title);
    
    setPitchPreview(prev => {
      if (!prev) {
        console.log('🆕 Initializing new draft with first asset');
        return {
          assets: [asset],
          strategicHook: "Manually curated resume draft.",
          targetTitle: "Bespoke Role",
          mappedTitle: "Product Strategist & Growth Lead",
          coverLetter: "Bespoke cover letter draft."
        };
      }
      if (prev.assets.some(a => a.id === asset.id)) {
        console.warn('⚠️ Asset already exists in draft, skipping.');
        return prev;
      }
      console.log('✅ Appending asset to existing draft. New count:', prev.assets.length + 1);
      return { ...prev, assets: [asset, ...prev.assets] };
    });
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
      <div className={`container mx-auto px-4 py-12 transition-all duration-500 ${activeTab === 'builder' ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
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

        <div className={`grid gap-8 ${activeTab === 'builder' ? 'grid-cols-1' : 'lg:grid-cols-12'}`}>
          {/* Left: Active Tab Content */}
          <div className={`${activeTab === 'builder' ? '' : 'lg:col-span-8'} space-y-6`}>
            {(activeTab === 'pdf' || activeTab === 'media' || activeTab === 'library' || activeTab === 'published') && (
              <div className="space-y-6">
                {activeTab === 'pdf' && (
                  <MarketingCard className="p-8 border-dashed border-4 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center">
                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" multiple />
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-gray-400 cursor-pointer hover:scale-105 transition-transform" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={32} />
                     </div>
                     <h2 className="text-xl font-bold mb-2">Bulk Document Ingestion</h2>
                     <p className="text-gray-500 max-w-sm mb-6 text-sm">Upload your resumes and cover letters. I'll extract strategic points.</p>
                     <div className="w-full space-y-4">
                        {selectedFiles.length > 0 && (
                          <div className="mb-4 text-left">
                            <p className="text-sm font-bold text-gray-700 mb-2">Selected Files:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {selectedFiles.map((file, index) => <li key={index}>{file.name}</li>)}
                            </ul>
                          </div>
                        )}
                        <textarea className="w-full h-24 p-4 bg-white border border-gray-200 rounded-xl text-sm" placeholder="Or paste resume text here..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                        <div>
                           <label className="block text-xs font-black uppercase text-gray-400 mb-1">Document Type Hint</label>
                           <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl" value={documentTypeHint} onChange={(e) => setDocumentTypeHint(e.target.value as any)}>
                              <option value="auto">Auto-detect</option>
                              <option value="linkedin_profile">LinkedIn Profile (Ground Truth)</option>
                              <option value="resume">Resume</option>
                              <option value="cover_letter">Cover Letter</option>
                           </select>
                        </div>
                        <NeoButton onClick={handleBulkIngest} disabled={loading} className="bg-marketing-gradient text-white px-12">Extract Strategic Assets</NeoButton>
                      </div>
                  </MarketingCard>
                )}

                {activeTab === 'media' && (
                  <MarketingCard className="p-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LinkIcon className="text-indigo-600" /> Strategic Media Ingestion</h2>
                    <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-black uppercase text-gray-400 mb-1">Source URL</label>
                         <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl" placeholder="https://dovetailapp.com/blog/..." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
                      </div>
                      <NeoButton onClick={handleBulkIngest} disabled={loading} className="w-full bg-black text-white py-4 mt-4">Extract Strategic Value</NeoButton>
                    </div>
                  </MarketingCard>
                )}

                {activeTab === 'library' && (
                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <input type="text" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm" placeholder="Search history..." />
                   <select 
                      value={libraryFilter} 
                      onChange={(e) => setLibraryFilter(e.target.value)}
                      className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm font-bold text-sm outline-none focus:border-brand-pink"
                   >
                      <option value="all">All Assets</option>
                      <option value="work_history">Experience</option>
                      <option value="case_study">Case Studies</option>
                      <option value="win">Logic Proofs</option>
                      <option value="skill">Skills</option>
                      <option value="talk">Talks</option>
                      <option value="writing_sample">Writing</option>
                      <option value="recommendation">Recommendations</option>
                      <option value="narrative_theme">Themes</option>
                   </select>
                        <NeoButton onClick={handleConsolidateWorkHistory} variant="secondary" className="h-14 px-6 font-black" disabled={loading}>
                           {loading ? <Loader2 className="animate-spin" /> : 'Clean Library'}
                        </NeoButton>
                     </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        {filteredResults.map((asset) => <AssetCard key={asset.id} asset={asset} mode="library" onAction={(_, id) => id && deleteAsset(id)} />)}
                     </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'builder' && (
              <div className="grid lg:grid-cols-12 gap-8 items-start animate-fade-in">
                <div className="lg:col-span-7 space-y-6">
                  <MarketingCard className="p-8 bg-black text-white">
                     <h2 className="text-2xl font-black mb-4 flex items-center gap-2 text-brand-pink"><Wand2 /> The Brag Engine</h2>
                     <div className="flex gap-3">
                        <input type="text" value={jdLink} onChange={(e) => setJdLink(e.target.value)} className="flex-1 p-4 bg-gray-900 border-2 border-gray-800 rounded-xl focus:border-brand-pink outline-none" placeholder="Paste JD URL..." />
                        <NeoButton onClick={handleGeneratePitch} disabled={loading} className="bg-brand-pink text-black font-bold">
                           {loading ? <Loader2 className="animate-spin" /> : 'Consult Sidekick'}
                        </NeoButton>
                     </div>
                  </MarketingCard>

                  {!pitchPreview ? (
                    <div className="p-24 border-2 border-dashed border-gray-200 rounded-3xl text-center opacity-40 bg-white">
                      <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-bold">Your Draft is Empty</h3>
                      <p className="text-sm">Enter a JD link or add assets from the Vault on the right.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                         {pitchReasoning && (
                           <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                             <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-2 flex items-center gap-1"><Sparkles size={12}/> Consultant Logic</h4>
                             <p className="text-xs text-indigo-900 italic">"{pitchReasoning}"</p>
                           </div>
                         )}
                         {pitchGaps.length > 0 && (
                           <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
                             <h4 className="text-[10px] font-black uppercase text-amber-600 mb-2 flex items-center gap-1"><ListChecks size={12}/> Logic Gaps</h4>
                             <ul className="space-y-1">
                                {pitchGaps.slice(0, 3).map((gap, i) => (
                                  <li key={i} className="text-[10px] text-amber-900 font-bold flex items-start gap-1"><AlertCircle size={10} className="mt-0.5"/> {gap}</li>
                                ))}
                             </ul>
                           </div>
                         )}
                      </div>
                      <div className="flex justify-between items-center mb-8">
                         <div className="flex bg-gray-100 p-1 rounded-xl">
                            {['resume', 'cover'].map((m) => (
                              <button key={m} onClick={() => setPreviewMode(m as any)} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${previewMode === m ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>{m}</button>
                            ))}
                         </div>
                         <div className="flex gap-2">
                           <button onClick={handleSyncNarrative} disabled={loading} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-indigo-600 transition-all">
                              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                           </button>
                           <NeoButton onClick={handlePublishResume} disabled={loading} className="bg-marketing-gradient text-white text-xs px-6 font-bold">
                              {loading ? <Loader2 className="animate-spin" /> : 'Publish Live'}
                           </NeoButton>
                         </div>
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
                               onChange={(e) => setPitchPreview(prev => prev ? ({...prev, mappedTitle: e.target.value}) : null)}
                               placeholder="Mapped Role Title..."
                             />
                             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 focus-within:border-indigo-200 transition-all">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-[0.2em] flex items-center gap-2">
                                   <PenTool size={12} className="text-indigo-400" /> Professional Summary (Editable)
                                </p>
                                <textarea 
                                  className="w-full text-xl font-bold text-gray-900 leading-tight italic bg-transparent border-none focus:ring-0 resize-none p-0"
                                  value={pitchPreview.strategicHook}
                                  onChange={(e) => setPitchPreview(prev => prev ? ({...prev, strategicHook: e.target.value}) : null)}
                                  rows={2}
                                />
                             </div>
                          </div>

                          {/* Grouped Draft Sections */}
                          {[
                            { type: 'work_history', label: 'Professional Experience' },
                            { type: 'case_study', label: 'Logic Proofs: Case Studies' },
                            { type: 'win', label: 'ROI & Major Wins' },
                            { type: 'recommendation', label: 'Validation / Testimonials' },
                            { type: 'skill', label: 'Expertise Pillars' },
                            { type: 'tooling', label: 'Technical Stack' }
                          ].map(section => {
                            const sectionAssets = pitchPreview.assets.filter(a => a.type === section.type);
                            if (sectionAssets.length === 0) return null;
                            
                            return (
                              <div key={section.type} className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
                                  {section.label} <span className="bg-gray-100 text-gray-500 px-1.5 rounded-md">{sectionAssets.length}</span>
                                </h3>
                                <div className="space-y-3">
                                  {sectionAssets.map(asset => (
                                    <AssetCard 
                                      key={asset.id} 
                                      asset={asset} 
                                      mode="draft" 
                                      onUpdate={updatePitchAsset}
                                      onAction={() => setPitchPreview(prev => prev ? ({...prev, assets: prev.assets.filter(a => a.id !== asset.id)}) : null)} 
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fade-in">
                          <div className="bg-indigo-50/50 p-6 rounded-2xl border-2 border-dashed border-indigo-100">
                            <p className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                               <FileText size={12} className="text-indigo-400" /> ROI Cover Letter (Editable)
                            </p>
                            <textarea
                              className="w-full min-h-[600px] bg-transparent font-medium text-gray-700 leading-relaxed outline-none resize-none"
                              value={pitchPreview.coverLetter || ''}
                              onChange={(e) => setPitchPreview(prev => prev ? ({ ...prev, coverLetter: e.target.value }) : null)}
                              placeholder="Sidekick is generating your cover letter strategy..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 space-y-6 sticky top-8">
                  <div className="p-6 bg-gray-900 rounded-3xl shadow-xl h-[800px] flex flex-col">
                    <h3 className="text-white font-black uppercase text-xs mb-4 flex items-center gap-2"><Database size={14} className="text-brand-pink" /> Content Vault</h3>
                    <input type="text" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} className="w-full p-3 bg-gray-800 border-none rounded-xl text-white text-sm mb-4" placeholder="Search Vault..." />
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {filteredResults.map((asset) => <AssetCard key={asset.id} asset={asset} mode="vault" onAction={() => handleAddAssetToPitch(asset)} />)}
                    </div>
                  </div>
                  <MarketingCard className="p-0 overflow-hidden flex flex-col h-[300px]"><SidekickComponent sidekickInput={sidekickInput} setSidekickInput={setSidekickInput} sidekickMessages={sidekickMessages} handleSidekickSend={handleSidekickSend} loading={loading} chatEndRef={chatEndRef} /></MarketingCard>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Global Sidekick (Hidden in Builder mode as it moves into the internal split) */}
          {activeTab !== 'builder' && (
            <div className="lg:col-span-4 space-y-6">
              <MarketingCard className="p-0 overflow-hidden flex flex-col h-[600px] lg:sticky lg:top-8">
                <SidekickComponent sidekickInput={sidekickInput} setSidekickInput={setSidekickInput} sidekickMessages={sidekickMessages} handleSidekickSend={handleSidekickSend} loading={loading} chatEndRef={chatEndRef} />
              </MarketingCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SidekickComponent: React.FC<any> = ({ sidekickInput, setSidekickInput, sidekickMessages, handleSidekickSend, loading, chatEndRef }) => (
  <>
    <div className="p-4 bg-gray-900 text-white flex items-center gap-2">
      <Sparkles size={18} className="text-brand-pink" />
      <span className="font-bold text-xs uppercase tracking-widest">Registry Sidekick</span>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
      {sidekickMessages.map((msg: any, idx: number) => (
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
        <input value={sidekickInput} onChange={(e) => setSidekickInput(e.target.value)} className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-pink" placeholder="Ask Sidekick..." />
        <button type="submit" disabled={loading} className="absolute right-2 top-2 p-2 bg-gray-900 text-white rounded-lg transition-colors disabled:opacity-50">
           {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  </>
);

export default CareerAdmin;