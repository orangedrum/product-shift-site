import React from 'react';
import { 
  CheckCircle, History, FileText, Trophy, MessageSquare, 
  Zap, Trash2, Plus, X, Check, ExternalLink, Sparkles, Layout, PenTool,
  MessageCircle, Mic, Users, Eye, Globe, Fingerprint, Target, Brain, AlertCircle
} from 'lucide-react';

interface AssetCardProps {
  asset: any;
  onAction?: (action: 'approve' | 'discard' | 'delete' | 'add' | 'remove', id?: string) => void;
  onUpdate?: (id: string, field: string, value: any) => void;
  mode: 'review' | 'library' | 'draft' | 'vault';
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onAction, onUpdate, mode }) => {
  const getTypeStyles = (type: string) => {
    const styles: Record<string, { bg: string, text: string, icon: any }> = {
      work_history: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: History },
      case_study: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Layout },
      win: { bg: 'bg-green-50', text: 'text-green-600', icon: Trophy },
      skill: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Zap },
      talk: { bg: 'bg-pink-50', text: 'text-pink-600', icon: PenTool },
      writing_sample: { bg: 'bg-blue-50', text: 'text-blue-600', icon: FileText },
      recommendation: { bg: 'bg-orange-50', text: 'text-orange-600', icon: MessageSquare },
      narrative_theme: { bg: 'bg-rose-50', text: 'text-rose-600', icon: Sparkles },
      // Community Intelligence Types
      whatsapp: { bg: 'bg-green-50', text: 'text-green-600', icon: MessageCircle },
      transcript: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Mic },
      meeting_notes: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Users },
      observation: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Eye },
      social_media: { bg: 'bg-sky-50', text: 'text-sky-600', icon: Globe },
    };
    return styles[type] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: FileText };
  };

  const style = getTypeStyles(asset.type);
  const Icon = style.icon;

  // LEAD ENGINEER DEFENSE: Force normalization so .map() never fails
  const rawDescription = asset.description;
  const bullets: string[] = Array.isArray(rawDescription) 
    ? rawDescription 
    : (typeof rawDescription === 'string' 
        ? rawDescription.split('\n').map((s: string) => s.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean)
        : []);

  // CTO: Community Insight Rendering Helper
  const renderExtractedInsights = () => {
    const insights = asset.extracted_insights;
    if (!insights || Object.keys(insights).length === 0) return null;

    return (
      <div className="mt-4 space-y-3 pt-3 border-t border-gray-100">
        {insights.motivation && (
          <div className="flex items-start gap-2">
            <Target size={14} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-tighter">Motivation: <span className="font-medium text-gray-600 normal-case">{insights.motivation}</span></p>
          </div>
        )}
        {(insights.objections && insights.objections.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {insights.objections.map((obj: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-black uppercase border border-red-100 flex items-center gap-1">
                <AlertCircle size={10}/> {obj}
              </span>
            ))}
          </div>
        )}
        {(insights.triggers && insights.triggers.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {insights.triggers.map((tri: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase border border-indigo-100 flex items-center gap-1">
                <Zap size={10}/> {tri}
              </span>
            ))}
          </div>
        )}
        {insights.engagement_level && (
          <p className="text-[9px] font-black uppercase text-gray-400">Engagement: <span className="text-indigo-600">{insights.engagement_level}</span></p>
        )}
      </div>
    );
  };

  return (
    <div className={`p-5 bg-white border border-gray-100 rounded-2xl transition-all hover:shadow-md group relative ${mode === 'draft' ? 'border-indigo-100 shadow-sm' : ''}`}>
      {/* Actions */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {mode === 'review' && (
          <>
            <button onClick={() => onAction?.('approve')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><Check size={16}/></button>
            <button onClick={() => onAction?.('discard')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><X size={16}/></button>
          </>
        )}
        {mode === 'vault' && (
          <button 
            onClick={(e) => { e.stopPropagation(); console.log('🖱️ Vault Button Clicked'); onAction?.('add'); }} 
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase z-20"
          >
            <Plus size={14}/> Add to Draft
          </button>
        )}
        {mode === 'draft' && (
          <button onClick={() => onAction?.('remove', asset.id)} className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500"><Trash2 size={16}/></button>
        )}
        {mode === 'library' && (
          <button onClick={() => onAction?.('delete', asset.id)} className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
          <Icon size={12} /> {asset.type ? asset.type.replace('_', ' ') : 'asset'}
        </span>
        {asset.industry && (
          <span className="text-[10px] font-bold text-gray-400 uppercase">{asset.industry}</span>
        )}
      </div>

      {/* Title - Editable in draft and review modes */}
      {(mode === 'draft' || mode === 'review') && onUpdate ? (
        <input 
          className="w-full text-base font-bold text-gray-900 leading-tight mb-1 bg-transparent border-b-2 border-indigo-100 focus:border-indigo-400 focus:ring-0 p-0 outline-none"
          value={asset.title}
          onChange={(e) => onUpdate?.(asset.id, 'title', e.target.value)}
        />
      ) : (
        <h4 className="text-base font-bold text-gray-900 leading-tight mb-1">{asset.title}</h4>
      )}

      {/* Company - Editable in draft and review modes */}
      {(mode === 'draft' || mode === 'review') && onUpdate ? (
        <input 
          className="w-full text-xs font-bold text-indigo-600/70 mb-3 bg-transparent border-b border-indigo-50 focus:border-indigo-200 focus:ring-0 p-0 outline-none uppercase"
          value={asset.company || ''}
          placeholder="Company Name"
          onChange={(e) => onUpdate?.(asset.id, 'company', e.target.value)}
        />
      ) : (
        asset.company && mode !== 'draft' && (
          <p className="text-xs font-bold text-indigo-600/70 mb-3">{asset.company}</p>
        )
      )}

      {asset.type === 'recommendation' && mode === 'draft' && (
        <div className="mb-3 space-y-1">
          <input 
            className="w-full text-xs font-bold text-indigo-900 bg-transparent border-none focus:ring-0 p-0 outline-none"
            value={asset.recommender_name || ''}
            placeholder="Recommender Name"
            onChange={(e) => onUpdate?.(asset.id, 'recommender_name', e.target.value)}
          />
          <input 
            className="w-full text-[10px] font-bold text-gray-400 bg-transparent border-none focus:ring-0 p-0 outline-none uppercase"
            value={asset.recommender_title || ''}
            placeholder="Recommender Title"
            onChange={(e) => onUpdate?.(asset.id, 'recommender_title', e.target.value)}
          />
        </div>
      )}

      {/* Community Source Label */}
      {asset.label && (
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Fingerprint size={10} /> {asset.label}
        </p>
      )}

      <div className="space-y-2 mb-4">
        {(mode === 'draft' || mode === 'review') && onUpdate ? (
          <textarea 
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-0 focus:border-indigo-200 outline-none resize-none italic"
            rows={Math.max(bullets.length, 2)}
            value={bullets.join('\n')}
            onChange={(e) => onUpdate?.(asset.id, 'description', e.target.value.split('\n'))}
            placeholder="Description (One bullet per line)"
          />
        ) : (
          <>
            {bullets.slice(0, mode === 'vault' ? 1 : bullets.length).map((bullet: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className={mode === 'vault' ? 'truncate' : ''}>{bullet}</span>
              </div>
            ))}
            {mode === 'vault' && bullets.length > 1 && (
              <p className="text-[10px] text-gray-400 font-bold italic">+{bullets.length - 1} more details...</p>
            )}
          </>
        )}
      </div>

      {/* Extracted Intelligence */}
      {renderExtractedInsights()}

      {asset.roi_metrics?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
          {asset.roi_metrics.map((metric: string, idx: number) => (
            <span key={idx} className="flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md uppercase">
              <Trophy size={10}/> {metric}
            </span>
          ))}
        </div>
      )}

      {/* Asset Type Selector - Only in review mode with onUpdate */}
      {mode === 'review' && onUpdate && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Asset Type</label>
          <select 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
            value={asset.type || ''}
            onChange={(e) => onUpdate?.(asset.id, 'type', e.target.value)}
          >
            <option value="work_history">Work History</option>
            <option value="case_study">Case Study</option>
            <option value="win">Win / ROI</option>
            <option value="skill">Skill</option>
            <option value="talk">Talk</option>
            <option value="writing_sample">Writing Sample</option>
            <option value="recommendation">Recommendation</option>
            <option value="narrative_theme">Narrative Theme</option>
          </select>
        </div>
      )}

      {asset.source_url && asset.source_url !== 'direct_upload' && (
        <div className="mt-4 pt-2">
          <a 
            href={asset.source_url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-1"
          >
            <ExternalLink size={10} /> Source
          </a>
        </div>
      )}
    </div>
  );
};