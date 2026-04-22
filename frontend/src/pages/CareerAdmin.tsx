import React, { useState, useEffect, useRef } from 'react';
import { Database, Link as LinkIcon, FileText, Video, Send, Loader2, CheckCircle, Trophy, History, MessageSquare, Sparkles, Plus, Trash2, Tag, Upload, Edit3, ExternalLink } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import AdminHeader from '../components/AdminHeader';
import { NeoButton } from '../components/NeoButton';

const CareerAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'media' | 'library'>('pdf');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Media State
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaLabel, setMediaLabel] = useState('Article');

  // Sidebar Chat State
  const [sidekickMessages, setSidekickMessages] = useState<any[]>([
    { sender: 'bot', text: "Ready to assist. Upload a PDF or add a link, and I'll help you refine the results." }
  ]);

  const [results, setResults] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const roles = ['Product Management', 'UX Research', 'Design', 'Development', 'Media Buying'];

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
      if (data.success) {
        setResults([data.asset, ...results]);
        setChatInput(''); setMediaUrl('');
        setSidekickMessages(prev => [...prev, { sender: 'bot', text: `Successfully processed: ${data.asset.title}. I've categorized this as ${data.asset.role_tag}.` }]);
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
          <button onClick={() => setActiveTab('pdf')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'pdf' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Upload size={16}/> PDF Ingestion</div>
          </button>
          <button onClick={() => setActiveTab('media')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'media' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><LinkIcon size={16}/> Media Ingestion</div>
          </button>
          <button onClick={() => setActiveTab('library')} className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'library' ? 'border-b-4 border-brand-pink text-black' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2"><Database size={16}/> Career Library</div>
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Active Tab Content */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'pdf' && (
              <MarketingCard className="p-8 border-dashed border-4 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center min-h-[400px]">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-gray-400">
                    <Upload size={32} />
                 </div>
                 <h2 className="text-xl font-bold mb-2">Resume PDF Ingestion</h2>
                 <p className="text-gray-500 max-w-sm mb-6">Drop your resume versions here. AI will extract unique roles, wins, and deduplicate details automatically.</p>
                 <textarea 
                    className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl mb-4 text-sm"
                    placeholder="[BETA] Paste text from PDF here. (Native PDF parser coming in next build)"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                 />
                 <NeoButton onClick={handleBulkIngest} loading={loading} className="bg-marketing-gradient text-white px-12">Process Resume Version</NeoButton>
              </MarketingCard>
            )}

            {activeTab === 'media' && (
              <MarketingCard className="p-8">
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LinkIcon className="text-indigo-600" /> Media Vault Ingestion</h2>
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
                       </select>
                    </div>
                    <NeoButton onClick={handleBulkIngest} loading={loading} className="w-full bg-black text-white py-4 mt-4">Add to Vault</NeoButton>
                 </div>
              </MarketingCard>
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
                    {results.map((asset, i) => (
                       <div key={i} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                   <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{asset.type}</span>
                                   <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{asset.role_tag}</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">{asset.title}</h4>
                                <p className="text-sm text-gray-500 font-medium mb-4">{asset.company} | {asset.dates}</p>
                                <ul className="space-y-2 mb-6">
                                   {asset.description?.map((bullet: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-1 flex-shrink-0" /> {bullet}</li>
                                   ))}
                                </ul>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-gray-50 rounded-lg"><Edit3 size={18} className="text-gray-400" /></button>
                                <button className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18} className="text-red-400" /></button>
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
                <div className="relative">
                  <input 
                    className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    placeholder="Ask Sidekick to refine..."
                  />
                  <button className="absolute right-2 top-2 p-2 bg-gray-900 text-white rounded-lg"><Send size={16} /></button>
                </div>
              </div>
            </MarketingCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAdmin;