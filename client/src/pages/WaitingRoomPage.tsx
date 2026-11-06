import React from 'react';
import { Clock, ShieldCheck, User, VideoOff } from 'lucide-react';

interface WaitingRoomPageProps {
  roomId: string;
  candidateName: string;
  interviewerName: string | null;
  onLeave: () => void;
}

export const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({
  roomId,
  candidateName,
  interviewerName,
  onLeave,
}) => {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between p-6">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center items-center text-center">
        {/* Pulsing waiting badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-300 mb-6 animate-pulse">
          <Clock className="w-3.5 h-3.5 text-brand-400" />
          <span>Connected to Waiting Room</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Waiting for Interviewer to Begin
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          You are successfully connected to room <span className="font-mono text-brand-300 font-bold">{roomId}</span>.
          The video call will start as soon as the interviewer activates it.
        </p>

        {/* Standby Card (Camera Off Before Call) */}
        <div className="w-full bg-surface-900 border border-surface-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-brand-400" />
              <span>{candidateName} (You)</span>
            </span>
            <span className="text-amber-400 font-semibold flex items-center space-x-1">
              <VideoOff className="w-3.5 h-3.5" />
              <span>Camera in Standby</span>
            </span>
          </div>

          <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-surface-950 border border-surface-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center text-brand-400">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Call Starting Soon</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Your camera and microphone are currently off and will activate automatically once the session begins.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/70 border border-surface-800 text-xs text-slate-300 flex items-center justify-between">
            <span>Interviewer: <strong className="text-white">{interviewerName || 'Assigned Assessor'}</strong></span>
            <span className="text-emerald-400 font-medium flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ready on Standby</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLeave}
          className="mt-6 text-xs text-slate-500 hover:text-rose-400 transition-colors"
        >
          Cancel & Leave Room
        </button>
      </div>
    </div>
  );
};
