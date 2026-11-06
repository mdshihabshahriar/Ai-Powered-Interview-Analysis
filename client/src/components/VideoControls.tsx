import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, CheckCircle2 } from 'lucide-react';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onEndInterview?: () => void;
  isInterviewer?: boolean;
  isInterviewStarted?: boolean;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoOff,
  onToggleMic,
  onToggleVideo,
  onLeave,
  onEndInterview,
  isInterviewer = false,
  isInterviewStarted = false,
}) => {
  return (
    <div className="flex items-center justify-center space-x-3 sm:space-x-4 py-3 px-6 rounded-2xl bg-surface-900/90 backdrop-blur-xl border border-surface-800/80 shadow-2xl">
      {/* Microphone Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center shadow-lg ${
          isMuted
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
            : 'bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700/60'
        }`}
        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center shadow-lg ${
          isVideoOff
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
            : 'bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700/60'
        }`}
        title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
      >
        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      {/* Leave Room Button */}
      <button
        onClick={onLeave}
        className="p-3.5 rounded-xl font-medium bg-surface-800 hover:bg-surface-700 text-rose-400 hover:text-rose-300 border border-surface-700/60 transition-all duration-200 shadow-lg"
        title="Leave Interview Room"
      >
        <PhoneOff className="w-5 h-5" />
      </button>

      {/* Interviewer End Interview Action */}
      {isInterviewer && isInterviewStarted && onEndInterview && (
        <button
          onClick={onEndInterview}
          className="ml-2 sm:ml-4 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all duration-200 hover:scale-105"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>End & Finalize</span>
        </button>
      )}
    </div>
  );
};

