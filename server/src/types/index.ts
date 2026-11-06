export interface InterviewQuestion {
  id: number;
  category: string;
  question: string;
  expectedAnswer: string;
  keywords: string[];
}

export type EvaluationStatus =
  | 'Excellent'
  | 'Good'
  | 'Partially Correct'
  | 'Weak'
  | 'Mostly Incorrect'
  | 'Not Answered'
  | 'Needs Review';

export interface AskedQuestionRecord {
  id: string; // e.g. "ask-1"
  interviewerQuestion: string; // Original question entered by interviewer
  matchedQuestionId: number | null; // ID in interview-questions.json
  matchedQuestion: string | null; // Text from JSON dataset
  matchedCategory: string | null; // Category from JSON dataset
  matchedExpectedAnswer: string | null; // Expected answer from JSON dataset
  matchedKeywords: string[];
  matchConfidence: number; // 0 to 100
  isMatched: boolean;
  matchFailureReason?: string;
  candidateAnswer: string;
  similarityScore: number; // 0 to 100
  evaluationStatus: EvaluationStatus;
  aiFeedback: string;
  matchedConcepts: string[];
  missingConcepts: string[];
  isUnknownResponse?: boolean;
  askedAt: string;
  evaluatedAt: string | null;
}

export interface Participant {
  socketId: string;
  name: string;
  role: 'interviewer' | 'candidate';
  audioMuted: boolean;
  videoOff: boolean;
  joinedAt: string;
}

export interface Room {
  id: string; // e.g. INT-8X92K
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: 'waiting' | 'in_progress' | 'completed';
  interviewer: Participant | null;
  candidate: Participant | null;
  activeAskedQuestionId: string | null;
  askedQuestions: AskedQuestionRecord[];
  overallScore: number | null;
}

export interface SanitizedRoomForCandidate {
  id: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: 'waiting' | 'in_progress' | 'completed';
  interviewerName: string | null;
  interviewerSocketId: string | null;
  candidateName: string | null;
  // NOTE: Candidate must NOT receive any question or answer data!
}
