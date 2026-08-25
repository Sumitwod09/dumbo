import { create } from "zustand";
import { ChatMessage } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";
import {
  saveLocalMessages,
  getLocalMessages,
  enqueuePendingAction,
} from "@/lib/offline/storageEngine";
import { syncEngine } from "@/lib/offline/syncEngine";

export interface CallState {
  isCallActive: boolean;
  callType: "audio" | "video";
  callDirection: "outgoing" | "incoming" | null;
  callStatus: "idle" | "ringing" | "connecting" | "connected" | "ended" | "declined";
  callId: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  durationSeconds: number;
  callerName: string;
  callerAvatar: string;
}

export interface ExtendedChatMessage extends ChatMessage {
  isPendingSync?: boolean;
}

// Track active channel subscriptions to prevent duplicates
let activeChatChannel: ReturnType<typeof supabase.channel> | null = null;
let activeCallChannel: ReturnType<typeof supabase.channel> | null = null;
let activeChatCoupleId: string | null = null;

interface ChatState {
  messages: ExtendedChatMessage[];
  callState: CallState;

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
  initiateCall: (type: "audio" | "video") => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  subscribeToCallSignals: (coupleId: string) => (() => void) | undefined;
  cleanupSubscriptions: () => void;
}

const DEFAULT_CALL_STATE: CallState = {
  isCallActive: false,
  callType: "video",
  callDirection: null,
  callStatus: "idle",
  callId: null,
  isMuted: false,
  isCameraOff: false,
  durationSeconds: 0,
  callerName: "",
  callerAvatar: "",
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: getLocalMessages(),
  callState: { ...DEFAULT_CALL_STATE },

  fetchMessages: async (coupleId: string) => {
    // Prevent duplicate subscriptions for the same couple
    if (activeChatCoupleId === coupleId && activeChatChannel) {
      // Already subscribed, just refresh data
    } else {
      // Cleanup previous subscription
      if (activeChatChannel) {
        try {
          supabase.removeChannel(activeChatChannel);
        } catch {}
        activeChatChannel = null;
        activeChatCoupleId = null;
      }
    }

    const cached = getLocalMessages();
    if (cached && cached.length > 0) {
      set({ messages: cached });
    }

    const isConnected = await syncEngine.isOnline();
    if (!isConnected) return;

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

        // Merge with pending local messages that haven't been synced yet
        const { messages: currentMessages } = get();
        const pendingMessages = currentMessages.filter(
          (m) => m.isPendingSync && !fetchedMessages.some((fm) => fm.id === m.id)
        );

        const merged = [...fetchedMessages, ...pendingMessages];
        set({ messages: merged });
        saveLocalMessages(merged);
      }
    } catch (err) {
      console.warn("Failed to fetch remote messages, using local cache:", err);
    }

    // Only create a new subscription if not already subscribed to this couple
    if (activeChatCoupleId !== coupleId) {
      try {
        const channel = supabase
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
                  // Deduplicate: skip if we already have this message ID or if it's a temp message we sent
                  if (state.messages.some((msg) => msg.id === newMsg.id)) return state;
                  // Also replace any temp messages that match (same sender, same content, within 5 seconds)
                  const tempMatch = state.messages.find(
                    (msg) =>
                      msg.id.startsWith("msg-temp-") &&
                      msg.senderId === newMsg.senderId &&
                      msg.content === newMsg.content &&
                      Math.abs(new Date(msg.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 5000
                  );

                  let updated;
                  if (tempMatch) {
                    updated = state.messages.map((msg) =>
                      msg.id === tempMatch.id ? { ...newMsg, isPendingSync: false } : msg
                    );
                  } else {
                    updated = [...state.messages, newMsg];
                  }
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

        activeChatChannel = channel;
        activeChatCoupleId = coupleId;
      } catch (err) {
        console.warn("Realtime subscription bypassed in offline mode");
      }
    }
  },

  sendMessage: async (content, senderId, senderName) => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const tempId = `msg-temp-${Date.now()}`;
    const isConnected = await syncEngine.isOnline();

    const newMsg: ExtendedChatMessage = {
      id: tempId,
      coupleId: couple.id,
      senderId,
      senderName,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
      isPendingSync: !isConnected,
    };

    set((state) => {
      const updated = [...state.messages, newMsg];
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isConnected) {
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

    enqueuePendingAction({
      type: "SEND_MESSAGE",
      payload: { coupleId: couple.id, senderId, senderName, content },
    });
  },

  sendPhotoMessage: async (photoUrl, senderId, senderName, caption = "") => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const tempId = `msg-temp-${Date.now()}`;
    const isConnected = await syncEngine.isOnline();

    const newMsg: ExtendedChatMessage = {
      id: tempId,
      coupleId: couple.id,
      senderId,
      senderName,
      content: caption,
      photoStoragePath: photoUrl,
      readAt: null,
      createdAt: new Date().toISOString(),
      isPendingSync: !isConnected,
    };

    set((state) => {
      const updated = [...state.messages, newMsg];
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isConnected) {
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
      payload: { coupleId: couple.id, senderId, senderName, content: caption, photoStoragePath: photoUrl },
    });
  },

  markAsRead: async (messageId) => {
    const now = new Date().toISOString();
    const isConnected = await syncEngine.isOnline();

    set((state) => {
      const updated = state.messages.map((m) =>
        m.id === messageId && !m.readAt ? { ...m, readAt: now } : m
      );
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isConnected) {
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
    const isConnected = await syncEngine.isOnline();
    const unreadPartnerMessageIds = messages
      .filter((m) => m.senderId !== activeUserId && !m.readAt && !m.id.startsWith("msg-temp-"))
      .map((m) => m.id);

    if (unreadPartnerMessageIds.length === 0) return;

    set((state) => {
      const updated = state.messages.map((m) =>
        m.senderId !== activeUserId && !m.readAt ? { ...m, readAt: now } : m
      );
      saveLocalMessages(updated);
      return { messages: updated };
    });

    if (isConnected) {
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

  // ===== CALL SIGNALING =====

  initiateCall: async (type: "audio" | "video") => {
    const { couple, getActiveUser, getPartnerUser } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const activeUser = getActiveUser();
    const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Set local call state immediately
    set({
      callState: {
        isCallActive: true,
        callType: type,
        callDirection: "outgoing",
        callStatus: "ringing",
        callId,
        isMuted: false,
        isCameraOff: false,
        durationSeconds: 0,
        callerName: activeUser.displayName,
        callerAvatar: activeUser.avatarUrl,
      },
    });

    // Signal the partner via Supabase Realtime broadcast
    const isConnected = await syncEngine.isOnline();
    if (isConnected) {
      try {
        const callChannel = supabase.channel(`call_signals:${couple.id}`);
        await callChannel.subscribe();
        await callChannel.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            action: "initiate",
            callId,
            callType: type,
            callerId: activeUser.id,
            callerName: activeUser.displayName,
            callerAvatar: activeUser.avatarUrl,
            timestamp: new Date().toISOString(),
          },
        });
        // Don't remove — keep broadcasting channel alive
      } catch (err) {
        console.warn("Failed to send call signal:", err);
      }
    }

    // Auto-timeout: if no answer in 45 seconds, end the call
    setTimeout(() => {
      const current = get().callState;
      if (current.callId === callId && current.callStatus === "ringing") {
        get().endCall();
      }
    }, 45000);
  },

  acceptCall: async () => {
    const { callState } = get();
    const { couple, getActiveUser } = useCoupleStore.getState();
    if (!couple?.id || !callState.callId) return;

    set((state) => ({
      callState: {
        ...state.callState,
        callStatus: "connected",
        isCallActive: true,
      },
    }));

    // Signal back to caller
    const isConnected = await syncEngine.isOnline();
    if (isConnected) {
      try {
        const activeUser = getActiveUser();
        const callChannel = supabase.channel(`call_signals:${couple.id}`);
        await callChannel.subscribe();
        await callChannel.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            action: "accept",
            callId: callState.callId,
            acceptorId: activeUser.id,
            acceptorName: activeUser.displayName,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Failed to send accept signal:", err);
      }
    }
  },

  declineCall: async () => {
    const { callState } = get();
    const { couple, getActiveUser } = useCoupleStore.getState();

    set({ callState: { ...DEFAULT_CALL_STATE } });

    if (couple?.id && callState.callId) {
      const isConnected = await syncEngine.isOnline();
      if (isConnected) {
        try {
          const activeUser = getActiveUser();
          const callChannel = supabase.channel(`call_signals:${couple.id}`);
          await callChannel.subscribe();
          await callChannel.send({
            type: "broadcast",
            event: "call_signal",
            payload: {
              action: "decline",
              callId: callState.callId,
              declinerId: activeUser.id,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.warn("Failed to send decline signal:", err);
        }
      }
    }
  },

  subscribeToCallSignals: (coupleId: string) => {
    if (!coupleId) return undefined;

    // Cleanup existing call subscription
    if (activeCallChannel) {
      try {
        supabase.removeChannel(activeCallChannel);
      } catch {}
      activeCallChannel = null;
    }

    try {
      const channel = supabase
        .channel(`call_signals:${coupleId}`)
        .on("broadcast", { event: "call_signal" }, (payload: any) => {
          const data = payload.payload;
          const { couple, getActiveUser } = useCoupleStore.getState();
          const activeUser = getActiveUser();

          if (!data || !data.action) return;

          switch (data.action) {
            case "initiate":
              // Only respond if this call is NOT from us
              if (data.callerId !== activeUser.id) {
                set({
                  callState: {
                    isCallActive: true,
                    callType: data.callType || "video",
                    callDirection: "incoming",
                    callStatus: "ringing",
                    callId: data.callId,
                    isMuted: false,
                    isCameraOff: false,
                    durationSeconds: 0,
                    callerName: data.callerName || "Partner",
                    callerAvatar: data.callerAvatar || "",
                  },
                });
              }
              break;

            case "accept":
              // The other person accepted our call
              if (data.acceptorId !== activeUser.id) {
                set((state) => ({
                  callState: {
                    ...state.callState,
                    callStatus: "connected",
                  },
                }));
              }
              break;

            case "decline":
              // The other person declined our call
              if (data.declinerId !== activeUser.id) {
                set({ callState: { ...DEFAULT_CALL_STATE, callStatus: "declined" } });
                // Auto-clear declined status after 3 seconds
                setTimeout(() => {
                  set({ callState: { ...DEFAULT_CALL_STATE } });
                }, 3000);
              }
              break;

            case "end":
              // Other person ended the call
              if (data.enderId !== activeUser.id) {
                set({ callState: { ...DEFAULT_CALL_STATE } });
              }
              break;
          }
        })
        .subscribe();

      activeCallChannel = channel;

      return () => {
        if (activeCallChannel) {
          try {
            supabase.removeChannel(activeCallChannel);
          } catch {}
          activeCallChannel = null;
        }
      };
    } catch (err) {
      console.warn("Failed to subscribe to call signals:", err);
      return undefined;
    }
  },

  startCall: (type) => {
    // This now delegates to initiateCall for Supabase signaling
    get().initiateCall(type);
  },

  endCall: async () => {
    const { callState } = get();
    const { couple, getActiveUser } = useCoupleStore.getState();

    set({ callState: { ...DEFAULT_CALL_STATE } });

    // Signal to partner that call ended
    if (couple?.id && callState.callId) {
      const isConnected = await syncEngine.isOnline();
      if (isConnected) {
        try {
          const activeUser = getActiveUser();
          const callChannel = supabase.channel(`call_signals:${couple.id}`);
          await callChannel.subscribe();
          await callChannel.send({
            type: "broadcast",
            event: "call_signal",
            payload: {
              action: "end",
              callId: callState.callId,
              enderId: activeUser.id,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.warn("Failed to send end call signal:", err);
        }
      }
    }
  },

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
      callState: { ...state.callState, durationSeconds: state.callState.durationSeconds + 1 },
    })),

  cleanupSubscriptions: () => {
    if (activeChatChannel) {
      try {
        supabase.removeChannel(activeChatChannel);
      } catch {}
      activeChatChannel = null;
      activeChatCoupleId = null;
    }
    if (activeCallChannel) {
      try {
        supabase.removeChannel(activeCallChannel);
      } catch {}
      activeCallChannel = null;
    }
  },
}));
