import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseSpeechRecognitionOptions {
  socket: Socket | null;
  roomId: string;
  isActive: boolean; // Only listen when answer detection is active
  onFinalAnswer?: (answerText: string) => void;
  lang?: string;
}

// Remove acoustic stutter and repeated echo words (e.g. "hello hello hello" -> "hello")
function deduplicateRepeatedWords(text: string): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  const result: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = result[result.length - 1];

    // Single-word consecutive duplicate: "hello hello" -> "hello"
    if (prev && current.toLowerCase() === prev.toLowerCase()) {
      continue;
    }

    // Two-word phrase consecutive duplicate: "in my in my" -> "in my"
    if (
      result.length >= 2 &&
      i + 1 < words.length &&
      words[i].toLowerCase() === result[result.length - 2].toLowerCase() &&
      words[i + 1].toLowerCase() === result[result.length - 1].toLowerCase()
    ) {
      i++; // skip 2nd word of repeat
      continue;
    }

    result.push(current);
  }

  return result.join(' ');
}

export function useSpeechRecognition({
  socket,
  roomId,
  isActive,
  onFinalAnswer,
  lang = 'en-US',
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [finalText, setFinalText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const isRunningRef = useRef<boolean>(false);
  const latestFullTextRef = useRef<string>('');

  // Keep latest callbacks in refs to prevent rebuilding recognition on parent re-renders
  const onFinalAnswerRef = useRef(onFinalAnswer);
  useEffect(() => {
    onFinalAnswerRef.current = onFinalAnswer;
  }, [onFinalAnswer]);

  const socketRef = useRef(socket);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Cleanup helper
  const cleanupRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    isRunningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Main lifecycle effect: ONLY depends on isActive and lang
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    if (!isActive) {
      cleanupRecognition();
      setFinalText('');
      setInterimText('');
      latestFullTextRef.current = '';
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('candidate:speech-transcript', {
          roomId: roomIdRef.current,
          text: '',
          isFinal: false,
        });
      }
      return;
    }

    isManuallyStoppedRef.current = false;

    const startRecognitionInstance = () => {
      if (isManuallyStoppedRef.current || !isActive || isRunningRef.current) return;

      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isRunningRef.current = true;
          setIsListening(true);
          setSpeechError(null);
        };

        recognition.onresult = (event: any) => {
          let accumulatedFinal = '';
          let accumulatedInterim = '';

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            const chunk = res[0]?.transcript || '';
            if (res.isFinal) {
              accumulatedFinal += (accumulatedFinal ? ' ' : '') + chunk.trim();
            } else {
              accumulatedInterim += (accumulatedInterim ? ' ' : '') + chunk.trim();
            }
          }

          const cleanFinal = deduplicateRepeatedWords(accumulatedFinal);
          const cleanInterim = deduplicateRepeatedWords(accumulatedInterim);

          setFinalText(cleanFinal);
          setInterimText(cleanInterim);

          const fullCombined = deduplicateRepeatedWords(
            (cleanFinal + (cleanInterim ? ' ' + cleanInterim : '')).trim()
          );
          latestFullTextRef.current = fullCombined;

          // Stream real-time transcript to interviewer via socket
          if (socketRef.current && roomIdRef.current && fullCombined) {
            socketRef.current.emit('candidate:speech-transcript', {
              roomId: roomIdRef.current,
              text: fullCombined,
              isFinal: false,
            });
          }

          // Silence / completion detection: after 2.5s of silence, auto-submit answer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          if (fullCombined.length > 5) {
            silenceTimerRef.current = setTimeout(() => {
              if (onFinalAnswerRef.current && fullCombined) {
                onFinalAnswerRef.current(fullCombined);
              }
            }, 2500);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission denied for speech recognition.');
            isManuallyStoppedRef.current = true;
          } else if (event.error === 'service-not-allowed') {
            setSpeechError('Speech recognition service not allowed on this browser.');
            isManuallyStoppedRef.current = true;
          } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('[Speech] Recognition event error:', event.error);
          }
        };

        recognition.onend = () => {
          isRunningRef.current = false;
          setIsListening(false);

          // Gently restart recognition with a 500ms delay to avoid rapid chimes/beeps
          if (!isManuallyStoppedRef.current && isActive) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              startRecognitionInstance();
            }, 500);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.warn('[Speech] Failed to start recognition instance:', err);
        isRunningRef.current = false;
      }
    };

    startRecognitionInstance();

    return () => {
      cleanupRecognition();
    };
  }, [isActive, lang, cleanupRecognition]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    cleanupRecognition();
  }, [cleanupRecognition]);

  const resetTranscript = useCallback(() => {
    setFinalText('');
    setInterimText('');
    latestFullTextRef.current = '';
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  return {
    isListening,
    transcript: finalText,
    interimText,
    fullSpeechText: latestFullTextRef.current,
    isSupported,
    speechError,
    stopListening,
    resetTranscript,
  };
}
