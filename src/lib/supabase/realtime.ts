import { supabase } from "./client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./queries";

export interface RealtimeHandlers {
  onChatMessage?: (payload: any) => void;
  onSongChange?: (payload: any) => void;
  onHydrationLog?: (payload: any) => void;
  onDoodleChange?: (payload: any) => void;
  onUserUpdate?: (payload: any) => void;
  onCanvasStrokeBroadcast?: (stroke: any) => void;
  onTimerBroadcast?: (timerState: any) => void;
}

export function subscribeToCoupleChannel(
  coupleId: string,
  handlers: RealtimeHandlers
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase.channel(`couple-room:${coupleId}`, {
    config: {
      presence: { key: coupleId },
      broadcast: { self: false },
    },
  });

  // Table listeners
  channel
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `couple_id=eq.${coupleId}` },
      (payload) => handlers.onChatMessage && handlers.onChatMessage(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "songs", filter: `couple_id=eq.${coupleId}` },
      (payload) => handlers.onSongChange && handlers.onSongChange(payload)
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "hydration_logs", filter: `couple_id=eq.${coupleId}` },
      (payload) => handlers.onHydrationLog && handlers.onHydrationLog(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "saved_doodles", filter: `couple_id=eq.${coupleId}` },
      (payload) => handlers.onDoodleChange && handlers.onDoodleChange(payload)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "users", filter: `couple_id=eq.${coupleId}` },
      (payload) => handlers.onUserUpdate && handlers.onUserUpdate(payload.new)
    );

  // Broadcast listeners
  channel
    .on("broadcast", { event: "canvas-stroke" }, ({ payload }) => {
      if (handlers.onCanvasStrokeBroadcast) handlers.onCanvasStrokeBroadcast(payload);
    })
    .on("broadcast", { event: "timer-sync" }, ({ payload }) => {
      if (handlers.onTimerBroadcast) handlers.onTimerBroadcast(payload);
    });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log(`Subscribed to couple realtime channel: ${coupleId}`);
    }
  });

  return channel;
}

export function broadcastCanvasStroke(channel: RealtimeChannel | null, stroke: any) {
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "canvas-stroke",
    payload: stroke,
  });
}

export function broadcastTimerSync(channel: RealtimeChannel | null, timerState: any) {
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "timer-sync",
    payload: timerState,
  });
}
