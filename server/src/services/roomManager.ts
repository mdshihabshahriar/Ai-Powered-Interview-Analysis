import { Room, Participant, AskedQuestionRecord, SanitizedRoomForCandidate } from '../types/index.js';
import {
  matchQuestion,
  evaluateAnswerForRecord,
  createUnansweredAskedRecord,
  calculateAskedQuestionsSummary,
} from './evaluationService.js';

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, { roomId: string; role: 'interviewer' | 'candidate' }> = new Map();

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'INT-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  public createRoom(interviewerName: string = 'Interviewer'): Room {
    const roomId = this.generateRoomCode();

    const room: Room = {
      id: roomId,
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      status: 'waiting',
      interviewer: null,
      candidate: null,
      activeAskedQuestionId: null,
      askedQuestions: [],
      overallScore: null,
    };

    this.rooms.set(roomId, room);
    console.log(`[RoomManager] Room ${roomId} created.`);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase().trim());
  }

  public joinRoom(
    roomId: string,
    socketId: string,
    name: string,
    role: 'interviewer' | 'candidate'
  ): { success: boolean; error?: string; room?: Room } {
    const cleanId = roomId.toUpperCase().trim();
    const room = this.rooms.get(cleanId);

    if (!room) {
      return { success: false, error: 'Interview room not found. Please verify the room code.' };
    }

    if (room.status === 'completed') {
      return { success: false, error: 'This interview session has already concluded.' };
    }

    if (role === 'interviewer') {
      room.interviewer = {
        socketId,
        name: name || 'Interviewer',
        role: 'interviewer',
        audioMuted: false,
        videoOff: false,
        joinedAt: new Date().toISOString(),
      };
    } else {
      if (room.candidate && room.candidate.socketId !== socketId) {
        return {
          success: false,
          error: 'This interview room already has an active candidate. Multiple candidates are not permitted.',
        };
      }
      room.candidate = {
        socketId,
        name: name || 'Candidate',
        role: 'candidate',
        audioMuted: false,
        videoOff: false,
        joinedAt: new Date().toISOString(),
      };
    }

    this.socketToRoom.set(socketId, { roomId: cleanId, role });
    console.log(`[RoomManager] ${role} (${name}) joined room ${cleanId} (socket: ${socketId})`);
    return { success: true, room };
  }

  public handleDisconnect(socketId: string): { roomId?: string; role?: 'interviewer' | 'candidate'; room?: Room } {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return {};

    const { roomId, role } = mapping;
    this.socketToRoom.delete(socketId);

    const room = this.rooms.get(roomId);
    if (!room) return { roomId, role };

    if (role === 'interviewer' && room.interviewer?.socketId === socketId) {
      room.interviewer = null;
      console.log(`[RoomManager] Interviewer disconnected from room ${roomId}`);
    } else if (role === 'candidate' && room.candidate?.socketId === socketId) {
      room.candidate = null;
      console.log(`[RoomManager] Candidate disconnected from room ${roomId}`);
    }

    return { roomId, role, room };
  }

  public updateMediaStatus(socketId: string, audioMuted: boolean, videoOff: boolean): { roomId?: string; participant?: Participant } {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return {};

    const room = this.rooms.get(mapping.roomId);
    if (!room) return {};

    const participant = mapping.role === 'interviewer' ? room.interviewer : room.candidate;
    if (participant && participant.socketId === socketId) {
      participant.audioMuted = audioMuted;
      participant.videoOff = videoOff;
      return { roomId: mapping.roomId, participant };
    }
    return {};
  }

  public startInterview(roomId: string): Room | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.status = 'in_progress';
    room.startedAt = new Date().toISOString();
    return room;
  }

  /**
   * Interviewer dynamically asks a question.
   * Compares the interviewer's question against the JSON dataset using semantic matching.
   */
  public askQuestion(
    roomId: string,
    interviewerQuestion: string,
    threshold: number = 38
  ): { success: boolean; record: AskedQuestionRecord; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found.`);
    }

    const matchResult = matchQuestion(interviewerQuestion, threshold);
    const askId = `ask-${room.askedQuestions.length + 1}-${Date.now()}`;

    const record: AskedQuestionRecord = {
      id: askId,
      interviewerQuestion,
      matchedQuestionId: matchResult.matchedQuestion?.id || null,
      matchedQuestion: matchResult.matchedQuestion?.question || null,
      matchedCategory: matchResult.matchedQuestion?.category || null,
      matchedExpectedAnswer: matchResult.matchedQuestion?.expectedAnswer || null,
      matchedKeywords: matchResult.matchedQuestion?.keywords || [],
      matchConfidence: matchResult.confidence,
      isMatched: matchResult.isMatched,
      matchFailureReason: matchResult.isMatched ? undefined : 'No Matching Question Found',
      candidateAnswer: '',
      similarityScore: 0,
      evaluationStatus: 'Not Answered',
      aiFeedback: matchResult.isMatched
        ? 'Question matched. Ready to evaluate candidate answer.'
        : 'No Matching Question Found. Rephrase or modify question.',
      matchedConcepts: [],
      missingConcepts: [],
      askedAt: new Date().toISOString(),
      evaluatedAt: null,
    };

    if (matchResult.isMatched) {
      room.activeAskedQuestionId = record.id;
      room.askedQuestions.push(record);
      return { success: true, record };
    } else {
      // Record unmatched attempt for record tracking
      room.askedQuestions.push(record);
      return {
        success: false,
        record,
        error: 'No Matching Question Found',
      };
    }
  }

  public getActiveAskedQuestion(roomId: string): AskedQuestionRecord | null {
    const room = this.getRoom(roomId);
    if (!room || !room.activeAskedQuestionId) return null;
    return room.askedQuestions.find(q => q.id === room.activeAskedQuestionId) || null;
  }

  public async evaluateCurrentAnswer(
    roomId: string,
    candidateAnswer: string
  ): Promise<{ isGreeting: boolean; record?: AskedQuestionRecord }> {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const activeRecord = this.getActiveAskedQuestion(roomId);
    if (!activeRecord || !activeRecord.isMatched) {
      throw new Error('No active matched question to evaluate');
    }

    const outcome = await evaluateAnswerForRecord(activeRecord, candidateAnswer);
    if (outcome.isGreeting) {
      return { isGreeting: true };
    }

    if (outcome.evaluatedRecord) {
      Object.assign(activeRecord, outcome.evaluatedRecord);
    }

    return {
      isGreeting: false,
      record: activeRecord,
    };
  }

  public markActiveAsUnanswered(roomId: string): AskedQuestionRecord | null {
    return this.markCurrentUnanswered(roomId);
  }

  public markCurrentUnanswered(roomId: string): AskedQuestionRecord | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const activeRecord = this.getActiveAskedQuestion(roomId);
    if (!activeRecord || !activeRecord.isMatched) return null;

    const updates = createUnansweredAskedRecord(activeRecord);
    Object.assign(activeRecord, updates);
    return activeRecord;
  }

  public endInterview(roomId: string): { room: Room; summary: any } | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.status = 'completed';
    room.endedAt = new Date().toISOString();

    const summary = calculateAskedQuestionsSummary(room.askedQuestions);
    room.overallScore = summary.overallScore;

    return { room, summary };
  }

  /**
   * Candidate interface sanitizer:
   * Strips out ALL question data, expected answers, and evaluation scores!
   */
  public getSanitizedRoomForCandidate(room: Room): SanitizedRoomForCandidate {
    return {
      id: room.id,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      status: room.status,
      interviewerName: room.interviewer?.name || null,
      interviewerSocketId: room.interviewer?.socketId || null,
      candidateName: room.candidate?.name || null,
    };
  }
}

export const roomManager = new RoomManager();
