import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.js';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoControls } from '../components/VideoControls.js';
import { DynamicQuestionAsker } from '../components/DynamicQuestionAsker.js';
import { LiveEvaluationCard } from '../components/LiveEvaluationCard.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { AskedQuestionRecord, Participant } from '../types/index.js';
import { ListOrdered, CheckCircle2, XCircle } from 'lucide-react';

interface InterviewerDashboardProps {
  roomId: string;
  interviewerName: string;
  candidate: Participant | null;
  activeAskedQuestion: AskedQuestionRecord | null;
  askedQuestions: AskedQuestionRecord[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  remoteAudioMuted: boolean;
  remoteVideoOff: boolean;
  isConnected: boolean;
  candidateLiveSpeech: string;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onAskQuestion: (questionText: string) => void;
  onMarkUnanswered: () => void;
  onEvaluateCandidateAnswer: (answerText: string) => void;
  onEndInterview: () => void;
  startTime: string | null;
}

export const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({
  roomId,
  interviewerName,
  candidate,
  activeAskedQuestion,
  askedQuestions,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoOff,
  remoteAudioMuted,
  remoteVideoOff,
  isConnected,
  candidateLiveSpeech,
  onToggleMic,
  onToggleVideo,
  onLeave,
  onAskQuestion,
  onMarkUnanswered,
  onEvaluateCandidateAnswer,
  onEndInterview,
  startTime,
}) => {
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [elapsedDuration, setElapsedDuration] = useState('00:00');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!startTime) return;
    const startEpoch = new Date(startTime).getTime();

    const interval = setInterval(() => {
      const diffMs = Math.max(0, Date.now() - startEpoch);
      const totalSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      setElapsedDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const matchedAskedQuestions = askedQuestions.filter(q => q.isMatched);

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        role="interviewer"
        isConnected={isConnected}
        interviewDuration={elapsedDuration}
        onLeave={onLeave}
      />

      {/* Main Workstation */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1700px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Video Interface & Asked Question History (7 Cols - Sticky on Desktop) */}
        <section className="lg:col-span-7 flex flex-col space-y-4 lg:sticky lg:top-20 self-start">
          <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] rounded-3xl overflow-hidden bg-surface-900 border border-surface-800/90 shadow-2xl flex items-center justify-center">
            {/* Candidate Video (Large Primary) */}
            <VideoPlayer
              stream={remoteStream}
              name={candidate?.name || 'Candidate'}
              role="candidate"
              isMuted={remoteAudioMuted}
              isVideoOff={remoteVideoOff}
              className="w-full h-full"
              isSpeaking={Boolean(candidateLiveSpeech)}
            />

            {/* Interviewer Self View (Floating PiP in Corner) */}
            <div className="absolute top-4 right-4 w-32 h-24 sm:w-48 sm:h-36 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-surface-700/80 hover:scale-105 transition-transform">
              <VideoPlayer
                stream={localStream}
                name={interviewerName}
                role="interviewer"
                isMuted={isAudioMuted}
                isVideoOff={isVideoOff}
                isLocal={true}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Media & Session Controls */}
          <VideoControls
            isMuted={isAudioMuted}
            isVideoOff={isVideoOff}
            onToggleMic={onToggleMic}
            onToggleVideo={onToggleVideo}
            onLeave={onLeave}
            onEndInterview={() => setIsConfirmEndOpen(true)}
            isInterviewer={true}
            isInterviewStarted={true}
          />

          {/* Asked Questions Session History */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <ListOrdered className="w-4 h-4 text-brand-400" />
                <span>Session Question History ({matchedAskedQuestions.length} Matched)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                {showHistory ? 'Hide List' : 'View List'}
              </button>
            </div>

            {showHistory && (
              <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pt-2 border-t border-surface-800">
                {askedQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No questions asked yet.</p>
                ) : (
                  askedQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-2.5 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 truncate max-w-[80%]">
                        <span className="font-semibold text-white block truncate">
                          #{idx + 1}: "{q.interviewerQuestion}"
                        </span>
                        {q.isMatched ? (
                          <span className="text-[11px] text-emerald-400 truncate block">
                            Matched: {q.matchedQuestion}
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-400 block">
                            No match found
                          </span>
                        )}
                      </div>
                      <div>
                        {q.isMatched ? (
                          <span className="font-mono font-bold text-emerald-400">
                            {q.similarityScore} pts
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-400">
                            Unmatched
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Dynamic Question Asker & Live Answer Evaluation (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          {/* Dynamic Question Asker Panel */}
          <DynamicQuestionAsker
            activeAskedQuestion={activeAskedQuestion}
            onAskQuestion={onAskQuestion}
            onMarkUnanswered={onMarkUnanswered}
          />

          {/* Live Evaluation Card */}
          <LiveEvaluationCard
            activeAskedQuestion={activeAskedQuestion}
            candidateLiveSpeech={candidateLiveSpeech}
            isCandidateSpeaking={Boolean(candidateLiveSpeech)}
            onEvaluateCandidateAnswer={onEvaluateCandidateAnswer}
          />
        </section>
      </main>

      {/* Confirmation Modal for Ending the Interview */}
      <ConfirmModal
        isOpen={isConfirmEndOpen}
        title="End Interview & Generate Report?"
        message="Are you sure you want to conclude this interview? The final report will be calculated using ONLY the questions you actually asked and successfully matched. Unanswered questions will be counted as 0."
        confirmLabel="Yes, End Interview"
        cancelLabel="Continue Interview"
        onConfirm={() => {
          setIsConfirmEndOpen(false);
          onEndInterview();
        }}
        onCancel={() => setIsConfirmEndOpen(false)}
      />
    </div>
  );
};
