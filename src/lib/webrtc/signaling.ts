import { RealtimeChannel } from "@supabase/supabase-js";

export interface SignalPayload {
  type: "offer" | "answer" | "ice-candidate" | "end-call";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  callType?: "audio" | "video";
}

export function sendSignal(channel: RealtimeChannel | null, payload: SignalPayload) {
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "webrtc-signal",
    payload,
  });
}

export function listenForSignals(
  channel: RealtimeChannel | null,
  onSignal: (payload: SignalPayload) => void
) {
  if (!channel) return () => {};

  channel.on("broadcast", { event: "webrtc-signal" }, ({ payload }) => {
    onSignal(payload);
  });

  return () => {
    // Listener remains attached to channel life cycle
  };
}
