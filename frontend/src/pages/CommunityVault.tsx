import React from 'react';
import { Database, Upload, MessageCircle, FileText } from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import { MarketingCard } from '../components/MarketingCard';
import { NeoButton } from '../components/NeoButton';

/**
 * The Community Vault (Ingestion Hub)
 * Step 3 of the Community Analyzer Roadmap.
 */
const CommunityVault: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
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

        <div className="grid md:grid-cols-2 gap-8">
          <MarketingCard className="p-8 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><MessageCircle className="text-green-500" /> WhatsApp Shredder</h2>
            <p className="text-gray-600 mb-6 text-sm">Upload your chat exports. AI will extract motivations and objections based on delta timestamps.</p>
            <NeoButton variant="primary" className="w-full">Upload .txt Export</NeoButton>
          </MarketingCard>
        </div>
      </div>
    </div>
  );
};

export default CommunityVault;