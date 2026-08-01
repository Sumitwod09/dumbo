import { create } from "zustand";
import { ChatMessage } from "@/types";
import { MOCK_CHAT_MESSAGES } from "@/lib/mock/mockData";

export interface CallState {
  isCallActive: boolean;
  callType: "audio" | "video";
  isMuted: boolean;
  isCameraOff: boolean;
  durationSeconds: number;
}

interface ChatState {
  messages: ChatMessage[];
  callState: CallState;

  // Actions
  sendMessage: (content: string, senderId: string, senderName: string) => void;
  sendPhotoMessage: (photoUrl: string, senderId: string, senderName: string, caption?: string) => void;
  markAsRead: (messageId: string) => void;
  markAllPartnerMessagesAsRead: (activeUserId: string) => void;
  startCall: (type: "audio" | "video") => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  incrementCallDuration: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: MOCK_CHAT_MESSAGES,
  callState: {
    isCallActive: false,
    callType: "video",
    isMuted: false,
    isCameraOff: false,
    durationSeconds: 0,
  },

  sendMessage: (content, senderId, senderName) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      coupleId: "couple-888-999-111",
      senderId,
      senderName,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  sendPhotoMessage: (photoUrl, senderId, senderName, caption = "") => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      coupleId: "couple-888-999-111",
      senderId,
      senderName,
      content: caption,
      photoStoragePath: photoUrl,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  markAsRead: (messageId) => {
    const now = new Date().toISOString();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && !m.readAt ? { ...m, readAt: now } : m
      ),
    }));
  },

  markAllPartnerMessagesAsRead: (activeUserId) => {
    const now = new Date().toISOString();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.senderId !== activeUserId && !m.readAt ? { ...m, readAt: now } : m
      ),
    }));
  },

  startCall: (type) =>
    set({
      callState: {
        isCallActive: true,
        callType: type,
        isMuted: false,
        isCameraOff: false,
        durationSeconds: 0,
      },
    }),

  endCall: () =>
    set((state) => ({
      callState: {
        ...state.callState,
        isCallActive: false,
        durationSeconds: 0,
      },
    })),

  toggleMute: () =>
    set((state) => ({
      callState: { ...state.callState, isMuted: !state.callState.isMuted },
    })),

  toggleCamera: () =>
    set((state) => ({
      callState: { ...state.callState, isCameraOff: !state.callState.isCameraOff },
    })),

  incrementCallDuration: () =>
    set((state) => ({
      callState: {
        ...state.callState,
        durationSeconds: state.callState.durationSeconds + 1,
      },
    })),
}));
