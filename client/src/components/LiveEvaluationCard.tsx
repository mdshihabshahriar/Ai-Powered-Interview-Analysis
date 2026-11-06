import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Sparkles, Mic, FileText } from 'lucide-react';
import { AskedQuestionRecord, EvaluationStatus } from '../types/index.js';

interface LiveEvaluationCardProps {
  activeAskedQuestion: AskedQuestionRecord | null;
  candidateLiveSpeech: string;
  isCandidateSpeaking: boolean;
  onEvaluateCandidateAnswer?: (answerText: string) => void;
}

export const LiveEvaluationCard: React.FC<LiveEvaluationCardProps> = ({
  activeAskedQuestion,
  candidateLiveSpeech,
  isCandidateSpeaking,
  onEvaluateCandidateAnswer,
}) => {
  const getStatusBadge = (status: EvaluationStatus, score: number) => {
    switch (status) {
      case 'Excellent':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Excellent (90-100)</span>
          </span>
        );
      case 'Good':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Good (75-89)</span>
          </span>
        );
      case 'Partially Correct':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Partially Correct (50-74)</span>
          </span>
        );
      case 'Weak':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Weak (25-49)</span>
          </span>
        );
      case 'Mostly Incorrect':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Mostly Incorrect (1-24)</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/40 text-slate-400 border border-slate-600/30 flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Not Answered (0 pts)</span>
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-teal-400';
    if (score >= 50) return 'text-amber-400';
    if (score >= 25) return 'text-orange-400';
    return 'text-rose-400';
  };

  const isEvaluated = Boolean(
    activeAskedQuestion &&
    activeAskedQuestion.isMatched &&
    (activeAskedQuestion.candidateAnswer || activeAskedQuestion.similarityScore > 0 || activeAskedQuestion.isUnknownResponse)
  );

  return (
    <div className="bg-surface-900/90 backdrop-blur-xl border border-surface-800/80 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-800">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Candidate Response & AI Evaluation
          </h4>
        </div>
        {isEvaluated && activeAskedQuestion && (
          getStatusBadge(activeAskedQuestion.evaluationStatus, activeAskedQuestion.similarityScore)
        )}
      </div>

      {/* Candidate Live Transcription Stream */}
      <div className="rounded-xl bg-surface-950/70 border border-surface-800 p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <Mic className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>Candidate Spoken Audio (Live Stream):</span>
          </div>
          {isCandidateSpeaking && (
            <span className="text-[10px] text-brand-400 animate-pulse flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              <span>Transcribing Speech...</span>
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-slate-200 min-h-[44px] leading-relaxed break-words bg-surface-900/40 p-2.5 rounded-lg border border-surface-800/50">
          {candidateLiveSpeech || (
            <span className="text-slate-500 italic">Candidate has not spoken yet...</span>
          )}
        </p>

        {/* Action to trigger evaluate candidate live speech */}
        {candidateLiveSpeech && onEvaluateCandidateAnswer && (
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={() => onEvaluateCandidateAnswer(candidateLiveSpeech)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md transition-all"
            >
              Evaluate This Spoken Answer
            </button>
          </div>
        )}
      </div>

      {/* Evaluation Results Card */}
      {isEvaluated && activeAskedQuestion ? (
        <div className="space-y-3">
          {/* Similarity Score Meter */}
          <div className="rounded-xl bg-surface-950/80 border border-surface-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Semantic Similarity Score</span>
              <span className={`text-2xl font-black font-mono ${getScoreColor(activeAskedQuestion.similarityScore)}`}>
                {activeAskedQuestion.similarityScore}
                <span className="text-sm font-normal text-slate-500"> / 100</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-surface-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeAskedQuestion.similarityScore >= 90
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : activeAskedQuestion.similarityScore >= 75
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                    : activeAskedQuestion.similarityScore >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-500 to-red-400'
                }`}
                style={{ width: `${Math.max(5, activeAskedQuestion.similarityScore)}%` }}
              />
            </div>
          </div>

          {/* Recorded Candidate Answer */}
          <div className="rounded-xl bg-surface-950/70 border border-surface-800 p-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Transcribed Answer Evaluated:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans max-h-24 overflow-y-auto">
              "{activeAskedQuestion.candidateAnswer || '(No response provided)'}"
            </p>
          </div>

          {/* AI Feedback */}
          <div className="rounded-xl bg-brand-950/30 border border-brand-800/40 p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-brand-300 uppercase tracking-wider block">
              AI Evaluation & Feedback:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {activeAskedQuestion.aiFeedback}
            </p>

            {/* Matched Concepts */}
            {activeAskedQuestion.matchedConcepts && activeAskedQuestion.matchedConcepts.length > 0 && (
              <div className="pt-2 border-t border-surface-800/60">
                <span className="text-[10px] font-semibold text-emerald-400 block mb-1">
                  Matched Concepts:
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeAskedQuestion.matchedConcepts.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-dashed border-surface-800 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-surface-800 text-slate-400 flex items-center justify-center mx-auto">
            <Mic className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-300">Awaiting Candidate Spoken Answer</p>
          <p className="text-[11px] text-slate-500">
            Ask a technical question using the panel above. The candidate's spoken response will be transcribed and evaluated automatically.
          </p>
        </div>
      )}
    </div>
  );
};
