import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Upload, MessageCircle, FileText, Loader2, Sparkles, Plus, AlertCircle, Link as LinkIcon, Trash2, Check, X, FileSearch, Target, Zap as ZapIcon, Coins } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { AssetCard } from '../components/AssetCard';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';

/**
 * The Community Vault (Ingestion Hub)
 * Step 3 of the Community Analyzer Roadmap.
 */
const CommunityVault: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pastedNotes, setPastedNotes] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('');
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Experiment Creator State
  const [showCreator, setShowCreator] = useState(false);
  const [newExp, setNewExp] = useState({
    title: '',
    hypothesis: '',
    objective: '',
    funding_goal: 1000
  });

  // Standardized Product Style Background
  useEffect(() => {
    const container = containerRef.current;
    const updateGradient = () => {
      if (container) {
        const r = () => Math.floor(Math.random() * 100);
        container.style.setProperty('--pos-x-1', `${r()}%`);
        container.style.setProperty('--pos-y-1', `${r()}%`);
        container.style.setProperty('--pos-x-2', `${r()}%`);
        container.style.setProperty('--pos-y-2', `${r()}%`);
        container.style.setProperty('--pos-x-3', `${r()}%`);
        container.style.setProperty('--pos-y-3', `${r()}%`);
      }
    };

    updateGradient();
    const interval = setInterval(updateGradient, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('🏗️ [CommunityVault] Mounted. Ready for ingestion.');
    const fetchData = async () => {
      // Capture the auth session so this product page renders the logged-in (UserMirror) Header
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // Fetch Experiments for the selector
      const { data: exp, error: expError } = await supabase.from('experiments').select('id, title').order('created_at', { ascending: false });
      if (exp) setExperiments(exp);

      // Fetch Library Assets
      const { data: assets } = await supabase.from('community_assets').select('*').order('created_at', { ascending: false });
      if (assets) setLibrary(assets);
    };
    fetchData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
  };

  const handleShred = async () => {
    console.group('🚀 [SHREDDER TRIGGERED]');
    console.log('Initial State:', { files: selectedFiles.length, notes: pastedNotes.length, url: mediaUrl.length });
    
    setLoading(true);
    const ingestionItems: any[] = [];

    // 1. Process files (WhatsApp, Transcripts)
    try {
      for (const file of selectedFiles) {
        console.log(`📄 Reading file: ${file.name}...`);
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string); 
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsText(file);
        });
        console.log(`✅ Read success: ${file.name} (${text.length} chars)`);
        ingestionItems.push({ rawData: text, label: file.name, documentTypeHint: file.name.endsWith('.txt') ? 'whatsapp' : 'transcript' });
      }
    } catch (readErr: any) {
      console.error('❌ File Reading Error:', readErr);
      alert(readErr.message);
      setLoading(false);
      console.groupEnd();
      return;
    }

    // 2. Process manual observations
    if (pastedNotes.trim()) {
      ingestionItems.push({ rawData: pastedNotes, label: 'Manual Observation', documentTypeHint: 'observation' });
    }

    // 3. Process URL
    if (mediaUrl.trim()) {
      ingestionItems.push({ sourceUrl: mediaUrl, label: 'Social Import', documentTypeHint: 'social_media' });
    }

    if (ingestionItems.length === 0) {
      console.warn('⚠️ No items to ingest.');
      setLoading(false);
      console.groupEnd();
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Your session has expired. Please sign in again to use the Vault.");
        navigate('/login');
        return;
      }

      const res = await fetch('/api/community/ingest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          items: ingestionItems, 
          experimentId: selectedExperimentId 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Shredding failed');
      }

      if (data.success && data.assets && data.assets.length > 0) {
        setReviewQueue(prev => [...data.assets, ...prev]);
        setPastedNotes('');
        console.log('✅ Shredding complete. Assets found:', data.assets.length);
        setMediaUrl('');
        setSelectedFiles([]);
      } else {
        alert("The AI shredded the data but found 0 atomic insights. Try providing a larger sample or check the format.");
      }
    } catch (e: any) {
      console.error('Shredding failed', e);
      alert(`Error: ${e.message}`);
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  };

  // Inline-edit a freshly shredded insight before it is approved into the Library.
  // The card edits `description`; community insights persist that text in `content`.
  const updateReviewItem = (index: number, field: string, value: any) => {
    setReviewQueue(prev => prev.map((a, i) => {
      if (i !== index) return a;
      if (field === 'description') {
        return { ...a, content: Array.isArray(value) ? value.join('\n') : value };
      }
      return { ...a, [field]: value };
    }));
  };

  // Approve: persist the (optionally edited) insight to the user's Vault Library.
  const approveInsight = async (index: number) => {
    const asset = reviewQueue[index];
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/community/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(asset)
      });
      const data = await res.json();
      if (data.success && data.asset) {
        setLibrary(prev => [data.asset, ...prev]);
        setReviewQueue(prev => prev.filter((_, i) => i !== index));
      } else {
        alert(data.error || 'Failed to save insight');
      }
    } catch (e: any) {
      console.error('Approve failed', e);
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit a library insight in place and persist the change.
  const updateLibraryAsset = async (id: string, field: string, value: any) => {
    const payload = field === 'description'
      ? { content: Array.isArray(value) ? value.join('\n') : value }
      : { [field]: value };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/community/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.asset) setLibrary(prev => prev.map(a => a.id === id ? data.asset : a));
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const deleteLibraryAsset = async (id: string) => {
    if (!window.confirm("Permanently remove this insight?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/community/assets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) setLibrary(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/community/publish-experiment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ experimentData: {
          ...newExp,
          status: 'active',
          budget_breakdown: [{ category: 'Operations', amount: newExp.funding_goal }]
        }})
      });

      const data = await res.json();
      if (data.success) {
        setExperiments(prev => [data.data, ...prev]);
        setSelectedExperimentId(data.data.id);
        setShowCreator(false);
        setNewExp({ title: '', hypothesis: '', objective: '', funding_goal: 1000 });
      }
    } catch (err) {
      console.error('Failed to create experiment', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(1750px circle at 100% 0%, #ff1493 0%, #ff1493 40%, #ff0000 60%, transparent 80%),
          radial-gradient(at var(--pos-x-1, 50%) var(--pos-y-1, 50%), #ff8c00 0%, transparent 50%),
          radial-gradient(at var(--pos-x-2, 20%) var(--pos-y-2, 80%), #ff1493 0%, transparent 50%),
          radial-gradient(at var(--pos-x-3, 80%) var(--pos-y-3, 20%), #ff0000 0%, transparent 50%),
          #ffffff
        `,
        backgroundSize: '100% 100%',
        transition: '--pos-x-1 3s ease, --pos-y-1 3s ease, --pos-x-2 3s ease, --pos-y-2 3s ease, --pos-x-3 3s ease, --pos-y-3 3s ease'
      }}
    >
      {/* Logged-in (UserMirror / neo-brutalist) Header for this product page */}
      <Header session={session || { user: { email: '' } }} />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-black rounded-xl shadow-lg">
            <Database className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900">Community Vault</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Multi-Source Shredder</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Experiment Quick-Creator (Modular Addition) */}
            {showCreator ? (
              <NeoCard title="Launch New Experiment">
                <form onSubmit={handleCreateExperiment} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Experiment Title</label>
                      <input required type="text" className="w-full p-3 border-2 border-black rounded-xl" placeholder="e.g. Tango Workshop Series" value={newExp.title} onChange={e => setNewExp({...newExp, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Funding Goal ($)</label>
                      <input required type="number" className="w-full p-3 border-2 border-black rounded-xl" value={newExp.funding_goal} onChange={e => setNewExp({...newExp, funding_goal: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Hypothesis</label>
                    <textarea required className="w-full p-3 border-2 border-black rounded-xl h-20" placeholder="What are you trying to prove?" value={newExp.hypothesis} onChange={e => setNewExp({...newExp, hypothesis: e.target.value})} />
                  </div>
                  <div className="flex gap-3">
                    <NeoButton type="submit" variant="tertiary" disabled={loading} className="flex-1">
                      {loading ? <Loader2 className="animate-spin" /> : 'Launch Project'}
                    </NeoButton>
                    <NeoButton type="button" variant="secondary" onClick={() => setShowCreator(false)}>Cancel</NeoButton>
                  </div>
                </form>
              </NeoCard>
            ) : null}

            {/* Multi-Source Shredder Form */}
            <NeoCard title="Shredder Console">
              <div className="space-y-6">
                {/* Link to Experiment */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Link to Experiment (Optional)</label>
                    {!showCreator && (
                      <button 
                        onClick={() => setShowCreator(true)}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1"
                      >
                        <Plus size={12}/> New Experiment
                      </button>
                    )}
                  </div>
                  {experiments.length > 0 ? (
                    <select 
                      value={selectedExperimentId}
                      onChange={(e) => setSelectedExperimentId(e.target.value)}
                      className="w-full p-3 border-2 border-black rounded-xl bg-white font-bold text-sm focus:shadow-[2px_2px_0px_0px_#000] outline-none transition-all"
                    >
                      <option value="">-- No Experiment Selected (General Vault) --</option>
                      {experiments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  ) : (
                    <div className="w-full p-3 border-2 border-black border-dashed rounded-xl bg-gray-50 text-gray-400 font-bold text-sm italic">
                      General Community Vault (Default)
                    </div>
                  )}
                  {experiments.length === 0 && (
                    <p className="text-[9px] text-gray-400 mt-2 font-medium uppercase tracking-tighter italic">Create experiments to pin data here.</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Text Imports (.txt, .vtt)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-32 border-4 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group"
                    >
                      <Upload className="text-gray-300 group-hover:text-black mb-2" size={32} />
                      <p className="text-xs font-black text-gray-400 group-hover:text-black uppercase">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drop WhatsApp/Otter files'}
                      </p>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".txt,.md,.vtt,.srt" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Social Media URL</label>
                    <div className="relative h-32 flex items-center">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                      <input 
                        type="text" 
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="Paste LinkedIn post URL..." 
                        className="w-full h-full pl-12 p-3 border-2 border-black rounded-2xl text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Manual Observation Notes</label>
                  <textarea 
                    value={pastedNotes}
                    onChange={(e) => setPastedNotes(e.target.value)}
                    className="w-full h-32 p-4 border-2 border-black rounded-2xl text-sm font-medium focus:shadow-[4px_4px_0px_0px_#000] outline-none transition-all"
                    placeholder="Describe specific triggers or objections observed in real life..."
                  />
                </div>

                <NeoButton onClick={handleShred} disabled={loading} className="w-full py-4 text-lg bg-marketing-gradient text-white border-none shadow-[4px_4px_0px_0px_#000]">
                  {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={20}/> Extract Community Intelligence</>}
                </NeoButton>
              </div>
            </NeoCard>

            {/* New Insights Review Queue */}
            {reviewQueue.length > 0 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase"><Sparkles className="text-indigo-600"/> Fresh Shredded Intelligence ({reviewQueue.length})</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {reviewQueue.map((asset, idx) => (
                    <AssetCard
                      key={idx}
                      asset={{ ...asset, description: asset.content }}
                      mode="review"
                      onAction={(action) => {
                        if (action === 'approve') approveInsight(idx);
                        else if (action === 'discard') setReviewQueue(prev => prev.filter((_, i) => i !== idx));
                      }}
                      onUpdate={(_id, field, value) => updateReviewItem(idx, field, value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase"><Database/> Vault Library</h3>
            <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
              {library.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={{ ...asset, description: asset.content }}
                  mode="library"
                  onAction={(_action, id) => id && deleteLibraryAsset(id)}
                  onUpdate={updateLibraryAsset}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityVault;