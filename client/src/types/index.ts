export type Role = 'interviewer' | 'candidate';

export type EvaluationStatus =
  | 'Excellent'
  | 'Good'
  | 'Partially Correct'
  | 'Weak'
  | 'Mostly Incorrect'
  | 'Not Answered'
  | 'Needs Review';

export interface InterviewQuestion {
  id: number;
  category: string;
  question: string;
  expectedAnswer?: string;
  keywords?: string[];
}

export interface EvaluationResult {
  questionId: number;
  category: string;
  question: string;
  expectedAnswer: string;
  candidateAnswer: string;
  similarityScore: number;
  evaluationStatus: EvaluationStatus;
  aiFeedback: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  evaluatedAt: string;
  isUnknownResponse?: boolean;
}

export interface AskedQuestionRecord {
  id: string;
  interviewerQuestion: string; // Original question entered by interviewer
  matchedQuestionId: number | null;
  matchedQuestion: string | null; // Question text from JSON dataset
  matchedCategory: string | null;
  matchedExpectedAnswer: string | null;
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
  role: Role;
  audioMuted: boolean;
  videoOff: boolean;
  joinedAt: string;
}

export interface Room {
  id: string;
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

export interface InterviewSummary {
  totalQuestionsAsked: number;
  successfullyMatchedQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  overallScore: number;
  averageAnsweredScore: number;
}

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
