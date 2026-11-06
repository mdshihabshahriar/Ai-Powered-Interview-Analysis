import React, { useState } from 'react';
import { Copy, Check, Users, ArrowRight, Shield, VideoOff } from 'lucide-react';
import { Participant } from '../types/index.js';

interface InterviewerLobbyPageProps {
  roomId: string;
  interviewerName: string;
  candidate: Participant | null;
  onStartInterview: () => void;
}

export const InterviewerLobbyPage: React.FC<InterviewerLobbyPageProps> = ({
  roomId,
  interviewerName,
  candidate,
  onStartInterview,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}&role=candidate`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between p-6">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center items-center">
        {/* Header Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-6">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Interviewer Lobby & Room Management</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center tracking-tight mb-2">
          Interview Room Ready
        </h1>
        <p className="text-sm text-slate-400 text-center max-w-lg mb-8">
          Share your room code with the candidate. Once they join, click "Start Interview" to begin the live call.
        </p>

        {/* Room Code Card */}
        <div className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center mb-8">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Unique Room Code
          </span>

          <div className="flex items-center justify-center space-x-3 bg-surface-950 p-4 rounded-2xl border border-surface-800">
            <span className="text-3xl font-mono font-black text-brand-300 tracking-wider">
              {roomId}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 transition-all border border-surface-700"
              title="Copy code"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 flex items-center justify-center space-x-1.5 transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Candidate Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Camera Standby Card */}
          <div className="rounded-2xl bg-surface-900 border border-surface-800 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-3 flex items-center space-x-1.5">
                <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Camera & Mic Standby</span>
              </span>

              <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-surface-800 text-slate-400 flex items-center justify-center mx-auto">
                  <VideoOff className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white">Camera is currently Off</h4>
                <p className="text-xs text-slate-400">
                  Your camera and microphone will turn on automatically when you start the interview call.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Host: <strong className="text-slate-200">{interviewerName}</strong></span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </div>

          {/* Candidate Waiting Status */}
          <div className="rounded-2xl bg-surface-900 border border-surface-800 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-3 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-brand-400" />
                <span>Candidate Connection Status</span>
              </span>

              {candidate ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{candidate.name} is Connected!</h4>
                  <p className="text-xs text-emerald-300/80">
                    Candidate is in the waiting room and ready to begin.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-surface-800 text-brand-400 flex items-center justify-center mx-auto animate-pulse">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300">
                    Waiting for Candidate to Join...
                  </h4>
                  <p className="text-xs text-slate-500">
                    Provide the room code <span className="font-mono text-brand-400">{roomId}</span> to the candidate.
                  </p>
                </div>
              )}
            </div>

            {/* Start Interview Button */}
            <button
              type="button"
              onClick={onStartInterview}
              disabled={!candidate}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all mt-4 ${
                candidate
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.02]'
                  : 'bg-surface-800 text-slate-500 cursor-not-allowed border border-surface-700/60'
              }`}
            >
              <span>{candidate ? 'Start Interview' : 'Waiting for Candidate...'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
