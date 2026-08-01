// WebRTC Peer Connection Helper

const defaultIceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function createPeerConnection(iceServers: RTCIceServer[] = defaultIceServers): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers });
}

export async function getMediaStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return null;
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.warn("getMediaStream error:", err);
    return null;
  }
}

export function attachStreamToVideoElement(stream: MediaStream | null, videoElement: HTMLVideoElement | null) {
  if (!videoElement) return;
  videoElement.srcObject = stream;
  if (stream) {
    videoElement.play().catch(() => {});
  }
}

export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}
