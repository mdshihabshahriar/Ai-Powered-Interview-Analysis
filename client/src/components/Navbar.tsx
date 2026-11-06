import React, { useState } from 'react';
import { Copy, Check, Shield, User, Wifi, WifiOff, Clock } from 'lucide-react';
import { Role } from '../types/index.js';

interface NavbarProps {
  roomId?: string;
  role?: Role;
  candidateName?: string;
  isConnected: boolean;
  interviewDuration?: string;
  onLeave?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  role,
  candidateName,
  isConnected,
  interviewDuration,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-surface-800/80 bg-surface-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-lg">
          AI
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            EvalVue
          </span>
          <span className="text-xs font-medium text-brand-400 ml-1.5 px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
            PRO
          </span>
        </div>
      </div>

      {/* Middle: Room Code & Status Badges */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {roomId && (
          <div className="flex items-center space-x-2 bg-surface-800/90 border border-surface-700/60 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Room:</span>
            <span className="font-mono font-bold text-brand-300 tracking-wider">{roomId}</span>
            <button
              onClick={handleCopyCode}
              title="Copy room code"
              className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-surface-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Live Duration Timer */}
        {interviewDuration && (
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-800/80 border border-surface-700/50 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>{interviewDuration}</span>
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-surface-700/50 bg-surface-800/70">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 hidden sm:inline">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Right: User Role & Actions */}
      <div className="flex items-center space-x-3">
        {role && (
          <div className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-800/80 border border-surface-700/50">
            {role === 'interviewer' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200">Interviewer</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-slate-200">{candidateName || 'Candidate'}</span>
              </>
            )}
          </div>
        )}

        {onLeave && (
          <button
            onClick={onLeave}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
          >
            Leave
          </button>
        )}
      </div>
    </header>
  );
};

