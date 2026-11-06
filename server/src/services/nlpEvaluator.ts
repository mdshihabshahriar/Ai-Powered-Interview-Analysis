import { EvaluationStatus, InterviewQuestion } from '../types/index.js';

const GREETING_WORDS = new Set([
  'hi', 'hello', 'hey', 'morning', 'afternoon', 'evening',
  'greetings', 'welcome', 'thanks', 'thank', 'you', 'bye',
  'goodbye', 'okay', 'ok', 'yes', 'yeah', 'yep', 'nope',
  'audible', 'hear', 'testing', 'ready', 'fine', 'great'
]);

const GREETING_PATTERNS = [
  /\b(hi|hello|hey)\b/i,
  /\bgood (morning|afternoon|evening|day)\b/i,
  /\bhow are you\b/i,
  /\bhow are you doing\b/i,
  /\bnice to meet you\b/i,
  /\bglad to meet you\b/i,
  /\bcan you hear me\b/i,
  /\bam i audible\b/i,
  /\bthank(s| you)\b/i,
  /\bi am ready\b/i,
  /\byes i can hear\b/i
];

const UNKNOWN_PATTERNS = [
  /i\s+(do\s+not|don'?t)\s+know/i,
  /i\s+have\s+no\s+idea/i,
  /\bno\s+idea\b/i,
  /\bno\s+clue\b/i,
  /i('?m| am)\s+not\s+(quite\s+)?sure/i,
  /not\s+sure\s+about/i,
  /i\s+(can\s*not|can'?t)\s+answer/i,
  /sorry[,\s]+(i\s+)?(don'?t|do\s+not)\s+know/i,
  /haven'?t\s+learned/i,
  /have\s+not\s+learned/i,
  /not\s+familiar\s+with/i,
  /never\s+used\s+this/i,
  /never\s+heard\s+of/i,
  /skip\s+this/i,
  /pass\s+on\s+this/i,
  /\bpass\b/i,
  /i\s+forgot/i,
  /don'?t\s+remember/i,
  /can'?t\s+recall/i,
  /cannot\s+recall/i
];

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves', 'can', 'explain', 'tell', 'describe', 'give', 'practical'
]);

const TECH_SYNONYMS: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'db': 'database',
  'vdom': 'virtual dom',
  'apis': 'api',
  'nosql': 'nosql',
  'sql': 'sql',
  'redis': 'redis',
  'webrtc': 'webrtc',
};

function normalizeWord(word: string): string {
  let w = word.toLowerCase();
  if (TECH_SYNONYMS[w]) return TECH_SYNONYMS[w];
  if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);
  return w;
}

export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return cleanText(text)
    .split(/\s+/)
    .map(normalizeWord)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function getNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

export function isGreeting(text: string): boolean {
  const cleaned = cleanText(text);
  if (!cleaned) return true;
  if (cleaned.length < 2) return true;

  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(cleaned)) {
      const words = cleaned.split(/\s+/);
      if (words.length <= 8) return true;
      const greetingWordCount = words.filter(w => GREETING_WORDS.has(w)).length;
      if (greetingWordCount / words.length >= 0.5) return true;
    }
  }
  return false;
}

/**
 * Filter greetings and casual conversational segments at the beginning or edges of responses
 * while preserving genuine technical answer content.
 * 
 * E.g.: "Hello, I am fine. JavaScript is a programming language used to make websites interactive."
 * -> returns cleanedAnswer: "JavaScript is a programming language used to make websites interactive."
 */
