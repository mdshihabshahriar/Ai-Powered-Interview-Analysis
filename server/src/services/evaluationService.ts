import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InterviewQuestion, AskedQuestionRecord } from '../types/index.js';
import {
  evaluateWithNLP,
  isGreeting,
  isUnknownAnswer,
  filterGreetingsAndConversation,
  findBestMatchingQuestion,
  QuestionMatchResult,
} from './nlpEvaluator.js';
import { evaluateWithGemini } from './geminiEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsFilePath = path.resolve(__dirname, '../../data/interview-questions.json');

let questionsCache: InterviewQuestion[] = [];

export function loadQuestions(): InterviewQuestion[] {
  if (questionsCache.length > 0) return questionsCache;
  try {
    const rawData = fs.readFileSync(questionsFilePath, 'utf-8');
    questionsCache = JSON.parse(rawData);
    console.log(`[EvaluationService] Successfully loaded ${questionsCache.length} predefined interview questions.`);
  } catch (err) {
    console.error(`[EvaluationService] Error reading interview questions from ${questionsFilePath}:`, err);
    questionsCache = [];
  }
  return questionsCache;
}

export function getAllQuestions(): InterviewQuestion[] {
  return loadQuestions();
}

export function getQuestionById(id: number): InterviewQuestion | undefined {
  return loadQuestions().find(q => q.id === id);
}

/**
 * Matches an interviewer's question against the predefined questions dataset.
 */
export function matchQuestion(interviewerQuestion: string, threshold: number = 38): QuestionMatchResult {
  const allQuestions = getAllQuestions();
  return findBestMatchingQuestion(interviewerQuestion, allQuestions, threshold);
}

export interface EvaluationOutcome {
  isGreeting: boolean;
  evaluatedRecord?: Partial<AskedQuestionRecord>;
}

export async function evaluateAnswerForRecord(
  record: AskedQuestionRecord,
  candidateAnswer: string
): Promise<EvaluationOutcome> {
  const rawTrimmed = candidateAnswer.trim();

  // 1. Filter ordinary greetings and conversational preamble
  // E.g. "Hello, I am fine. JavaScript is a programming language..." -> "JavaScript is a programming language..."
  const { cleanedAnswer, isPureGreeting } = filterGreetingsAndConversation(rawTrimmed);
  if (isPureGreeting || !cleanedAnswer) {
    return {
      isGreeting: true,
    };
  }

  // 2. Detect "I don't know" or unknown expressions on the cleaned response
  if (isUnknownAnswer(cleanedAnswer)) {
    return {
      isGreeting: false,
      evaluatedRecord: {
        candidateAnswer: cleanedAnswer,
        similarityScore: 0,
        evaluationStatus: 'Not Answered',
        aiFeedback: 'Candidate indicated they do not know the answer or passed on this question.',
        matchedConcepts: [],
        missingConcepts: record.matchedKeywords,
        isUnknownResponse: true,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }

  // 3. AI / NLP Semantic Evaluation against matched expected answer using the cleaned answer
  const expectedAnswer = record.matchedExpectedAnswer || '';
  const keywords = record.matchedKeywords || [];

  let evalResult = await evaluateWithGemini(
    record.matchedQuestion || record.interviewerQuestion,
    expectedAnswer,
    cleanedAnswer,
    keywords
  );

  if (!evalResult) {
    evalResult = evaluateWithNLP(cleanedAnswer, expectedAnswer, keywords);
  }

  return {
    isGreeting: false,
    evaluatedRecord: {
      candidateAnswer: cleanedAnswer,
      similarityScore: evalResult.score,
      evaluationStatus: evalResult.status,
      aiFeedback: evalResult.feedback,
      matchedConcepts: evalResult.matchedKeywords,
      missingConcepts: evalResult.missingKeywords,
      isUnknownResponse: evalResult.isUnknownResponse,
      evaluatedAt: new Date().toISOString(),
    },
  };
}

export function createUnansweredAskedRecord(record: AskedQuestionRecord): Partial<AskedQuestionRecord> {
  return {
    candidateAnswer: 'Not Answered',
    similarityScore: 0,
    evaluationStatus: 'Not Answered',
    aiFeedback: 'Question was marked as unanswered or timed out with no response.',
    matchedConcepts: [],
    missingConcepts: record.matchedKeywords,
    isUnknownResponse: true,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates interview summary strictly based on asked & matched questions according to spec:
 * Formula: Overall Score = Sum of Scores of Asked and Matched Questions / Total Number of Asked and Matched Questions
 */
export function calculateAskedQuestionsSummary(askedQuestions: AskedQuestionRecord[]) {
  const totalQuestionsAsked = askedQuestions.length;
  const matchedRecords = askedQuestions.filter(q => q.isMatched);
  const successfullyMatchedQuestions = matchedRecords.length;

  let scoreSum = 0;
  let answeredCount = 0;

  for (const q of matchedRecords) {
    scoreSum += q.similarityScore;
    if (q.similarityScore > 0 && !q.isUnknownResponse) {
      answeredCount++;
    }
  }

  const unansweredCount = successfullyMatchedQuestions - answeredCount;
  const overallScore = successfullyMatchedQuestions > 0
    ? Math.round((scoreSum / successfullyMatchedQuestions) * 10) / 10
    : 0;

  const averageAnsweredScore = answeredCount > 0
    ? Math.round((scoreSum / answeredCount) * 10) / 10
    : 0;

  return {
    totalQuestionsAsked,
    successfullyMatchedQuestions,
    answeredCount,
    unansweredCount,
    overallScore,
    averageAnsweredScore,
  };
}
