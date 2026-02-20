import React, { useState, useRef, useEffect } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, className = '' }) => {
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div 
      className={`relative inline-block ${className}`}
    >
      <div className="rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden bg-black line-height-0">
        <video 
          ref={videoRef}
          src={src} 
          poster={poster}
          autoPlay 
          loop 
          playsInline 
          className="block max-w-full max-h-[80vh] w-auto h-auto"
        />
      </div>
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-4 right-4 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors z-10 border-2 border-white shadow-sm"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};