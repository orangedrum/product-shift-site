import React from 'react';
import { 
  CheckCircle, History, FileText, Trophy, MessageSquare, 
  Zap, Trash2, Plus, X, Check, ExternalLink, Sparkles, Layout, PenTool
} from 'lucide-react';

interface AssetCardProps {
  asset: any;
  onAction?: (action: 'approve' | 'discard' | 'delete' | 'add' | 'remove', id?: string) => void;
  mode: 'review' | 'library' | 'draft' | 'vault';
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onAction, mode }) => {
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
    };
    return styles[type] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: FileText };
  };

  const style = getTypeStyles(asset.type);
  const Icon = style.icon;

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
          <button onClick={() => onAction?.('add')} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase">
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
          <Icon size={12} /> {asset.type.replace('_', ' ')}
        </span>
        {asset.industry && (
          <span className="text-[10px] font-bold text-gray-400 uppercase">{asset.industry}</span>
        )}
      </div>

      <h4 className="text-base font-bold text-gray-900 leading-tight mb-1">{asset.title}</h4>
      {asset.company && (
        <p className="text-xs font-bold text-indigo-600/70 mb-3">{asset.company}</p>
      )}

      <div className="space-y-2 mb-4">
        {asset.description?.slice(0, mode === 'vault' ? 1 : 3).map((bullet: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className={mode === 'vault' ? 'truncate' : ''}>{bullet}</span>
          </div>
        ))}
        {mode === 'vault' && asset.description?.length > 1 && (
          <p className="text-[10px] text-gray-400 font-bold italic">+{asset.description.length - 1} more details...</p>
        )}
      </div>

      {asset.roi_metrics?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
          {asset.roi_metrics.map((metric: string, idx: number) => (
            <span key={idx} className="flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md uppercase">
              <Trophy size={10}/> {metric}
            </span>
          ))}
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