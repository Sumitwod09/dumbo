export type ThemeMode = "morning" | "day" | "evening" | "night";

export interface UserProfile {
  id: string;
  coupleId: string;
  displayName: string;
  username?: string;
  avatarUrl: string;
  isOnline: boolean;
  isDnd: boolean;
}

export interface Couple {
  id: string;
  createdAt: string;
  pairingCode: string;
  pairingCodeExpiresAt?: string;
  partner1: UserProfile;
  partner2: UserProfile;
}

export interface Song {
  id: string;
  coupleId: string;
  title: string;
  artist: string;
  storagePath: string; // URL or static path
  durationSeconds: number;
  addedBy: string;
  addedByName: string;
  queuePosition: number;
  createdAt: string;
  coverArtUrl?: string;
}

export interface ChatMessage {
  id: string;
  coupleId: string;
  senderId: string;
  senderName: string;
  content: string;
  photoStoragePath?: string;
  readAt: string | null;
  createdAt: string;
}

export interface HydrationLog {
  id: string;
  coupleId: string;
  userId: string;
  userName: string;
  loggedAt: string;
  amountMl: number;
}

export interface SavedDoodle {
  id: string;
  coupleId: string;
  createdBy: string;
  createdByName: string;
  storagePath: string; // data URL or path
  title: string;
  createdAt: string;
}

export interface PomodoroSession {
  sessionId: string;
  phase: "focus" | "break" | "idle";
  remainingSeconds: number;
  totalSeconds: number;
  startedBy: string;
  startedByName: string;
  isRunning: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  id: string;
  color: string;
  width: number;
  points: StrokePoint[];
  createdBy: string;
}
