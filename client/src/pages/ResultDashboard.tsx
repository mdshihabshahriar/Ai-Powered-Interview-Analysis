import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, ArrowLeft, Calendar, User, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { AskedQuestionRecord, InterviewSummary } from '../types/index.js';
import { exportInterviewCSV } from '../utils/csvExport.js';

interface ResultDashboardProps {
  roomId: string;
  candidateName: string;
  interviewerName: string;
  askedQuestions: AskedQuestionRecord[];
  summary: InterviewSummary;
  startedAt: string | null;
  endedAt: string | null;
  onRestart: () => void;
  role: 'interviewer' | 'candidate';
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  roomId,
  candidateName,
  interviewerName,
  askedQuestions,
  summary,
  startedAt,
  endedAt,
  onRestart,
  role,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  }, []);

  // Filter ONLY asked and matched questions according to spec
  const matchedAskedQuestions = askedQuestions.filter((q) => q.isMatched);

  const handleExportCSV = () => {
    exportInterviewCSV(
      roomId,
      candidateName,
      askedQuestions,
      summary,
      startedAt || undefined
    );
  };

  const getStatusBadge = (status: string, score: number) => {
    if (score >= 90) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Excellent
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
          Good
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Partially Correct
        </span>
      );
    }
    if (score >= 25) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
          Weak
        </span>
      );
    }
    if (score > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Mostly Incorrect
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
        Not Answered
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-surface-950 p-4 sm:p-6 md:p-10 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 flex-1">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-surface-900 via-surface-850 to-surface-900 border border-surface-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              <span>Interview Evaluation Report (Asked Questions Only)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Candidate Performance Assessment
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-300" />
                <span>Candidate: <strong className="text-white">{candidateName}</strong></span>
              </span>
              <span>•</span>
              <span>Room: <strong className="font-mono text-brand-300">{roomId}</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                <span>{startedAt ? new Date(startedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-600/30 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>

            <button
              onClick={onRestart}
              className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-semibold bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 flex items-center space-x-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>New Interview</span>
            </button>
          </div>
        </div>

        {/* 5 Summary Metric Cards (Section 6) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Overall Score */}
          <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800 shadow-xl col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Overall Interview Score
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-brand-300">
                {summary.overallScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Based on {summary.successfullyMatchedQuestions} asked & matched questions.
            </p>
          </div>

          {/* Card 2: Total Questions Asked */}
          <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Questions Asked
            </span>
            <span className="text-3xl font-black font-mono text-white">
              {summary.totalQuestionsAsked}
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Questions asked during call.
            </p>
          </div>

          {/* Card 3: Successfully Matched Questions */}
          <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Successfully Matched
            </span>
            <span className="text-3xl font-black font-mono text-emerald-400">
              {summary.successfullyMatchedQuestions}
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Matched against JSON dataset.
            </p>
          </div>

          {/* Card 4: Answered Questions */}
          <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Answered Questions
            </span>
            <span className="text-3xl font-black font-mono text-teal-400">
              {summary.answeredCount}
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Answered with positive score.
            </p>
          </div>

          {/* Card 5: Unanswered Questions */}
          <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Unanswered Questions
            </span>
            <span className="text-3xl font-black font-mono text-rose-400">
              {summary.unansweredCount}
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Skipped, unanswered, or unknown (0 pts).
            </p>
          </div>
        </div>

        {/* Detailed Asked Questions Table (ONLY asked and matched) */}
        <div className="bg-surface-900 border border-surface-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-surface-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Asked & Matched Questions Evaluation
            </h3>
            <span className="text-xs text-slate-400">
              Showing {matchedAskedQuestions.length} asked and matched question(s)
            </span>
          </div>

          {matchedAskedQuestions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No questions were asked or matched during this interview session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-surface-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[200px]">Interviewer's Original Question</th>
                    <th className="py-3 px-4 min-w-[200px]">Matched JSON Question & Expected</th>
                    <th className="py-3 px-4 min-w-[200px]">Candidate's Actual Answer</th>
                    <th className="py-3 px-4 w-20 text-center">Score</th>
                    <th className="py-3 px-4 w-28">Status</th>
                    <th className="py-3 px-4 min-w-[200px]">AI Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/80">
                  {matchedAskedQuestions.map((q, index) => {
                    const score = q.similarityScore;
                    const status = q.evaluationStatus;
                    const candidateAns = q.candidateAnswer ? q.candidateAnswer : 'Not Answered';

                    return (
                      <tr key={q.id || index} className="hover:bg-surface-850/50 transition-colors">
                        <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-white">
                            "{q.interviewerQuestion}"
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Match Confidence: {q.matchConfidence}%
                          </span>
                        </td>
                        <td className="py-4 px-4 space-y-1">
                          <p className="font-medium text-slate-200">
                            {q.matchedQuestion}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2" title={q.matchedExpectedAnswer || ''}>
                            <span className="text-amber-400 font-medium">Exp: </span>
                            {q.matchedExpectedAnswer}
                          </p>
                        </td>
                        <td className="py-4 px-4 font-sans text-slate-300">
                          <p className="line-clamp-3 leading-relaxed">
                            "{candidateAns}"
                          </p>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-sm">
                          <span
                            className={
                              score >= 75
                                ? 'text-emerald-400'
                                : score >= 50
                                ? 'text-amber-400'
                                : score > 0
                                ? 'text-rose-400'
                                : 'text-slate-500'
                            }
                          >
                            {score}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(status, score)}
                        </td>
                        <td className="py-4 px-4 text-slate-300 leading-relaxed font-sans text-[11px]">
                          {q.aiFeedback}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-surface-800/60 mt-10">
        EvalVue AI Interview System • Session Evaluation Assessment
      </footer>
    </div>
  );
};