export function filterGreetingsAndConversation(rawAnswer: string): { cleanedAnswer: string; isPureGreeting: boolean } {
  if (!rawAnswer || !rawAnswer.trim()) {
    return { cleanedAnswer: '', isPureGreeting: false };
  }

  let text = rawAnswer.trim();

  // Pattern matching conversational openings / pleasantries
  const PREAMBLE_PATTERNS = [
    /^(?:hello|hi|hey|good\s+(?:morning|afternoon|evening|day))[,\s!.-]*/i,
    /^(?:how\s+are\s+you(?:\s+doing)?|how('?s|\s+is)\s+it\s+going)[,\s!.-]*/i,
    /^(?:i('?m|\s+am)\s+(?:fine|good|doing\s+well|great))[,\s!.-]*/i,
    /^(?:thank\s+you|thanks(?:\s+for\s+the\s+question|\s+a\s+lot)?)[,\s!.-]*/i,
    /^(?:nice\s+to\s+meet\s+you|glad\s+to\s+be\s+here)[,\s!.-]*/i,
    /^(?:yes|yeah|yep|can\s+you\s+hear\s+me|am\s+i\s+audible|i\s+can\s+hear\s+you)[,\s!.-]*/i,
    /^(?:sure|okay|ok|well|so|alright|basically)[,\s!.-]*/i,
    /^(?:to\s+answer\s+your\s+question|as\s+for\s+your\s+question)[,\s!.-]*/i,
  ];

  let modified = true;
  while (modified && text.length > 0) {
    modified = false;
    for (const pattern of PREAMBLE_PATTERNS) {
      if (pattern.test(text)) {
        const next = text.replace(pattern, '').trim();
        if (next !== text) {
          text = next;
          modified = true;
        }
      }
    }
  }

  // Remove trailing pleasantries like "thank you very much"
  text = text.replace(/\s*(?:thank\s+you(?:\s+very\s+much)?|thanks(?:\s+a\s+lot)?|that('?s|\s+is)\s+all(?:,\s*thanks)?)[.!]?\s*$/i, '').trim();

  // If after stripping greetings nothing or very few words remain
  if (!text || text.length < 2) {
    return { cleanedAnswer: '', isPureGreeting: true };
  }

  // Check if what remains is purely a greeting
  if (isGreeting(text)) {
    return { cleanedAnswer: '', isPureGreeting: true };
  }

  // Capitalize first letter of cleaned answer
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return { cleanedAnswer: capitalized, isPureGreeting: false };
}

export function isUnknownAnswer(text: string): boolean {
  const cleaned = cleanText(text);
  if (!cleaned) return true;

  for (const pattern of UNKNOWN_PATTERNS) {
    if (pattern.test(cleaned)) {
      return true;
    }
  }
  return false;
}

function calculateCosineSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const freq1: Record<string, number> = {};
  const freq2: Record<string, number> = {};
  const allWords = new Set<string>();

  for (const t of tokens1) {
    freq1[t] = (freq1[t] || 0) + 1;
    allWords.add(t);
  }
  for (const t of tokens2) {
    freq2[t] = (freq2[t] || 0) + 1;
    allWords.add(t);
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const word of allWords) {
    const v1 = freq1[word] || 0;
    const v2 = freq2[word] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Intelligent Semantic Question Matcher
 * Compares an interviewer's question against the predefined JSON questions dataset.
 */
export interface QuestionMatchResult {
  isMatched: boolean;
  matchedQuestion: InterviewQuestion | null;
  confidence: number; // 0 to 100
  reason?: string;
}

export function findBestMatchingQuestion(
  interviewerQuestion: string,
  dataset: InterviewQuestion[],
  threshold: number = 32 // Minimum confidence % to consider a match
): QuestionMatchResult {
  const cleanInput = cleanText(interviewerQuestion);
  const inputTokens = tokenize(cleanInput);

  if (inputTokens.length === 0) {
    return {
      isMatched: false,
      matchedQuestion: null,
      confidence: 0,
      reason: 'Question is too short or contains no searchable keywords.',
    };
  }

  let bestMatch: InterviewQuestion | null = null;
  let highestConfidence = 0;

  for (const q of dataset) {
    const cleanQ = cleanText(q.question);
    const qTokens = tokenize(cleanQ);

    // Direct match
    if (cleanInput === cleanQ) {
      return {
        isMatched: true,
        matchedQuestion: q,
        confidence: 100,
      };
    }

    // Keyword & concept hits
    let keywordHits = 0;
    for (const kw of q.keywords) {
      const cleanKw = cleanText(kw);
      const kwTokens = tokenize(cleanKw);
      if (cleanInput.includes(cleanKw)) {
        keywordHits += 2.0;
      } else if (kwTokens.some(p => inputTokens.includes(p))) {
        keywordHits += 1.2;
      }
    }

    // Direct word matches in question title
    let commonTitleTokens = 0;
    for (const t of qTokens) {
      if (inputTokens.includes(t)) {
        commonTitleTokens += (t.length > 4 ? 1.5 : 1.0);
      }
    }

    const setInput = new Set(inputTokens);
    const setQ = new Set(qTokens);
    let titleIntersection = 0;
    for (const item of setInput) {
      if (setQ.has(item)) titleIntersection++;
    }
    const titleJaccard = (setInput.size + setQ.size - titleIntersection) > 0
      ? titleIntersection / (setInput.size + setQ.size - titleIntersection)
      : 0;

    const keywordRatio = q.keywords.length > 0 ? Math.min(1.2, keywordHits / q.keywords.length) : 0;
    const cosineSim = calculateCosineSimilarity(inputTokens, qTokens);

    const composite = (titleJaccard * 0.35) + (keywordRatio * 0.35) + (cosineSim * 0.20) + (Math.min(1, commonTitleTokens / 3) * 0.10);
    const confidence = Math.round(Math.min(100, composite * 130));

    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestMatch = q;
    }
  }

  if (highestConfidence >= threshold && bestMatch) {
    return {
      isMatched: true,
      matchedQuestion: bestMatch,
      confidence: highestConfidence,
    };
  }

  return {
    isMatched: false,
    matchedQuestion: null,
    confidence: highestConfidence,
    reason: `Confidence (${highestConfidence}%) is below minimum threshold (${threshold}%).`,
  };
}

export interface NlpEvaluationResult {
  score: number;
  status: EvaluationStatus;
  feedback: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  isUnknownResponse?: boolean;
}

export function evaluateWithNLP(
  candidateAnswer: string,
  expectedAnswer: string,
  keywords: string[] = []
): NlpEvaluationResult {
  const trimmed = candidateAnswer.trim();

  // 1. Empty check
  if (!trimmed) {
    return {
      score: 0,
      status: 'Not Answered',
      feedback: 'No response was provided for this question.',
      matchedKeywords: [],
      missingKeywords: keywords,
      isUnknownResponse: true,
    };
  }

  // 2. Unknown response check
  if (isUnknownAnswer(trimmed)) {
    return {
      score: 0,
      status: 'Not Answered',
      feedback: 'Candidate indicated they do not know the answer or passed on this question.',
      matchedKeywords: [],
      missingKeywords: keywords,
      isUnknownResponse: true,
    };
  }

  const candidateClean = cleanText(trimmed);
  const expectedClean = cleanText(expectedAnswer);

  const candidateTokens = tokenize(candidateClean);
  const expectedTokens = tokenize(expectedClean);

  if (candidateTokens.length === 0) {
    return {
      score: 10,
      status: 'Mostly Incorrect',
      feedback: 'The answer lacked substantive technical explanation or content.',
      matchedKeywords: [],
      missingKeywords: keywords,
    };
  }

  // 3. Keyword analysis
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of keywords) {
    const cleanKw = cleanText(kw);
    if (candidateClean.includes(cleanKw)) {
      matchedKeywords.push(kw);
    } else {
      const kwTokens = tokenize(cleanKw);
      const allFound = kwTokens.length > 0 && kwTokens.every(kwt => 
        candidateTokens.some(ct => ct.includes(kwt) || kwt.includes(ct))
      );
      if (allFound) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }
  }

  const keywordCoverage = keywords.length > 0 
    ? matchedKeywords.length / keywords.length 
    : 0.5;

  // 4. Token & Cosine similarity
  const cosineSim = calculateCosineSimilarity(candidateTokens, expectedTokens);

  // 5. N-gram overlaps
  const candBi = getNgrams(candidateTokens, 2);
  const expBi = getNgrams(expectedTokens, 2);
  let biOverlap = 0;
  for (const bi of candBi) {
    if (expBi.has(bi)) biOverlap++;
  }
  const bigramSim = (candBi.size + expBi.size) > 0 ? (2 * biOverlap) / (candBi.size + expBi.size) : 0;

  // 6. Token overlap ratio (Jaccard)
  const candSet = new Set(candidateTokens);
  const expSet = new Set(expectedTokens);
  let intersectionCount = 0;
  for (const t of candSet) {
    if (expSet.has(t)) intersectionCount++;
  }
  const jaccardSim = (candSet.size + expSet.size - intersectionCount) > 0
    ? intersectionCount / (candSet.size + expSet.size - intersectionCount)
    : 0;

  // 7. Composite Score Calculation
  let rawScore = (keywordCoverage * 0.45) + (cosineSim * 0.30) + (bigramSim * 0.15) + (jaccardSim * 0.10);

  let calculatedScore = Math.round(Math.min(100, Math.pow(rawScore, 0.72) * 115));

  if (keywordCoverage >= 0.75 && calculatedScore < 85) {
    calculatedScore = Math.max(85, calculatedScore);
  }
  if (keywordCoverage >= 0.90 && calculatedScore < 92) {
    calculatedScore = Math.max(92, calculatedScore);
  }

  if (candidateTokens.length < 4 && calculatedScore > 45) {
    calculatedScore = 40;
  } else if (candidateTokens.length < 7 && calculatedScore > 75) {
    calculatedScore = 70;
  }

  if (calculatedScore < 1 && trimmed.length > 5) {
    calculatedScore = 15;
  }

  let status: EvaluationStatus;
  let feedback = '';

  if (calculatedScore >= 90) {
    status = 'Excellent';
    feedback = `Outstanding response! Clear, technically comprehensive explanation covering core concepts (${matchedKeywords.slice(0, 3).join(', ')}).`;
  } else if (calculatedScore >= 75) {
    status = 'Good';
    feedback = `Solid answer covering primary principles. Matched key concepts: ${matchedKeywords.join(', ')}.${missingKeywords.length > 0 ? ` Could be enriched by mentioning ${missingKeywords.slice(0, 2).join(', ')}.` : ''}`;
  } else if (calculatedScore >= 50) {
    status = 'Partially Correct';
    feedback = `Partially accurate response. Identified key concepts (${matchedKeywords.join(', ') || 'basic ideas'}), but missed critical aspects such as ${missingKeywords.slice(0, 2).join(', ') || 'deeper mechanisms'}.`;
  } else if (calculatedScore >= 25) {
    status = 'Weak';
    feedback = `Weak answer. Minimal conceptual overlap with expected answer. Missing core technical topics: ${missingKeywords.slice(0, 3).join(', ')}.`;
  } else {
    status = 'Mostly Incorrect';
    feedback = `Response does not adequately address the technical question. Missing expected concepts: ${keywords.slice(0, 3).join(', ')}.`;
  }

  return {
    score: calculatedScore,
    status,
    feedback,
    matchedKeywords,
    missingKeywords,
    isUnknownResponse: false,
  };
}
