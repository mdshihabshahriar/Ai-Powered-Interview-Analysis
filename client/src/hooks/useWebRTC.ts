import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { WebRTCConnectionState } from '../types/index.js';

// Optimize SDP for high-clarity mono speech with hardware echo cancellation
function optimizeVoiceSdp(sdp?: string): string | undefined {
  if (!sdp) return sdp;
  return sdp.replace(/a=fmtp:(\d+) (.*)/g, (match, pt, params) => {
    if (sdp.includes(`a=rtpmap:${pt} opus/48000`)) {
      let updatedParams = params;
      if (!updatedParams.includes('stereo=')) {
        updatedParams += ';stereo=0;sprop-stereo=0';
      }
      if (!updatedParams.includes('useinbandfec=')) {
        updatedParams += ';useinbandfec=1';
      }
      return `a=fmtp:${pt} ${updatedParams}`;
    }
    return match;
  });
}

interface UseWebRTCOptions {
  socket: Socket | null;
  roomId: string;
  role: 'interviewer' | 'candidate';
  remoteSocketId?: string | null;
  iceServers?: RTCIceServer[];
}

export function useWebRTC({
  socket,
  roomId,
  role,
  remoteSocketId,
  iceServers = [{ urls: 'stun:stun.l.google.com:19302' }],
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('new');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState<boolean>(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const targetSocketIdRef = useRef<string | null>(remoteSocketId || null);

  const isAudioMutedRef = useRef<boolean>(false);
  const isVideoOffRef = useRef<boolean>(false);

  useEffect(() => {
    isAudioMutedRef.current = isAudioMuted;
  }, [isAudioMuted]);

  useEffect(() => {
    isVideoOffRef.current = isVideoOff;
  }, [isVideoOff]);

  useEffect(() => {
    if (remoteSocketId) {
      targetSocketIdRef.current = remoteSocketId;
    }
  }, [remoteSocketId]);

  // Request user camera and microphone ONLY when called explicitly (upon joining call)
  const initLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    // If active stream already exists, return it
    if (localStreamRef.current && localStreamRef.current.getTracks().some((t) => t.readyState === 'live')) {
      return localStreamRef.current;
    }

    try {
      setPermissionError(null);
      console.log('[WebRTC] Requesting local media devices on joining call...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono channel to eliminate stereo crosstalk & feedback
          sampleRate: 48000,
          // Advanced Chromium/Webkit acoustic processing:
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
        } as any,
      });

      console.log('[WebRTC] Local media stream acquired:', stream.id);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Apply initial mute/video off state if previously toggled
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !isAudioMutedRef.current;
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !isVideoOffRef.current;
      });

      // If peer connection already exists, add or update tracks
      if (pcRef.current && pcRef.current.signalingState !== 'closed') {
        const senders = pcRef.current.getSenders();
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch((err) => {
              console.warn(`[WebRTC] Error replacing ${track.kind} track:`, err);
            });
          } else {
            pcRef.current?.addTrack(track, stream);
          }
        });
      }

      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Media permission error:', err);
      let errorMsg = 'Could not access camera or microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera and microphone access was denied. Please allow permissions in your browser settings to continue.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera or microphone device was found on your system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera or microphone is already in use by another application.';
      }
      setPermissionError(errorMsg);
      return null;
    }
  }, []);

  // Initialize or get RTCPeerConnection
  const getOrCreatePeerConnection = useCallback((targetId: string): RTCPeerConnection => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    console.log('[WebRTC] Initializing new RTCPeerConnection for target:', targetId);
    const configuration: RTCConfiguration = {
      iceServers: iceServers && iceServers.length > 0 ? iceServers : [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Attach local stream tracks to PC if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current!);
          console.log(`[WebRTC] Added local track ${track.kind} to PeerConnection`);
        } catch (e) {
          console.warn('[WebRTC] Track already added:', e);
        }
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, event.streams);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        const existingTracks = remoteStreamRef.current.getTracks();
        if (!existingTracks.some((t) => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          to: targetId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection states
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] PeerConnection state:', pc.connectionState);
      setConnectionState(pc.connectionState as WebRTCConnectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionState('disconnected');
      }
    };

    return pc;
  }, [iceServers, socket]);

  // Initiate WebRTC call (offer)
  const initiateCall = useCallback(async (targetId: string) => {
    if (!socket || !targetId) return;
    try {
      targetSocketIdRef.current = targetId;
      setConnectionState('connecting');

      // Ensure local media is ready before sending offer so offer has audio/video m-lines
      if (!localStreamRef.current) {
        await initLocalMedia();
      }

      const pc = getOrCreatePeerConnection(targetId);

      // Make sure local tracks are attached
      if (localStreamRef.current) {
        const senders = pc.getSenders();
        localStreamRef.current.getTracks().forEach((track) => {
          if (!senders.some((s) => s.track?.id === track.id || s.track?.kind === track.kind)) {
            pc.addTrack(track, localStreamRef.current!);
          }
        });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      if (offer.sdp) {
        offer.sdp = optimizeVoiceSdp(offer.sdp);
      }
      await pc.setLocalDescription(offer);

      socket.emit('webrtc:offer', {
        to: targetId,
        offer,
      });
      console.log('[WebRTC] Created and dispatched offer to:', targetId);
    } catch (err) {
      console.error('[WebRTC] Error initiating call:', err);
    }
  }, [socket, initLocalMedia, getOrCreatePeerConnection]);

  // Toggle Microphone (reliably disables audio tracks and senders)
  const toggleAudio = useCallback(() => {
    setIsAudioMuted((prevMuted) => {
      const newMuted = !prevMuted;
      isAudioMutedRef.current = newMuted;

      // Disable/enable local audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted;
        });
      }

      // Disable/enable RTCPeerConnection audio senders
      if (pcRef.current) {
        pcRef.current.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = !newMuted;
          }
        });
      }

      if (socket) {
        socket.emit('media:toggle', {
          audioMuted: newMuted,
          videoOff: isVideoOffRef.current,
        });
      }

      return newMuted;
    });
  }, [socket]);

  // Toggle Camera (reliably disables video tracks and senders)
  const toggleVideo = useCallback(() => {
    setIsVideoOff((prevOff) => {
      const newVideoOff = !prevOff;
      isVideoOffRef.current = newVideoOff;

      // Disable/enable local video tracks
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !newVideoOff;
        });
      }

      // Disable/enable RTCPeerConnection video senders
      if (pcRef.current) {
        pcRef.current.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'video') {
            sender.track.enabled = !newVideoOff;
          }
        });
      }

      if (socket) {
        socket.emit('media:toggle', {
          audioMuted: isAudioMutedRef.current,
          videoOff: newVideoOff,
        });
      }

      return newVideoOff;
    });
  }, [socket]);

  // Setup WebRTC signaling listeners
  useEffect(() => {
    if (!socket) return;

    // When peers ready (interviewer initiates offer)
    const handlePeersReady = async ({ interviewer, candidate }: any) => {
      console.log('[WebRTC] Peers ready event received:', { interviewer, candidate, currentRole: role });
      if (role === 'interviewer' && candidate?.socketId) {
        targetSocketIdRef.current = candidate.socketId;
        await initiateCall(candidate.socketId);
      } else if (role === 'candidate' && interviewer?.socketId) {
        targetSocketIdRef.current = interviewer.socketId;
      }
    };

    // Receive Offer
    const handleOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received offer from:', from);
      try {
        targetSocketIdRef.current = from;
        setConnectionState('connecting');

        // Ensure candidate has local media ready before creating answer
        if (!localStreamRef.current) {
          await initLocalMedia();
        }

        const pc = getOrCreatePeerConnection(from);

        // Ensure candidate local tracks are attached
        if (localStreamRef.current) {
          const senders = pc.getSenders();
          localStreamRef.current.getTracks().forEach((track) => {
            if (!senders.some((s) => s.track?.id === track.id || s.track?.kind === track.kind)) {
              pc.addTrack(track, localStreamRef.current!);
            }
          });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Process pending ice candidates
        while (pendingCandidates.current.length > 0) {
          const cand = pendingCandidates.current.shift();
          if (cand) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('[WebRTC] Error adding buffered ICE candidate:', e);
            }
          }
        }

        const answer = await pc.createAnswer();
        if (answer.sdp) {
          answer.sdp = optimizeVoiceSdp(answer.sdp);
        }
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          to: from,
          answer,
        });
        console.log('[WebRTC] Created and sent answer to:', from);
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    // Receive Answer
    const handleAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received answer from:', from);
      try {
        if (pcRef.current && pcRef.current.signalingState !== 'closed') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

          // Process pending candidates
          while (pendingCandidates.current.length > 0) {
            const cand = pendingCandidates.current.shift();
            if (cand) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn('[WebRTC] Error adding buffered ICE candidate in answer:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    };

    // Receive ICE Candidate
    const handleIceCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    // Peer media changes (mute / camera toggle)
    const handleMediaChanged = ({ audioMuted, videoOff }: { audioMuted: boolean; videoOff: boolean }) => {
      console.log('[WebRTC] Peer media changed:', { audioMuted, videoOff });
      setRemoteAudioMuted(audioMuted);
      setRemoteVideoOff(videoOff);
    };

    // Peer disconnected
    const handlePeerDisconnected = () => {
      console.log('[WebRTC] Peer disconnected');
      setRemoteStream(null);
      remoteStreamRef.current = null;
      setConnectionState('disconnected');
    };

    socket.on('room:peers-ready', handlePeersReady);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('peer:media-changed', handleMediaChanged);
    socket.on('peer:disconnected', handlePeerDisconnected);

    return () => {
      socket.off('room:peers-ready', handlePeersReady);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('peer:media-changed', handleMediaChanged);
      socket.off('peer:disconnected', handlePeerDisconnected);
    };
  }, [socket, role, getOrCreatePeerConnection, initiateCall, initLocalMedia]);

  // Explicit function to stop all media and release hardware camera/microphone immediately
  const stopAllMedia = useCallback(() => {
    console.log('[WebRTC] Explicitly stopping all media tracks and releasing hardware...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      remoteStreamRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('closed');
  }, []);

  // Cleanup ONLY when hook actually unmounts
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isAudioMuted,
    isVideoOff,
    remoteAudioMuted,
    remoteVideoOff,
    permissionError,
    initLocalMedia,
    toggleAudio,
    toggleVideo,
    initiateCall,
    stopAllMedia,
  };
}
