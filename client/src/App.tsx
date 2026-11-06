import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './context/SocketContext.js';
import { useWebRTC } from './hooks/useWebRTC.js';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { LandingPage } from './pages/LandingPage.js';
import { InterviewerLobbyPage } from './pages/InterviewerLobbyPage.js';
import { CandidateJoinPage } from './pages/CandidateJoinPage.js';
import { WaitingRoomPage } from './pages/WaitingRoomPage.js';
import { InterviewerDashboard } from './pages/InterviewerDashboard.js';
import { CandidateInterviewPage } from './pages/CandidateInterviewPage.js';
import { CandidateEndedScreen } from './pages/CandidateEndedScreen.js';
import { ResultDashboard } from './pages/ResultDashboard.js';
import {
  Role,
  AskedQuestionRecord,
  Participant,
  InterviewSummary,
} from './types/index.js';
import { getApiUrl } from './utils/api.js';

type PageState =
  | 'landing'
  | 'interviewer_lobby'
  | 'candidate_join'
  | 'waiting_room'
  | 'interviewer_dashboard'
  | 'candidate_interview'
  | 'candidate_ended'
  | 'results';

export function App() {
  const { socket, isConnected } = useSocket();

  // App Navigation & Session State
  const [currentPage, setCurrentPage] = useState<PageState>('landing');
  const [role, setRole] = useState<Role>('interviewer');
  const [roomId, setRoomId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [candidate, setCandidate] = useState<Participant | null>(null);
  const [interviewer, setInterviewer] = useState<Participant | null>(null);

  // Dynamic Asked Questions & Evaluation State
  const [activeAskedQuestion, setActiveAskedQuestion] = useState<AskedQuestionRecord | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<AskedQuestionRecord[]>([]);
  const [summary, setSummary] = useState<InterviewSummary>({
    totalQuestionsAsked: 0,
    successfullyMatchedQuestions: 0,
    answeredCount: 0,
    unansweredCount: 0,
    overallScore: 0,
    averageAnsweredScore: 0,
  });

  // Candidate Live Transcription (streamed to interviewer)
  const [candidateLiveSpeech, setCandidateLiveSpeech] = useState<string>('');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
  ]);

  // WebRTC Hook
  const remoteSocketId = role === 'interviewer' ? candidate?.socketId : interviewer?.socketId;
  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    remoteAudioMuted,
    remoteVideoOff,
    permissionError,
    initLocalMedia,
    toggleAudio,
    toggleVideo,
    stopAllMedia,
  } = useWebRTC({
    socket,
    roomId,
    role,
    remoteSocketId,
    iceServers,
  });

  // Handle final answer from candidate speech recognition
  const handleFinalAnswer = useCallback((answerText: string) => {
    if (socket && roomId && answerText.trim()) {
      socket.emit('candidate:submit-answer', {
        roomId,
        answerText: answerText.trim(),
      });
    }
  }, [socket, roomId]);

  // Candidate Speech Recognition Hook:
  // Active ONLY during live call as candidate AND when microphone is NOT muted!
  const isCandidateInterviewing =
    role === 'candidate' && currentPage === 'candidate_interview' && !isAudioMuted;
  const {
    isListening: isSpeechListening,
    transcript: finalSpeechText,
    interimText,
    resetTranscript,
    stopListening,
  } = useSpeechRecognition({
    socket,
    roomId,
    isActive: isCandidateInterviewing,
    onFinalAnswer: handleFinalAnswer,
  });

  // Open video camera & microphone ONLY when actually in the live call (not before!)
  useEffect(() => {
    const isCallActive =
      currentPage === 'interviewer_dashboard' || currentPage === 'candidate_interview';
    if (isCallActive && !localStream) {
      console.log('[App] Entered live call -> activating camera & microphone now');
      initLocalMedia();
    }
  }, [currentPage, localStream, initLocalMedia]);

  // Check URL params on load (for invite link e.g. ?room=INT-XXXX&role=candidate)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');

    if (roomParam) {
      setRoomId(roomParam.toUpperCase());
      if (roleParam === 'candidate') {
        setRole('candidate');
        setCurrentPage('candidate_join');
      }
    }
  }, []);

  // Socket Events Setup
  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data: any) => {
      console.log('[App] Room joined:', data);
      if (data.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        setIceServers(data.iceServers);
      }
      if (data.role === 'interviewer') {
        if (data.room?.candidate) setCandidate(data.room.candidate);
        if (data.room?.startedAt) setStartTime(data.room.startedAt);
        if (data.activeAskedQuestion) setActiveAskedQuestion(data.activeAskedQuestion);
        if (data.askedQuestions) setAskedQuestions(data.askedQuestions);
        if (data.room?.status === 'in_progress') {
          setCurrentPage('interviewer_dashboard');
        } else {
          setCurrentPage('interviewer_lobby');
        }
      } else {
        // Candidate joined: gets sanitized room with NO question/eval data
        if (data.room?.interviewerName) {
          setInterviewer({
            socketId: data.room.interviewerSocketId || '',
            name: data.room.interviewerName,
            role: 'interviewer',
            audioMuted: false,
            videoOff: false,
            joinedAt: '',
          });
        }
        if (data.room?.status === 'in_progress') {
          setStartTime(data.room?.startedAt);
          setCurrentPage('candidate_interview');
        } else {
          setCurrentPage('waiting_room');
        }
      }
    };

    const handlePeerJoined = (peer: any) => {
      console.log('[App] Peer joined:', peer);
      if (peer.role === 'candidate') {
        setCandidate({
          socketId: peer.socketId,
          name: peer.name,
          role: 'candidate',
          audioMuted: false,
          videoOff: false,
          joinedAt: new Date().toISOString(),
        });
      } else {
        setInterviewer({
          socketId: peer.socketId,
          name: peer.name,
          role: 'interviewer',
          audioMuted: false,
          videoOff: false,
          joinedAt: new Date().toISOString(),
        });
      }
    };

    const handlePeersReady = (data: any) => {
      console.log('[App] Peers ready:', data);
      if (data.candidate) {
        setCandidate((prev) => ({
          socketId: data.candidate.socketId,
          name: data.candidate.name || prev?.name || 'Candidate',
          role: 'candidate',
          audioMuted: prev?.audioMuted || false,
          videoOff: prev?.videoOff || false,
          joinedAt: prev?.joinedAt || new Date().toISOString(),
        }));
      }
      if (data.interviewer) {
        setInterviewer((prev) => ({
          socketId: data.interviewer.socketId,
          name: data.interviewer.name || prev?.name || 'Interviewer',
          role: 'interviewer',
          audioMuted: prev?.audioMuted || false,
          videoOff: prev?.videoOff || false,
          joinedAt: prev?.joinedAt || new Date().toISOString(),
        }));
      }
    };

    const handleInterviewStarted = (data: any) => {
      console.log('[App] Interview started:', data);
      setStartTime(data.startedAt);
      if (role === 'interviewer') {
        setCurrentPage('interviewer_dashboard');
      } else {
        setCurrentPage('candidate_interview');
      }
    };

    // Question successfully matched
    const handleQuestionMatched = (data: any) => {
      console.log('[App] Question matched:', data.record);
      setActiveAskedQuestion(data.record);
      if (data.askedQuestions) setAskedQuestions(data.askedQuestions);
      setCandidateLiveSpeech('');
      resetTranscript();
    };

    // Question match failed ("No Matching Question Found")
    const handleQuestionMatchFailed = (data: any) => {
      console.log('[App] Question match failed:', data);
      setActiveAskedQuestion(data.record);
      if (data.askedQuestions) setAskedQuestions(data.askedQuestions);
    };

    // Candidate live speech stream to interviewer
    const handleCandidateSpeechStream = (data: any) => {
      setCandidateLiveSpeech(data.text);
    };

    // Evaluation result (for interviewer only)
    const handleEvaluationResult = (data: any) => {
      console.log('[App] Evaluation result:', data.record);
      if (data.record) {
        setActiveAskedQuestion(data.record);
      }
      if (data.askedQuestions) {
        setAskedQuestions(data.askedQuestions);
      }
      if (data.summary) {
        setSummary(data.summary);
      }
    };

    // Interview ended
    const handleInterviewEnded = (data: any) => {
      console.log('[App] Interview ended:', data);
      setEndedAt(data.endedAt);
      if (data.summary) setSummary(data.summary);

      // Stop speech recognition for candidate
      if (role === 'candidate') {
        stopListening();
        stopAllMedia();
        setCurrentPage('candidate_ended');
      } else {
        // Interviewer goes to results
        stopAllMedia();
        setCurrentPage('results');
      }
    };

    const handleFinalReport = (data: any) => {
      if (data.askedQuestions) setAskedQuestions(data.askedQuestions);
      if (data.summary) setSummary(data.summary);
    };

    socket.on('room:joined', handleRoomJoined);
    socket.on('peer:joined', handlePeerJoined);
    socket.on('room:peers-ready', handlePeersReady);
    socket.on('interview:started', handleInterviewStarted);
    socket.on('question:matched', handleQuestionMatched);
    socket.on('question:match-failed', handleQuestionMatchFailed);
    socket.on('candidate:speech-stream', handleCandidateSpeechStream);
    socket.on('evaluation:result', handleEvaluationResult);
    socket.on('interview:ended', handleInterviewEnded);
    socket.on('interview:final-report', handleFinalReport);

    return () => {
      socket.off('room:joined', handleRoomJoined);
      socket.off('peer:joined', handlePeerJoined);
      socket.off('room:peers-ready', handlePeersReady);
      socket.off('interview:started', handleInterviewStarted);
      socket.off('question:matched', handleQuestionMatched);
      socket.off('question:match-failed', handleQuestionMatchFailed);
      socket.off('candidate:speech-stream', handleCandidateSpeechStream);
      socket.off('evaluation:result', handleEvaluationResult);
      socket.off('interview:ended', handleInterviewEnded);
      socket.off('interview:final-report', handleFinalReport);
    };
  }, [socket, role, resetTranscript, stopListening]);

  // Actions
  const handleJoinAsInterviewer = async () => {
    setIsCreatingRoom(true);
    try {
      const res = await fetch(getApiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerName: 'Interviewer' }),
      });
      const data = await res.json();

      if (data.success && data.roomId) {
        setRoomId(data.roomId);
        setRole('interviewer');
        setUserName('Interviewer');

        if (socket) {
          socket.emit('room:join', {
            roomId: data.roomId,
            name: 'Interviewer',
            role: 'interviewer',
          });
        }
      }
    } catch (err) {
      console.error('Error creating room:', err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleCandidateJoin = (inputRoomId: string, inputName: string) => {
    setRoomId(inputRoomId);
    setUserName(inputName);
    setRole('candidate');

    if (socket) {
      socket.emit('room:join', {
        roomId: inputRoomId,
        name: inputName,
        role: 'candidate',
      });
    }
  };

  const handleStartInterview = () => {
    if (socket && roomId) {
      socket.emit('interview:start', { roomId });
    }
  };

  // Dynamic Question Ask (Requirement 2 & 3)
  const handleAskQuestion = (questionText: string) => {
    if (socket && roomId) {
      socket.emit('question:ask', { roomId, questionText });
    }
  };

  // Mark active question as unanswered (Requirement 5 & 6)
  const handleMarkUnanswered = () => {
    if (socket && roomId) {
      socket.emit('question:mark-unanswered', { roomId });
    }
  };

  // Evaluate candidate answer manually from interviewer dashboard
  const handleEvaluateCandidateAnswer = (answerText: string) => {
    if (socket && roomId && answerText.trim()) {
      socket.emit('candidate:submit-answer', {
        roomId,
        answerText: answerText.trim(),
      });
    }
  };

  const handleEndInterview = () => {
    if (socket && roomId) {
      socket.emit('interview:end', { roomId });
    }
  };

  const handleLeaveRoom = () => {
    stopAllMedia();
    window.location.href = window.location.origin;
  };

  // isSpeaking: true when candidate has accumulated speech text
  const isSpeaking = isSpeechListening && Boolean(finalSpeechText || interimText);

  return (
    <div className="font-sans antialiased text-slate-100 bg-surface-950 min-h-screen">
      {currentPage === 'landing' && (
        <LandingPage
          onJoinAsInterviewer={handleJoinAsInterviewer}
          onJoinAsCandidate={() => setCurrentPage('candidate_join')}
          isCreatingRoom={isCreatingRoom}
        />
      )}

      {currentPage === 'interviewer_lobby' && (
        <InterviewerLobbyPage
          roomId={roomId}
          interviewerName={userName}
          candidate={candidate}
          onStartInterview={handleStartInterview}
        />
      )}

      {currentPage === 'candidate_join' && (
        <CandidateJoinPage
          initialRoomId={roomId}
          onJoin={handleCandidateJoin}
          onBack={() => setCurrentPage('landing')}
        />
      )}

      {currentPage === 'waiting_room' && (
        <WaitingRoomPage
          roomId={roomId}
          candidateName={userName}
          interviewerName={interviewer?.name || null}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentPage === 'interviewer_dashboard' && (
        <InterviewerDashboard
          roomId={roomId}
          interviewerName={userName}
          candidate={candidate}
          activeAskedQuestion={activeAskedQuestion}
          askedQuestions={askedQuestions}
          localStream={localStream}
          remoteStream={remoteStream}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          remoteAudioMuted={remoteAudioMuted}
          remoteVideoOff={remoteVideoOff}
          isConnected={isConnected}
          candidateLiveSpeech={candidateLiveSpeech}
          onToggleMic={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeave={handleLeaveRoom}
          onAskQuestion={handleAskQuestion}
          onMarkUnanswered={handleMarkUnanswered}
          onEvaluateCandidateAnswer={handleEvaluateCandidateAnswer}
          onEndInterview={handleEndInterview}
          startTime={startTime}
        />
      )}

      {/* Candidate Live Interview: Video Only (Requirement 1) */}
      {currentPage === 'candidate_interview' && (
        <CandidateInterviewPage
          roomId={roomId}
          candidateName={userName}
          interviewerName={interviewer?.name || null}
          localStream={localStream}
          remoteStream={remoteStream}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          remoteAudioMuted={remoteAudioMuted}
          remoteVideoOff={remoteVideoOff}
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          onToggleMic={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeave={handleLeaveRoom}
          startTime={startTime}
        />
      )}

      {/* Candidate End Screen: shown when interviewer ends the interview */}
      {currentPage === 'candidate_ended' && (
        <CandidateEndedScreen
          candidateName={userName}
          roomId={roomId}
          onExit={handleLeaveRoom}
        />
      )}

      {currentPage === 'results' && (
        <ResultDashboard
          roomId={roomId}
          candidateName={candidate?.name || userName || 'Candidate'}
          interviewerName={interviewer?.name || 'Interviewer'}
          askedQuestions={askedQuestions}
          summary={summary}
          startedAt={startTime}
          endedAt={endedAt}
          onRestart={handleLeaveRoom}
          role={role}
        />
      )}
    </div>
  );
}
