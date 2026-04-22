import React, { useState } from 'react';
import { Database, Link as LinkIcon, FileText, Video, Send, Loader2, CheckCircle } from 'lucide-react';
import { MarketingCard } from '../components/MarketingCard';
import AdminHeader from '../components/AdminHeader';
import { NeoButton } from '../components/NeoButton';

const CareerAdmin: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleBulkIngest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/career/ingest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('productShiftAdminKey')}` 
        },
        body: JSON.stringify({ rawData: input })
      });
      const data = await res.json();
      if (data.success) {
        setResults([data.asset, ...results]);
        setInput('');
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Input "Dump" */}
          <div className="lg:col-span-2 space-y-6">
            <MarketingCard className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">
                Bulk Ingest Source (Text or Links)
              </label>
              <textarea 
                className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-pink focus:outline-none bg-gray-50/50"
                placeholder="Paste resume text, Vimeo links, or Dovetail article URLs here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <NeoButton 
                  onClick={handleBulkIngest} 
                  disabled={loading || !input}
                  className="bg-marketing-gradient border-none text-white px-8"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-2" /> Process Career Data</>}
                </NeoButton>
              </div>
            </MarketingCard>

            {/* Results Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" /> Recently Structured Assets
              </h3>
              {results.map((asset, i) => (
                <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{asset.type}</span>
                      <h4 className="font-bold text-gray-900 mt-2">{asset.title}</h4>
                      <p className="text-sm text-gray-500">{asset.company}</p>
                    </div>
                    {asset.roi_metrics?.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Impact</p>
                        <p className="text-lg font-black text-green-600">{asset.roi_metrics[0]}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Asset Distribution */}
          <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Registry Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>Experiences</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between text-sm"><span>Case Studies</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between text-sm"><span>Talks</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between text-sm"><span>Skills</span> <span className="font-bold">0</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAdmin;