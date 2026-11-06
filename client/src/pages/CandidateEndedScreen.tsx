import React, { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, VideoOff, MicOff, Home } from 'lucide-react';

interface CandidateEndedScreenProps {
  candidateName: string;
  roomId: string;
  onExit: () => void;
}

export const CandidateEndedScreen: React.FC<CandidateEndedScreenProps> = ({
  candidateName,
  roomId,
  onExit,
}) => {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center p-4 sm:p-6 text-center">
      <div className="max-w-lg w-full bg-surface-900 border border-surface-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Interview Concluded
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Thank You, {candidateName}!
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Your technical interview session for room <span className="font-mono text-brand-300 font-bold">{roomId}</span> has ended. Your responses have been successfully recorded.
          </p>
        </div>

        {/* Device Privacy Notice */}
        <div className="p-4 rounded-2xl bg-surface-950 border border-surface-800/80 text-left space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Camera & Microphone Deactivated</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All local media streams, camera video feeds, and microphone audio listeners have been stopped and disconnected.
          </p>
          <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <VideoOff className="w-3.5 h-3.5" />
              <span>Camera Off</span>
            </span>
            <span className="flex items-center space-x-1">
              <MicOff className="w-3.5 h-3.5" />
              <span>Microphone Off</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onExit}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
        >
          <Home className="w-4 h-4" />
          <span>Exit to Home</span>
        </button>
      </div>
    </div>
  );
};

