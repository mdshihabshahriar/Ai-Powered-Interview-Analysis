import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseSpeechRecognitionOptions {
  socket: Socket | null;
  roomId: string;
  isActive: boolean; // Only listen when answer detection is active
  onFinalAnswer?: (answerText: string) => void;
  lang?: string;
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
  const lastFinalTranscriptRef = useRef<string>('');
  const latestFullTextRef = useRef<string>('');

  // Helper to cleanup recognition safely
  const cleanupRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
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

  // Initialize Speech Recognition ONLY when isActive is true
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    if (!isActive) {
      // If not active (e.g. muted or out of call), completely stop recognition and clear stream
      cleanupRecognition();
      setFinalText('');
      setInterimText('');
      latestFullTextRef.current = '';
      lastFinalTranscriptRef.current = '';
      if (socket && roomId) {
        socket.emit('candidate:speech-transcript', {
          roomId,
          text: '',
          isFinal: false,
        });
      }
      return;
    }

    // Active: Initialize fresh recognition instance
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;
      isManuallyStoppedRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let accumulatedFinal = '';
        let accumulatedInterim = '';

        // Iterate through all results in the current session (prevents duplicates)
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const chunk = res[0]?.transcript || '';
          if (res.isFinal) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + chunk.trim();
          } else {
            accumulatedInterim += (accumulatedInterim ? ' ' : '') + chunk.trim();
          }
        }

        const cleanFinal = accumulatedFinal.trim();
        const cleanInterim = accumulatedInterim.trim();

        setFinalText(cleanFinal);
        setInterimText(cleanInterim);

        const fullCombined = (cleanFinal + (cleanInterim ? ' ' + cleanInterim : '')).trim();
        latestFullTextRef.current = fullCombined;

        // Stream real-time transcript to interviewer via socket
        if (socket && roomId && fullCombined) {
          socket.emit('candidate:speech-transcript', {
            roomId,
            text: fullCombined,
            isFinal: false,
          });
        }

        // Silence / completion detection:
        // When speech is detected and candidate pauses for 2.2 seconds, trigger auto-submission
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (fullCombined.length > 5) {
          silenceTimerRef.current = setTimeout(() => {
            if (onFinalAnswer && fullCombined) {
              onFinalAnswer(fullCombined);
            }
          }, 2200);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied for speech recognition.');
        } else if (event.error !== 'no-speech') {
          console.warn('[Speech] Error:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart only if isActive is still true and not manually stopped
        if (!isManuallyStoppedRef.current && isActive) {
          try {
            recognition.start();
          } catch (e) {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[Speech] Initialization error:', err);
      setIsSupported(false);
    }

    return () => {
      cleanupRecognition();
    };
  }, [isActive, lang, socket, roomId, onFinalAnswer, cleanupRecognition]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    cleanupRecognition();
  }, [cleanupRecognition]);

  const resetTranscript = useCallback(() => {
    setFinalText('');
    setInterimText('');
    latestFullTextRef.current = '';
    lastFinalTranscriptRef.current = '';
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
