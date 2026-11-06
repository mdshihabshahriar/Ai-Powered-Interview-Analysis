import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.js';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoControls } from '../components/VideoControls.js';

interface CandidateInterviewPageProps {
  roomId: string;
  candidateName: string;
  interviewerName: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  remoteAudioMuted: boolean;
  remoteVideoOff: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  startTime: string | null;
}

/**
 * Candidate Interface – Video Only (Requirement 1)
 * The candidate sees ONLY:
 * - Interviewer's live video.
 * - Candidate's own live video.
 * - Microphone mute/unmute button.
 * - Camera on/off button.
 * - Leave Interview button.
 * - Basic connection status.
 *
 * NO questions, NO expected answers, NO question lists, NO evaluation results,
 * NO similarity scores, and NO AI feedback are displayed to the candidate.
 */
export const CandidateInterviewPage: React.FC<CandidateInterviewPageProps> = ({
  roomId,
  candidateName,
  interviewerName,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoOff,
  remoteAudioMuted,
  remoteVideoOff,
  isConnected,
  isSpeaking,
  onToggleMic,
  onToggleVideo,
  onLeave,
  startTime,
}) => {
  const [elapsedDuration, setElapsedDuration] = useState('00:00');

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

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between">
      {/* Top Navbar with Room Code & Connection Status */}
      <Navbar
        roomId={roomId}
        role="candidate"
        candidateName={candidateName}
        isConnected={isConnected}
        interviewDuration={elapsedDuration}
        onLeave={onLeave}
      />

      {/* Main Video-Only Stage (Large Full-Width Experience) */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full flex flex-col justify-center items-center">
        <div className="relative w-full h-[65vh] sm:h-[72vh] rounded-3xl overflow-hidden bg-surface-900 border border-surface-800/90 shadow-2xl flex items-center justify-center">
          {/* Interviewer Live Video (Large Primary) */}
          <VideoPlayer
            stream={remoteStream}
            name={interviewerName || 'Interviewer'}
            role="interviewer"
            isMuted={remoteAudioMuted}
            isVideoOff={remoteVideoOff}
            className="w-full h-full"
          />

          {/* Candidate Self View (Floating Picture-in-Picture in Corner) */}
          <div className="absolute top-4 right-4 w-36 h-28 sm:w-56 sm:h-40 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-surface-700/80 hover:scale-105 transition-transform">
            <VideoPlayer
              stream={localStream}
              name={candidateName}
              role="candidate"
              isMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isLocal={true}
              className="w-full h-full"
              isSpeaking={isSpeaking}
            />
          </div>
        </div>

        {/* Video Controls: Mute/Unmute Mic, Video On/Off, Leave */}
        <div className="mt-5 w-full flex justify-center">
          <VideoControls
            isMuted={isAudioMuted}
            isVideoOff={isVideoOff}
            onToggleMic={onToggleMic}
            onToggleVideo={onToggleVideo}
            onLeave={onLeave}
            isInterviewer={false}
          />
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-2.5 px-6 text-center text-xs text-slate-500 border-t border-surface-800/60">
        Live Technical Interview Session • WebRTC Real-Time Encrypted Media
      </footer>
    </div>
  );
};
