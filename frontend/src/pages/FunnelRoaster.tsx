import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Zap, Target, Link as LinkIcon, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const FunnelRoaster = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=Inputs, 2=Analyzing, 3=Results
  const [result, setResult] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    url: '',
    email: '',
    hook: '',
    offer: '',
    adCreative: '', // Link to Ad
    competitors: '',
    metrics: {
      adSpend: '',
      revenue: '',
      cvr: '',
      ctr: ''
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('metric_')) {
      const metricName = name.replace('metric_', '');
      setFormData(prev => ({ ...prev, metrics: { ...prev.metrics, [metricName]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);

    try {
      const res = await fetch('/api/run-funnel-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      
      setResult(data.report);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to run roast. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              AI Funnel Roaster
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Don't just fix the page. Fix the <span className="font-bold text-black">congruency</span>.
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: The Destination */}
            <NeoCard title="1. The Destination (Landing Page)">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-grow w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Landing Page URL *</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="url"
                      name="url"
                      required
                      placeholder="https://your-site.com/landing-page"
                      className="w-full pl-10 p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-0"
                      value={formData.url}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@company.com"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </NeoCard>

            {/* Section 2: The Ad Context */}
            <NeoCard title="2. The Ad Context (The Promise)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">The Hook</label>
                  <input
                    type="text"
                    name="hook"
                    placeholder="e.g. Stop guessing your ad spend..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.hook}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">What caught their attention?</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">The Offer</label>
                  <input
                    type="text"
                    name="offer"
                    placeholder="e.g. Free 5-minute audit..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.offer}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">What are they expecting to get?</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ad Creative (Link)</label>
                  <input
                    type="url"
                    name="adCreative"
                    placeholder="https://facebook.com/ads/library/..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={formData.adCreative}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Link to the live ad or a hosted screenshot (Meta/Google/LinkedIn).</p>
                </div>
              </div>
            </NeoCard>

            <NeoButton type="submit" className="w-full py-4 text-lg" disabled={loading}>
              {loading ? 'Analyzing Funnel...' : 'Run Funnel Roast'} <Zap className="ml-2" />
            </NeoButton>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-8"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Congruency...</h2>
            <p className="text-gray-600">Our AI Media Buyer is checking your Ad against your Landing Page.</p>
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-8">
            <NeoCard className="border-l-8 border-l-purple-600">
              <h2 className="text-2xl font-black mb-4">The Verdict</h2>
              <div className="prose prose-lg">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </NeoCard>
            <div className="text-center">
              <NeoButton onClick={() => setStep(1)} variant="secondary">Run Another Roast</NeoButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelRoaster;