import React from 'react';
import { PlayCircle } from 'lucide-react';

interface VideoThumbnailProps {
  imageSrc: string;
  alt: string;
  onPlay?: () => void;
  label?: string;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ imageSrc, alt, onPlay, label }) => {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden shadow-elegant cursor-pointer group" 
      onClick={onPlay}
    >
      <img 
        src={imageSrc} 
        alt={alt} 
        className="w-full h-auto transition-transform duration-300 group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
      
      {/* Play Button Overlay */}
      {onPlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:bg-white/30 transition-all duration-300">
            <PlayCircle className="h-16 w-16 text-white" />
          </div>
        </div>
      )}
      
      {/* Video Label */}
      {label && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="text-white text-sm font-medium">{label}</span>
        </div>
      )}
    </div>
  );
};