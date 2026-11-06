import React, { useEffect, useRef, useState } from 'react';
import { MicOff, VideoOff, Maximize2, Minimize2 } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  name: string;
  role: 'interviewer' | 'candidate';
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  className?: string;
  isSpeaking?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  name,
  role,
  isMuted = false,
  isVideoOff = false,
  isLocal = false,
  className = '',
  isSpeaking = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('[VideoPlayer] Play interrupted/autoplay prevented:', err?.message || err);
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const getInitials = (fullName: string) => {
    return (
      fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U'
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden bg-surface-900 border border-surface-800/80 shadow-2xl flex items-center justify-center transition-all ${
        isSpeaking ? 'ring-2 ring-brand-500 shadow-brand-500/10' : ''
      } ${className}`}
    >
      {/* Actual HTML Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // CRITICAL: Local stream must be muted to prevent feedback loop!
        onLoadedMetadata={(e) => {
          (e.target as HTMLVideoElement).play().catch(() => {});
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal ? 'mirror-video' : ''
        } ${isVideoOff || !stream ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video Off / Connecting Fallback Avatar */}
      {(isVideoOff || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-surface-850 to-surface-950 p-6 z-10 pointer-events-none">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-surface-800 to-surface-700 border border-surface-600/40 flex items-center justify-center shadow-xl">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-300 tracking-wider">
                {getInitials(name)}
              </span>
            </div>
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full border-2 border-brand-400 animate-ping opacity-75" />
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">{name}</p>
          <span className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
            <VideoOff className="w-3.5 h-3.5 text-slate-500" />
            <span>{!stream ? 'Connecting camera...' : 'Camera is turned off'}</span>
          </span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-surface-900/60 backdrop-blur-md text-slate-300 hover:text-white hover:bg-surface-800/80 transition-all border border-white/5 opacity-80 hover:opacity-100 focus:opacity-100"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Metadata Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center space-x-2 bg-surface-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-white shadow-lg">
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {name} {isLocal && '(You)'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              role === 'interviewer'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
            }`}
          >
            {role}
          </span>
        </div>

        {/* Audio Mute Status Indicator */}
        <div className="flex items-center space-x-1.5">
          {isMuted && (
            <div className="p-1.5 rounded-xl bg-rose-500/80 backdrop-blur-md text-white border border-rose-400/30 shadow-lg">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          )}
          {isVideoOff && (
            <div className="p-1.5 rounded-xl bg-surface-800/80 backdrop-blur-md text-slate-400 border border-surface-700/40 shadow-lg">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
