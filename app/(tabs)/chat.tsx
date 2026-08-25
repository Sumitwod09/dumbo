import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Vibration,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useChatStore } from "@/stores/useChatStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Video,
  Phone,
  Check,
  CheckCheck,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Lock,
  PhoneCall,
  PhoneIncoming,
  X,
} from "lucide-react-native";

export default function ChatScreen() {
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    messages,
    callState,
    sendMessage,
    sendPhotoMessage,
    fetchMessages,
    markAllPartnerMessagesAsRead,
    startCall,
    endCall,
    acceptCall,
    declineCall,
    toggleMute,
    toggleCamera,
    incrementCallDuration,
  } = useChatStore();

  const { getActiveUser, getPartnerUser, isPaired, couple } = useCoupleStore();
  const { colors, isDark } = useThemeStore();

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  // Fetch messages on mount when paired
  useEffect(() => {
    if (isPaired && couple.id) {
      fetchMessages(couple.id);
    }
  }, [isPaired, couple.id]);

  // Mark partner messages as read when screen is focused / messages change
  useEffect(() => {
    if (isPaired && activeUser.id && messages.length > 0) {
      const hasUnread = messages.some(
        (m) => m.senderId !== activeUser.id && !m.readAt
      );
      if (hasUnread) {
        markAllPartnerMessagesAsRead(activeUser.id);
      }
    }
  }, [messages.length, isPaired, activeUser.id]);

  // Call duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (callState.callStatus === "connected") {
      interval = setInterval(incrementCallDuration, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.callStatus]);

  // Ringing animation for incoming calls
  useEffect(() => {
    if (callState.callStatus === "ringing" && callState.callDirection === "incoming") {
      Vibration.vibrate([0, 500, 200, 500], true);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
        Vibration.cancel();
      };
    }
  }, [callState.callStatus, callState.callDirection]);

  // Ringing animation for outgoing calls
  useEffect(() => {
    if (callState.callStatus === "ringing" && callState.callDirection === "outgoing") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callState.callStatus, callState.callDirection]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim(), activeUser.id, activeUser.displayName);
    setInputText("");
  }, [inputText, activeUser.id, activeUser.displayName]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      sendPhotoMessage(uri, activeUser.id, activeUser.displayName, "Shared a photo ✨");
    }
  };

  const formatCallDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Determine if we should show the incoming call modal
  const showIncomingCallModal =
    callState.isCallActive &&
    callState.callDirection === "incoming" &&
    callState.callStatus === "ringing";

  // Determine if we should show the active call overlay
  const showActiveCallOverlay =
    callState.isCallActive &&
    (callState.callStatus === "connected" ||
      (callState.callStatus === "ringing" && callState.callDirection === "outgoing"));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Top Action Bar */}
      <View style={[styles.topBar, { borderColor: colors.border }]}>
        <View style={styles.topBarLeft}>
          <MessageCircle size={20} color="#f43f5e" />
          <View>
            <Text style={[styles.topBarTitle, { color: colors.text }]}>Private Chat</Text>
            <Text style={[styles.topBarSub, { color: colors.textSecondary }]}>
              End-to-End Isolated (2-User)
            </Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            onPress={() => startCall("audio")}
            style={[styles.callIconBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
          >
            <Phone size={16} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => startCall("video")}
            style={[styles.callIconBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
          >
            <Video size={16} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Thread */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={40} color="#cbd5e1" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Say hi to your partner! 💬
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === activeUser.id;

          return (
            <View style={[styles.messageWrapper, isMine ? styles.mineWrapper : styles.partnerWrapper]}>
              <Text style={styles.senderLabel}>{item.senderName}</Text>
              <View
                style={[
                  styles.bubble,
                  isMine
                    ? styles.mineBubble
                    : [styles.partnerBubble, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}
              >
                {item.photoStoragePath ? (
                  <Image source={{ uri: item.photoStoragePath }} style={styles.photoAttachment} />
                ) : null}
                {item.content ? (
                  <Text style={[styles.messageText, { color: isMine ? "#ffffff" : colors.text }]}>
                    {item.content}
                  </Text>
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={[styles.metaTime, { color: isMine ? "#fecdd3" : "#94a3b8" }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {isMine && (
                    <View>
                      {item.isPendingSync ? (
                        <Text style={styles.pendingSyncText}>Pending ⏳</Text>
                      ) : item.readAt ? (
                        <CheckCheck size={12} color="#bae6fd" />
                      ) : (
                        <Check size={12} color="#fecdd3" />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Input Bar or Gating Guard */}
      {isPaired ? (
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn}>
            <ImageIcon size={18} color="#64748b" />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message your partner..."
            placeholderTextColor="#94a3b8"
            style={[styles.input, { color: colors.text }]}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
          >
            <Send size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.lockedGuard}>
          <Lock size={16} color="#e11d48" />
          <Text style={styles.lockedTitle}>🔒 Private 2-User Hub is Locked</Text>
          <Text style={styles.lockedSub}>
            Search for your partner, send a request, and accept to unlock private chat.
          </Text>
        </View>
      )}

      {/* ===== INCOMING CALL MODAL (Ringing) ===== */}
      <Modal visible={showIncomingCallModal} animationType="fade" transparent>
        <View style={styles.incomingCallOverlay}>
          <View style={styles.incomingCallCard}>
            <View style={styles.incomingCallPulseWrap}>
              <Animated.View
                style={[
                  styles.incomingCallAvatarRing,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Image
                  source={{ uri: callState.callerAvatar || partnerUser.avatarUrl }}
                  style={styles.incomingCallAvatar}
                />
              </Animated.View>
            </View>

            <Text style={styles.incomingCallName}>
              {callState.callerName || partnerUser.displayName}
            </Text>
            <View style={styles.incomingCallTypeBadge}>
              {callState.callType === "video" ? (
                <Video size={14} color="#f43f5e" />
              ) : (
                <PhoneCall size={14} color="#10b981" />
              )}
              <Text style={styles.incomingCallTypeText}>
                Incoming {callState.callType === "video" ? "Video" : "Audio"} Call
              </Text>
            </View>

            <View style={styles.incomingCallActions}>
              <TouchableOpacity onPress={declineCall} style={styles.declineCallBtn}>
                <PhoneOff size={28} color="#fff" />
                <Text style={styles.callActionLabel}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={acceptCall} style={styles.acceptCallBtn}>
                <Phone size={28} color="#fff" />
                <Text style={styles.callActionLabel}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== ACTIVE CALL OVERLAY (Connected / Outgoing Ringing) ===== */}
      <Modal visible={showActiveCallOverlay} animationType="fade">
        <View style={styles.callModalContainer}>
          <View style={styles.callHeader}>
            <View style={styles.callTypeBadge}>
              <View
                style={[
                  styles.callDot,
                  {
                    backgroundColor:
                      callState.callStatus === "connected" ? "#10b981" : "#f59e0b",
                  },
                ]}
              />
              <Text style={styles.callTypeText}>
                {callState.callStatus === "ringing"
                  ? `Calling ${partnerUser.displayName}...`
                  : `1-on-1 ${callState.callType === "video" ? "Video" : "Audio"} Call`}
              </Text>
            </View>
            {callState.callStatus === "connected" ? (
              <Text style={styles.callDuration}>
                {formatCallDuration(callState.durationSeconds)}
              </Text>
            ) : (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <PhoneCall size={20} color="#f59e0b" />
              </Animated.View>
            )}
          </View>

          {/* Video Stream Feeds */}
          <View style={styles.streamContainer}>
            <Image source={{ uri: partnerUser.avatarUrl }} style={styles.remoteFeed} />
            <View style={styles.remoteNameTag}>
              <Text style={styles.remoteNameText}>{partnerUser.displayName}</Text>
            </View>

            {callState.callStatus === "ringing" && (
              <View style={styles.ringingOverlay}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <PhoneCall size={48} color="#ffffff" />
                </Animated.View>
                <Text style={styles.ringingText}>Ringing...</Text>
              </View>
            )}

            {/* Self Video PiP */}
            <View style={styles.pipContainer}>
              {callState.isCameraOff ? (
                <View style={styles.camOffBox}>
                  <Text style={styles.camOffText}>Cam Off</Text>
                </View>
              ) : (
                <Image source={{ uri: activeUser.avatarUrl }} style={styles.pipFeed} />
              )}
            </View>
          </View>

          {/* Call Controls */}
          <View style={styles.callControlsRow}>
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.ctrlBtn, callState.isMuted && styles.ctrlBtnActive]}
            >
              {callState.isMuted ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
              <Text style={styles.ctrlBtnLabel}>{callState.isMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={endCall} style={styles.hangupBtn}>
              <PhoneOff size={28} color="#fff" />
              <Text style={styles.hangupLabel}>End</Text>
            </TouchableOpacity>

            {callState.callType === "video" && (
              <TouchableOpacity
                onPress={toggleCamera}
                style={[styles.ctrlBtn, callState.isCameraOff && styles.ctrlBtnActive]}
              >
                {callState.isCameraOff ? <VideoOff size={24} color="#fff" /> : <Video size={24} color="#fff" />}
                <Text style={styles.ctrlBtnLabel}>{callState.isCameraOff ? "Cam On" : "Cam Off"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  topBarSub: {
    fontSize: 10,
  },
  topBarRight: {
    flexDirection: "row",
    gap: 8,
  },
  callIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    padding: 14,
    gap: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11,
    marginTop: 2,
  },
  messageWrapper: {
    marginBottom: 8,
  },
  mineWrapper: {
    alignItems: "flex-end",
  },
  partnerWrapper: {
    alignItems: "flex-start",
  },
  senderLabel: {
    fontSize: 9,
    color: "#94a3b8",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 10,
  },
  mineBubble: {
    backgroundColor: "#f43f5e",
    borderBottomRightRadius: 2,
  },
  partnerBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  photoAttachment: {
    width: 180,
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  metaTime: {
    fontSize: 9,
  },
  pendingSyncText: {
    fontSize: 8,
    color: "#fde68a",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  attachBtn: {
    padding: 6,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    fontSize: 12,
    maxHeight: 100,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  lockedGuard: {
    backgroundColor: "#fff1f2",
    padding: 12,
    margin: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  lockedTitle: {
    color: "#e11d48",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  lockedSub: {
    color: "#475569",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },

  // ===== INCOMING CALL MODAL =====
  incomingCallOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  incomingCallCard: {
    alignItems: "center",
    width: "100%",
  },
  incomingCallPulseWrap: {
    marginBottom: 20,
  },
  incomingCallAvatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
  },
  incomingCallAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  incomingCallName: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  incomingCallTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 40,
  },
  incomingCallTypeText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "600",
  },
  incomingCallActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 50,
  },
  declineCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  callActionLabel: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },

  // ===== ACTIVE CALL OVERLAY =====
  callModalContainer: {
    flex: 1,
    backgroundColor: "#090d16",
    justifyContent: "space-between",
    padding: 24,
  },
  callHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  callTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callTypeText: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "bold",
  },
  callDuration: {
    color: "#cbd5e1",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  streamContainer: {
    flex: 1,
    marginVertical: 20,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    position: "relative",
  },
  remoteFeed: {
    width: "100%",
    height: "100%",
    opacity: 0.85,
  },
  remoteNameTag: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  remoteNameText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ringingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  ringingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    opacity: 0.8,
  },
  pipContainer: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 100,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  pipFeed: {
    width: "100%",
    height: "100%",
  },
  camOffBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  camOffText: {
    color: "#94a3b8",
    fontSize: 10,
  },
  callControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnActive: {
    backgroundColor: "#f43f5e",
  },
  ctrlBtnLabel: {
    color: "#94a3b8",
    fontSize: 8,
    marginTop: 2,
  },
  hangupBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  hangupLabel: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 2,
  },
});
