import React, { useState } from 'react';
import { Video, Award, Sparkles, ArrowRight, CheckCircle2, Shield, User, Mic } from 'lucide-react';

interface LandingPageProps {
  onJoinAsInterviewer: () => void;
  onJoinAsCandidate: () => void;
  isCreatingRoom: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onJoinAsInterviewer,
  onJoinAsCandidate,
  isCreatingRoom,
}) => {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-black text-lg sm:text-xl shrink-0">
            AI
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
              EvalVue AI
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-brand-400 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 whitespace-nowrap">
              Real-Time Interview System
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center text-center">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface-800/80 border border-surface-700/60 text-xs font-medium text-brand-300 mb-6 sm:mb-8 shadow-xl max-w-full truncate">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate">WebRTC Video • Speech Recognition • AI Evaluation</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Real-Time AI Online Interview &{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Automated Evaluation
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Conduct live peer-to-peer technical interviews with instant candidate speech-to-text transcription,
          semantic answer evaluation against predefined technical questions, and comprehensive CSV reporting.
        </p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12 w-full max-w-3xl">
          {/* Card 1: Interviewer */}
          <div className="group relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-surface-900 to-surface-950 border border-surface-800/90 p-5 sm:p-8 text-left hover:border-brand-500/50 transition-all duration-300 shadow-2xl hover:shadow-brand-500/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Interviewer Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Create a secure interview room, receive a unique room code to share, navigate through technical questions, and view live AI semantic answer evaluations.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Generate unique room code (e.g. INT-8X92K)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Predefined questions & expected answers panel</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant candidate answer scoring (0-100)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Export comprehensive final CSV report</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onJoinAsInterviewer}
              disabled={isCreatingRoom}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <span>{isCreatingRoom ? 'Creating Room...' : 'Join as Interviewer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Candidate */}
          <div className="group relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-surface-900 to-surface-950 border border-surface-800/90 p-5 sm:p-8 text-left hover:border-indigo-500/50 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Candidate Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Enter your name and the room code provided by your interviewer. Connect seamlessly with high-definition audio and video.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Quick room join with validation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-time WebRTC audio and video</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Natural microphone speech answering</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Synchronized live question display</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onJoinAsCandidate}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm bg-surface-800 hover:bg-surface-700 text-white border border-surface-700/80 shadow-xl flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <span>Join as Candidate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-surface-900/50 border border-surface-800/60">
            <Video className="w-5 h-5 text-brand-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Peer-to-Peer WebRTC</h4>
            <p className="text-[11px] text-slate-400 mt-1">Encrypted real-time video/audio with STUN/TURN traversal.</p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-900/50 border border-surface-800/60">
            <Mic className="w-5 h-5 text-brand-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Live Speech Recognition</h4>
            <p className="text-[11px] text-slate-400 mt-1">Converts candidate responses to text with greeting filtering.</p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-900/50 border border-surface-800/60">
            <Sparkles className="w-5 h-5 text-brand-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Semantic AI Evaluation</h4>
            <p className="text-[11px] text-slate-400 mt-1">Contextual similarity scoring & unknown answer detection.</p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-900/50 border border-surface-800/60">
            <Award className="w-5 h-5 text-brand-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Automated Reports</h4>
            <p className="text-[11px] text-slate-400 mt-1">Overall scoring and RFC 4180 UTF-8 CSV report export.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-surface-800/60 text-center text-xs text-slate-500">
        EvalVue AI Real-Time Interview & Evaluation System • Built with React, WebRTC, Socket.IO & Node.js
      </footer>
    </div>
  );
};

