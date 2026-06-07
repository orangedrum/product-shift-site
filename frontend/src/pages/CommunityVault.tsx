import React, { useState, useEffect, useRef } from 'react';
import { Database, Upload, MessageCircle, FileText, Loader2, Sparkles, Plus, AlertCircle, Link as LinkIcon, Trash2, Check, X, FileSearch } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { AssetCard } from '../components/AssetCard';
import { supabase } from '../lib/supabase';

/**
 * The Community Vault (Ingestion Hub)
 * Step 3 of the Community Analyzer Roadmap.
 */
const CommunityVault: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pastedNotes, setPastedNotes] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('');
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Experiments for the selector
      const { data: exp } = await supabase.from('experiments').select('id, title').order('created_at', { ascending: false });
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
    setLoading(true);
    const ingestionItems: any[] = [];

    // 1. Process files (WhatsApp, Transcripts)
    for (const file of selectedFiles) {
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(e.target?.result as string);
        reader.readAsText(file);
      });
      ingestionItems.push({ rawData: text, label: file.name, documentTypeHint: file.name.endsWith('.txt') ? 'whatsapp' : 'transcript' });
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
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      if (data.success) {
        setReviewQueue(prev => [...data.assets, ...prev]);
        setPastedNotes('');
        setMediaUrl('');
        setSelectedFiles([]);
      }
    } catch (e) {
      console.error('Shredding failed', e);
    } finally {
      setLoading(false);
    }
  };

  const approveInsight = async (index: number) => {
    const asset = reviewQueue[index];
    setLibrary(prev => [asset, ...prev]);
    setReviewQueue(prev => prev.filter((_, i) => i !== index));
  };

  const deleteLibraryAsset = async (id: string) => {
    if (!window.confirm("Permanently remove this insight?")) return;
    const { error } = await supabase.from('community_assets').delete().eq('id', id);
    if (!error) setLibrary(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            {/* Multi-Source Shredder Form */}
            <NeoCard title="Shredder Console">
              <div className="space-y-6">
                {/* Link to Experiment */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Link to Experiment (Optional)</label>
                  <select 
                    value={selectedExperimentId}
                    onChange={(e) => setSelectedExperimentId(e.target.value)}
                    className="w-full p-3 border-2 border-black rounded-xl bg-white font-bold text-sm focus:shadow-[2px_2px_0px_0px_#000] outline-none transition-all"
                  >
                    <option value="">General Community Dump</option>
                    {experiments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
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
                    <AssetCard key={idx} asset={asset} mode="review" onAction={() => approveInsight(idx)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase"><Database/> Vault Library</h3>
            <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
              {library.map((asset) => (
                <AssetCard key={asset.id} asset={asset} mode="library" onAction={() => deleteLibraryAsset(asset.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityVault;