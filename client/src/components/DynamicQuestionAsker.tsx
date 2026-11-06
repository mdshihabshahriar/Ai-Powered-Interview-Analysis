import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  XCircle,
  Keyboard,
  Volume2,
  Search,
} from 'lucide-react';
import { AskedQuestionRecord } from '../types/index.js';

interface DynamicQuestionAskerProps {
  activeAskedQuestion: AskedQuestionRecord | null;
  onAskQuestion: (questionText: string) => void;
  onMarkUnanswered: () => void;
  onManualEvaluateAnswer?: () => void;
  candidateLiveSpeech?: string;
  isAnswerDetectionActive?: boolean;
}

const SAMPLE_PROMPTS = [
  "Can you explain how closures work in JavaScript and why we use them?",
  "How are var, let, and const different in JavaScript?",
  "What is the difference between SQL and NoSQL databases?",
  "How does React's Virtual DOM reconciliation work?",
  "What makes Node.js non-blocking and single-threaded?",
  "Explain ACID properties in database transactions.",
  "What is the difference between horizontal and vertical scaling?",
  "How does WebRTC establish a peer-to-peer connection?",
  "What are Streams in Node.js and when would you use them?",
  "What is Database Indexing and how does it speed up queries?"
];

// Remove acoustic repeat and duplicate words
function deduplicateRepeatedWords(text: string): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  const result: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = result[result.length - 1];

    if (prev && current.toLowerCase() === prev.toLowerCase()) {
      continue;
    }

    if (
      result.length >= 2 &&
      i + 1 < words.length &&
      words[i].toLowerCase() === result[result.length - 2].toLowerCase() &&
      words[i + 1].toLowerCase() === result[result.length - 1].toLowerCase()
    ) {
      i++;
      continue;
    }

    result.push(current);
  }

  return result.join(' ');
}

export const DynamicQuestionAsker: React.FC<DynamicQuestionAskerProps> = ({
  activeAskedQuestion,
  onAskQuestion,
  onMarkUnanswered,
  onManualEvaluateAnswer,
  candidateLiveSpeech,
  isAnswerDetectionActive = false,
}) => {
  // Primary mode: Voice-based question detection (Requirement 2)
  const [askMode, setAskMode] = useState<'voice' | 'type'>('voice');
  const [questionInput, setQuestionInput] = useState('');
  const [showExpectedAnswer, setShowExpectedAnswer] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Voice Question Detection State
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [voiceFinalText, setVoiceFinalText] = useState('');
  const interviewerRecognitionRef = useRef<any>(null);
  const voiceSilenceTimerRef = useRef<any>(null);

  // Initialize Interviewer Speech Recognition
  const startVoiceQuestion = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported in this browser. Please use the "Ask by Typing" option.');
      setAskMode('type');
      return;
    }

    try {
      if (interviewerRecognitionRef.current) {
        interviewerRecognitionRef.current.abort();
      }

      setVoiceInterimText('');
      setVoiceFinalText('');

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceRecording(true);
      };

      recognition.onresult = (event: any) => {
        let accumulatedFinal = '';
        let accumulatedInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + text.trim();
          } else {
            accumulatedInterim += (accumulatedInterim ? ' ' : '') + text.trim();
          }
        }

        const cleanFinal = deduplicateRepeatedWords(accumulatedFinal);
        const cleanInterim = deduplicateRepeatedWords(accumulatedInterim);

        setVoiceFinalText(cleanFinal);
        setVoiceInterimText(cleanInterim);

        const fullSpoken = deduplicateRepeatedWords(
          (cleanFinal + (cleanInterim ? ' ' + cleanInterim : '')).trim()
        );

        // Auto-detect when interviewer finishes speaking (1.8s pause)
        if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
        if (fullSpoken.length > 5) {
          voiceSilenceTimerRef.current = setTimeout(() => {
            stopVoiceQuestionAndSubmit(fullSpoken);
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Interviewer Speech] Error:', event.error);
        if (event.error !== 'no-speech') {
          setIsVoiceRecording(false);
        }
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      interviewerRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Interviewer Speech] Init error:', err);
      setIsVoiceRecording(false);
    }
  };

  const stopVoiceQuestionAndSubmit = (overrideText?: string) => {
    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current = null;
    }

    if (interviewerRecognitionRef.current) {
      try {
        interviewerRecognitionRef.current.abort();
      } catch (e) {}
      interviewerRecognitionRef.current = null;
    }

    setIsVoiceRecording(false);

    const questionText = (overrideText || (voiceFinalText + ' ' + voiceInterimText)).trim();
    if (questionText.length > 3) {
      onAskQuestion(questionText);
      setVoiceFinalText('');
      setVoiceInterimText('');
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionInput.trim()) return;

    onAskQuestion(questionInput.trim());
    setQuestionInput('');
    setShowSuggestions(false);
  };

  const fullSpokenPreview = (voiceFinalText + (voiceInterimText ? ' ' + voiceInterimText : '')).trim();

  return (
    <div className="bg-surface-900/90 backdrop-blur-xl border border-surface-800/80 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-800">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Interviewer Question Panel
          </h3>
        </div>

        {/* Tab Selection: Voice (Primary) vs Typing (Optional) */}
        <div className="flex rounded-lg bg-surface-950 p-0.5 border border-surface-800">
          <button
            type="button"
            onClick={() => setAskMode('voice')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
              askMode === 'voice'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Ask by Voice (Primary)</span>
          </button>
          <button
            type="button"
            onClick={() => setAskMode('type')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
              askMode === 'type'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Type Question</span>
          </button>
        </div>
      </div>

      {/* OPTION A: ASK BY VOICE (Primary Method - Requirement 2) */}
      {askMode === 'voice' && (
        <div className="rounded-2xl bg-surface-950/80 border border-surface-800 p-5 text-center space-y-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            {isVoiceRecording ? (
              <button
                type="button"
                onClick={() => stopVoiceQuestionAndSubmit()}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 flex items-center justify-center animate-pulse transition-all hover:scale-105"
                title="Click to finalize and ask question"
              >
                <MicOff className="w-7 h-7" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceQuestion}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/30 flex items-center justify-center transition-all hover:scale-105"
                title="Click to speak question"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}

            <div>
              <h4 className="text-sm font-bold text-white">
                {isVoiceRecording ? 'Listening to your question...' : 'Ask by Voice'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVoiceRecording
                  ? 'Speak naturally. Pause or click to automatically match with the dataset.'
                  : 'Click the microphone button and speak your technical question.'}
              </p>
            </div>
          </div>

          {/* Live Voice Transcription Box */}
          {isVoiceRecording && (
            <div className="p-3.5 rounded-xl bg-surface-900 border border-brand-500/30 text-left space-y-2">
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
                <span>Interviewer Voice Recognition:</span>
              </span>
              <p className="text-xs sm:text-sm font-mono text-white min-h-[38px] leading-relaxed break-words">
                {fullSpokenPreview || <span className="text-slate-500 italic">Listening to your microphone...</span>}
              </p>
              {fullSpokenPreview && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => stopVoiceQuestionAndSubmit()}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white"
                  >
                    Done Speaking & Match Question
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OPTION B: ASK BY TYPING (Optional Alternative) */}
      {askMode === 'type' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Type question in natural language:</span>
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-[11px] text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
            >
              <Search className="w-3 h-3" />
              <span>{showSuggestions ? 'Hide Ideas' : 'Question Ideas'}</span>
            </button>
          </div>

          {/* Question Suggestions Dropdown */}
          {showSuggestions && (
            <div className="rounded-xl bg-surface-950 border border-surface-800 p-3 space-y-1.5 max-h-44 overflow-y-auto">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Click to autofill sample question:
              </span>
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestionInput(p);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs text-slate-300 hover:bg-surface-800 hover:text-white transition-colors truncate"
                >
                  • {p}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="e.g. Can you explain the difference between var, let, and const in JavaScript?"
            rows={2}
            className="w-full p-3 text-xs sm:text-sm bg-surface-950 border border-surface-800 text-white rounded-xl focus:outline-none focus:border-brand-500 resize-none font-sans"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!questionInput.trim()}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-lg shadow-brand-500/25 flex items-center space-x-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Question</span>
            </button>
          </div>
        </form>
      )}

      {/* ACTIVE QUESTION DETECTION & MATCH STATUS */}
      {activeAskedQuestion && (
        <div className="pt-3 border-t border-surface-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Active Question:
            </span>
            {activeAskedQuestion.isMatched ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Matched ({activeAskedQuestion.matchConfidence}% confidence)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>No Matching Question Found</span>
              </span>
            )}
          </div>

          {/* Original Interviewer Question */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
              Your Question Asked:
            </span>
            <p className="text-xs sm:text-sm font-semibold text-white">
              "{activeAskedQuestion.interviewerQuestion}"
            </p>
          </div>

          {/* If Question Matched Successfully */}
          {activeAskedQuestion.isMatched ? (
            <div className="space-y-3">
              {/* Matched JSON Question */}
              <div className="p-3.5 rounded-xl bg-surface-950/70 border border-surface-800">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block mb-1">
                  Matched JSON Dataset Question ({activeAskedQuestion.matchedCategory}):
                </span>
                <p className="text-xs sm:text-sm text-slate-200 font-medium">
                  {activeAskedQuestion.matchedQuestion}
                </p>
              </div>

              {/* Expected Answer (Confidential to Interviewer) */}
              <div className="p-3.5 rounded-xl bg-surface-950/90 border border-surface-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Expected Answer (Confidential):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExpectedAnswer(!showExpectedAnswer)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    {showExpectedAnswer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showExpectedAnswer ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>

                {showExpectedAnswer ? (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeAskedQuestion.matchedExpectedAnswer}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">Expected answer hidden.</p>
                )}

                {showExpectedAnswer && activeAskedQuestion.matchedKeywords && activeAskedQuestion.matchedKeywords.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-surface-800 flex flex-wrap gap-1">
                    {activeAskedQuestion.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface-800 text-slate-300 font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Mark as Unanswered & Evaluate Answer Now */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={onMarkUnanswered}
                  className="text-xs px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-surface-700/60 hover:border-rose-500/30 flex items-center space-x-1.5 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Mark as Unanswered (0 pts)</span>
                </button>

                {onManualEvaluateAnswer && isAnswerDetectionActive && candidateLiveSpeech && (
                  <button
                    type="button"
                    onClick={onManualEvaluateAnswer}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evaluate Answer Now</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Unmatched Question Warning */
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No Matching Question Found</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Could not match with predefined technical topics (Confidence: {activeAskedQuestion.matchConfidence}%).
              </p>
              <p className="text-[11px] text-slate-400">
                • Answer evaluation is not performed for unmatched questions.<br />
                • Rephrase with standard technical terms and ask again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
