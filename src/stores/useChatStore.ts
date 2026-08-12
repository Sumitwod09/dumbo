import { create } from "zustand";
import { ChatMessage } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";
import {
  saveLocalMessages,
  getLocalMessages,
  enqueuePendingAction,
} from "@/lib/offline/storageEngine";

export interface CallState {
  isCallActive: boolean;
  callType: "audio" | "video";
  isMuted: boolean;
  isCameraOff: boolean;
  durationSeconds: number;
}

export interface ExtendedChatMessage extends ChatMessage {
  isPendingSync?: boolean;
}

interface ChatState {
  messages: ExtendedChatMessage[];
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
  messages: getLocalMessages(),
  callState: {
    isCallActive: false,
    callType: "video",
    isMuted: false,
    isCameraOff: false,
    durationSeconds: 0,
  },

  fetchMessages: async (coupleId: string) => {
    // 1. Load cached offline messages first
    const cached = getLocalMessages();
    if (cached && cached.length > 0) {
      set({ messages: cached });
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    // 2. Fetch existing messages from Supabase
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const fetchedMessages: ExtendedChatMessage[] = data.map((m) => ({
          id: m.id,
          coupleId: m.couple_id,
          senderId: m.sender_id,
          senderName: m.sender_name || "Partner",
          content: m.content || "",
          photoStoragePath: m.photo_storage_path,
          readAt: m.read_at,
          createdAt: m.created_at,
        }));

        set({ messages: fetchedMessages });
        saveLocalMessages(fetchedMessages);
      }
    } catch (err) {
      console.warn("Failed to fetch remote messages, using local cache:", err);
    }

    // 3. Realtime subscription
    try {
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
              const newMsg: ExtendedChatMessage = {
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
                const updated = [...state.messages, newMsg];
                saveLocalMessages(updated);
                return { messages: updated };
              });
            } else if (payload.eventType === "UPDATE") {
              const m = payload.new;
              set((state) => {
                const updated = state.messages.map((msg) =>
                  msg.id === m.id ? { ...msg, readAt: m.read_at } : msg
                );
                saveLocalMessages(updated);
                return { messages: updated };
              });
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime subscription bypassed in offline mode");
    }
  },

  sendMessage: async (content, senderId, senderName) => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const tempId = `msg-temp-${Date.now()}`;
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    const newMsg: ExtendedChatMessage = {
      id: tempId,
      coupleId: couple.id,
      senderId,
      senderName,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
      isPendingSync: !isOnline,
    };

    // Optimistically update locally
    set((state) => {
      const updated = [...state.messages, newMsg];
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isOnline) {
      try {
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
          set((state) => {
            const updated = state.messages.map((m) =>
              m.id === tempId
                ? { ...m, id: data.id, createdAt: data.created_at, isPendingSync: false }
                : m
            );
            saveLocalMessages(updated);
            return { messages: updated };
          });
          return;
        }
      } catch (err) {
        console.warn("Online send message failed, queueing offline:", err);
      }
    }

    // Enqueue for offline sync
    enqueuePendingAction({
      type: "SEND_MESSAGE",
      payload: { coupleId: couple.id, senderId, senderName, content },
    });
  },

  sendPhotoMessage: async (photoUrl, senderId, senderName, caption = "") => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const tempId = `msg-temp-${Date.now()}`;
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    const newMsg: ExtendedChatMessage = {
      id: tempId,
      coupleId: couple.id,
      senderId,
      senderName,
      content: caption,
      photoStoragePath: photoUrl,
      readAt: null,
      createdAt: new Date().toISOString(),
      isPendingSync: !isOnline,
    };

    set((state) => {
      const updated = [...state.messages, newMsg];
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isOnline) {
      try {
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
          set((state) => {
            const updated = state.messages.map((m) =>
              m.id === tempId
                ? { ...m, id: data.id, createdAt: data.created_at, isPendingSync: false }
                : m
            );
            saveLocalMessages(updated);
            return { messages: updated };
          });
          return;
        }
      } catch (err) {
        console.warn("Online send photo failed, queueing offline:", err);
      }
    }

    enqueuePendingAction({
      type: "SEND_PHOTO",
      payload: {
        coupleId: couple.id,
        senderId,
        senderName,
        content: caption,
        photoStoragePath: photoUrl,
      },
    });
  },

  markAsRead: async (messageId) => {
    const now = new Date().toISOString();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    set((state) => {
      const updated = state.messages.map((m) =>
        m.id === messageId && !m.readAt ? { ...m, readAt: now } : m
      );
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isOnline) {
      try {
        await supabase
          .from("chat_messages")
          .update({ read_at: now })
          .eq("id", messageId);
      } catch (e) {
        enqueuePendingAction({ type: "MARK_READ", payload: { messageId, readAt: now } });
      }
    } else {
      enqueuePendingAction({ type: "MARK_READ", payload: { messageId, readAt: now } });
    }
  },

  markAllPartnerMessagesAsRead: async (activeUserId) => {
    const { messages } = get();
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const now = new Date().toISOString();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const unreadPartnerMessageIds = messages
      .filter((m) => m.senderId !== activeUserId && !m.readAt)
      .map((m) => m.id);

    if (unreadPartnerMessageIds.length === 0) return;

    set((state) => {
      const updated = state.messages.map((m) =>
        m.senderId !== activeUserId && !m.readAt ? { ...m, readAt: now } : m
      );
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isOnline) {
      try {
        await supabase
          .from("chat_messages")
          .update({ read_at: now })
          .in("id", unreadPartnerMessageIds);
      } catch (e) {
        unreadPartnerMessageIds.forEach((id) =>
          enqueuePendingAction({ type: "MARK_READ", payload: { messageId: id, readAt: now } })
        );
      }
    } else {
      unreadPartnerMessageIds.forEach((id) =>
        enqueuePendingAction({ type: "MARK_READ", payload: { messageId: id, readAt: now } })
      );
    }
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

