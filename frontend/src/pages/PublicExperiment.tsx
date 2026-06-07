import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, TrendingUp, Users, Target, MessageSquare, Zap, Info, Loader2, Calendar, Layout, ArrowRight, CheckCircle } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { SEOMetadata } from '../components/SEOMetadata';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * The Pilot Dashboard (Kickstarter View)
 * Step 4: Refactored from PublicResume.tsx for Science & Proof.
 */
const PublicExperiment: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'discussion'>('overview');
  const [experiment, setExperiment] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      const res = await fetch(`/api/public/experiment/${slug}`);
      const data = await res.json();
      if (data.success) {
        setExperiment(data.experiment);
        setSessions(data.sessions);
        setDiscussions(data.discussions);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const handlePledge = async () => {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId: experiment.id, pledgeAmount: 2500 }) // $25 default pledge
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  if (!experiment) return <div className="p-20 text-center font-black">Experiment Not Found</div>;

  const progress = Math.min(100, (experiment.amount_pledged / experiment.funding_goal) * 100);
  const COLORS = ['#4f46e5', '#ff1493', '#00bfff', '#39ff14', '#ff8c00'];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <SEOMetadata title={`${experiment.title} - Pilot Progress`} description={experiment.objective} />
      
      {/* Hero: Kickstarter Treatment */}
      <header className="bg-black text-white py-20 border-b-4 border-indigo-600">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-indigo-600 text-[10px] font-black uppercase tracking-widest">
              {experiment.status === 'active' ? 'Live Pilot Experiment' : 'Experiment Completed'}
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">{experiment.title}</h1>
            <p className="text-xl text-gray-400 font-bold italic">"{experiment.hypothesis}"</p>
            
            {/* Progress Bar */}
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-white/10">
              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            
            <div className="grid grid-cols-3 gap-8 py-8 border-y border-white/10">
              <div>
                <div className="text-3xl font-black text-indigo-400">${experiment.amount_pledged.toLocaleString()}</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Raised of ${experiment.funding_goal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-3xl font-black">{Math.round(progress)}%</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Funded</div>
              </div>
              <div>
                <div className="text-3xl font-black text-green-400">{experiment.participant_count}</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Backers</div>
              </div>
            </div>

            <NeoButton onClick={handlePledge} variant="secondary" className="px-12 py-4 text-lg bg-[#39ff14] border-none text-black hover:scale-105 transition-transform">
              Back This Project
            </NeoButton>
          </div>
          
          <div className="w-full md:w-[400px] aspect-square bg-gray-900 rounded-[2.5rem] border-4 border-white shadow-[12px_12px_0px_0px_#4f46e5] flex items-center justify-center">
            {experiment.main_image_url ? (
              <img src={experiment.main_image_url} className="w-full h-full object-cover rounded-[2.2rem]" alt="Hero" />
            ) : (
              <Zap size={64} className="text-indigo-400 animate-pulse" />
            )}
          </div>
        </div>
      </header>

      {/* Tabbed Navigation */}
      <div className="border-b-4 border-black sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 max-w-6xl flex gap-12">
          {['overview', 'findings', 'discussion'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={`py-6 text-xs font-black uppercase tracking-[0.3em] transition-all border-b-8 ${activeTab === tab ? 'border-indigo-600 text-black' : 'border-transparent text-gray-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-6xl py-20">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-12">
               <h2 className="text-4xl font-black tracking-tighter">About This Project</h2>
               <p className="text-xl text-gray-600 leading-relaxed font-medium">{experiment.objective}</p>
               
               <div className="p-8 bg-gray-50 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000]">
                 <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Target className="text-indigo-600"/> Demographics Focus</h3>
                 <p className="font-bold text-gray-700">{typeof experiment.demographics === 'string' ? experiment.demographics : JSON.stringify(experiment.demographics)}</p>
               </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="h-[300px] w-full bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Budget Allocation</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={experiment.budget_breakdown || []} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="amount">
                      {(experiment.budget_breakdown || []).map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="max-w-3xl space-y-12">
            {sessions.map((session, idx) => (
              <div key={session.id} className="relative pl-12 border-l-4 border-gray-100">
                <div className="absolute -left-4 top-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">
                  {sessions.length - idx}
                </div>
                <div className="bg-white p-8 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 mb-4">
                    <Calendar size={12}/> {new Date(session.session_date).toLocaleDateString()}
                  </div>
                  <h3 className="text-2xl font-black mb-4">Lab Findings</h3>
                  <p className="text-gray-600 leading-relaxed font-medium mb-6">{session.qualitative_findings}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-[8px] font-black uppercase text-red-400">Pre-Sentiment</p><p className="font-bold">{session.pre_sentiment}</p></div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100"><p className="text-[8px] font-black uppercase text-green-400">Post-Sentiment</p><p className="font-bold">{session.post_sentiment}</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'discussion' && (
          <div className="max-w-3xl py-20 text-center border-4 border-dashed border-gray-100 rounded-3xl">
            <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">Discussion opens for verified backers.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicExperiment;