import React, { useState, useEffect, useRef } from 'react';
import { Database, Link as LinkIcon, FileText, Video, Send, Loader2, CheckCircle, Trophy, History, MessageSquare, Sparkles, Plus, Trash2, Tag } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import AdminHeader from '../components/AdminHeader';
import { NeoButton } from '../components/NeoButton';

const CareerAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'media' | 'wins'>('history');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Product Management');
  const [results, setResults] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const roles = ['Product Management', 'UX Research', 'Design', 'Development', 'Media Buying'];

  const handleBulkIngest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/career/ingest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ 
          rawData: chatInput,
          assetType: activeTab,
          role: selectedRole
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults([data.asset, ...results]);
        setChatInput('');
      }
    } catch (e) {
      console.error(e);
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
          <button onClick={() => setActiveTab('history')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'history' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><History size={16}/> Work History</div>
          </button>
          <button onClick={() => setActiveTab('media')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'media' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><LinkIcon size={16}/> Media Vault</div>
          </button>
          <button onClick={() => setActiveTab('wins')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'wins' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Trophy size={16}/> Key Achievements</div>
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Registry Sidekick Chat */}
          <div className="lg:col-span-8 space-y-6">
            <MarketingCard className="p-0 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-pink" />
                  <span className="font-bold text-xs uppercase tracking-tighter">Registry Sidekick</span>
                </div>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-700"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-700 font-medium">
                      "Ready to ingest. You mentioned 140 PDF variations—don't worry about the noise. Paste any text or links here, and I'll extract only the **strongest, unique points** for your **{selectedRole}** profile. I'll automatically de-duplicate against what we've already saved."
                    </p>
                  </div>
                </div>
                {results.map((r, i) => (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] bg-marketing-gradient text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                      <p className="text-xs font-black uppercase mb-1 opacity-80">Processed as {r.type}</p>
                      <p className="text-sm font-bold">{r.title}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={activeTab === 'media' ? "Paste links here..." : "Paste resume text here..."}
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-pink focus:outline-none text-sm min-h-[50px] max-h-[150px]"
                  />
                  <button 
                    onClick={handleBulkIngest}
                    disabled={loading || !chatInput}
                    className="bg-marketing-gradient text-white p-4 rounded-xl shadow-md hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center font-bold uppercase tracking-widest">AI Merit-Extraction Mode Active</p>
              </div>
            </MarketingCard>
          </div>

          {/* Right: Floating Wins & Registry Health */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Floating Wins</h3>
              <div className="space-y-4">
                {results.filter(r => r.type === 'win').length === 0 && (
                   <p className="text-xs text-gray-400 italic">No floating wins extracted yet. Dump achievements to see them here.</p>
                )}
                {/* Map floating wins here */}
              </div>
            </div>
          </div>

          {/* Stats column (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Registry Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>Work History</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between text-sm"><span>Case Studies</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between text-sm"><span>Talks</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between text-sm"><span>Skills</span> <span className="font-bold">0</span></div>
              </div>
            </div>
            
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <h3 className="font-bold text-indigo-900 mb-2 text-xs uppercase tracking-widest">Pro Tip</h3>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Labeling your media links as "Talk" or "Article" manually saves AI credits for the heavy resume lifting. Use the dropdown in the chat to set the context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAdmin;