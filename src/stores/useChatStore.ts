import { create } from "zustand";
import { ChatMessage } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";

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
  fetchMessages: (coupleId: string) => Promise<void>;
  sendMessage: (content: string, senderId: string, senderName: string) => Promise<void>;
  sendPhotoMessage: (photoUrl: string, senderId: string, senderName: string, caption?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllPartnerMessagesAsRead: (activeUserId: string) => Promise<void>;
  startCall: (type: "audio" | "video") => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  incrementCallDuration: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  callState: {
    isCallActive: false,
    callType: "video",
    isMuted: false,
    isCameraOff: false,
    durationSeconds: 0,
  },

  fetchMessages: async (coupleId: string) => {
    // 1. Fetch existing messages from Supabase
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      set({
        messages: data.map((m) => ({
          id: m.id,
          coupleId: m.couple_id,
          senderId: m.sender_id,
          senderName: m.sender_name || "Partner",
          content: m.content || "",
          photoStoragePath: m.photo_storage_path,
          readAt: m.read_at,
          createdAt: m.created_at,
        })),
      });
    }

    // 2. Subscribe to realtime chat_messages
    supabase
      .channel(`chat_messages:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const m = payload.new;
            const newMsg: ChatMessage = {
              id: m.id,
              coupleId: m.couple_id,
              senderId: m.sender_id,
              senderName: m.sender_name || "Partner",
              content: m.content || "",
              photoStoragePath: m.photo_storage_path,
              readAt: m.read_at,
              createdAt: m.created_at,
            };

            set((state) => {
              if (state.messages.some((msg) => msg.id === newMsg.id)) return state;
              return { messages: [...state.messages, newMsg] };
            });
          } else if (payload.eventType === "UPDATE") {
            const m = payload.new;
            set((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === m.id ? { ...msg, readAt: m.read_at } : msg
              ),
            }));
          }
        }
      )
      .subscribe();
  },

  sendMessage: async (content, senderId, senderName) => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const tempId = `msg-temp-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      coupleId: couple.id,
      senderId,
      senderName,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update locally
    set((state) => ({ messages: [...state.messages, newMsg] }));

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        couple_id: couple.id,
        sender_id: senderId,
        sender_name: senderName,
        content,
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId ? { ...m, id: data.id, createdAt: data.created_at } : m
        ),
      }));
    }
  },

  sendPhotoMessage: async (photoUrl, senderId, senderName, caption = "") => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const tempId = `msg-temp-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      coupleId: couple.id,
      senderId,
      senderName,
      content: caption,
      photoStoragePath: photoUrl,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ messages: [...state.messages, newMsg] }));

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        couple_id: couple.id,
        sender_id: senderId,
        sender_name: senderName,
        content: caption,
        photo_storage_path: photoUrl,
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId ? { ...m, id: data.id, createdAt: data.created_at } : m
        ),
      }));
    }
  },

  markAsRead: async (messageId) => {
    const now = new Date().toISOString();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && !m.readAt ? { ...m, readAt: now } : m
      ),
    }));

    await supabase
      .from("chat_messages")
      .update({ read_at: now })
      .eq("id", messageId);
  },

  markAllPartnerMessagesAsRead: async (activeUserId) => {
    const { messages } = get();
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const now = new Date().toISOString();
    const unreadPartnerMessageIds = messages
      .filter((m) => m.senderId !== activeUserId && !m.readAt)
      .map((m) => m.id);

    if (unreadPartnerMessageIds.length === 0) return;

    set((state) => ({
      messages: state.messages.map((m) =>
        m.senderId !== activeUserId && !m.readAt ? { ...m, readAt: now } : m
      ),
    }));

    await supabase
      .from("chat_messages")
      .update({ read_at: now })
      .in("id", unreadPartnerMessageIds);
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
      callState: {
        ...state.callState,
        isMuted: !state.callState.isMuted,
      },
    })),

  toggleCamera: () =>
    set((state) => ({
      callState: {
        ...state.callState,
        isCameraOff: !state.callState.isCameraOff,
      },
    })),

  incrementCallDuration: () =>
    set((state) => ({
      callState: {
        ...state.callState,
        durationSeconds: state.callState.durationSeconds + 1,
      },
    })),
}));
