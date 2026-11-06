import React, { useState } from 'react';
import { User, KeyRound, ArrowRight, AlertCircle, ArrowLeft, Shield } from 'lucide-react';

interface CandidateJoinPageProps {
  initialRoomId?: string;
  onJoin: (roomId: string, candidateName: string) => void;
  onBack: () => void;
}

export const CandidateJoinPage: React.FC<CandidateJoinPageProps> = ({
  initialRoomId = '',
  onJoin,
  onBack,
}) => {
  const [candidateName, setCandidateName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomId);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = candidateName.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanCode) {
      setError('Please enter the interview room code.');
      return;
    }

    setIsValidating(true);

    try {
      // Validate with backend API before socket join
      const res = await fetch(`/api/rooms/${cleanCode}?role=candidate`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid room code or interview is not accessible.');
        setIsValidating(false);
        return;
      }

      onJoin(cleanCode, cleanName);
    } catch (err: any) {
      setError('Could not connect to the interview server. Please check your network.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between p-6">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="self-start mb-6 text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Card */}
        <div className="bg-surface-900 border border-surface-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Join Interview Room</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your details to join your scheduled video interview session.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Interview Room Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. INT-8X92K"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-surface-950 border border-surface-800 text-white font-mono rounded-xl pl-10 pr-4 py-3 text-sm tracking-wider uppercase focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Privacy notice - camera only activates when call starts */}
            <div className="p-3 rounded-xl bg-surface-950/60 border border-surface-800/60 flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Camera & mic will turn on only after you join the live call.</span>
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] mt-4"
            >
              <span>{isValidating ? 'Validating Room...' : 'Enter Interview'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
