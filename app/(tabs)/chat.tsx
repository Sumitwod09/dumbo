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
  Animated,
  Vibration,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { toast } from "@/components/Toast";
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
  Heart,
  Search,
  UserPlus,
  Copy,
  Sparkles,
  PhoneCall,
  X,
  UserCheck,
  Users,
  Coffee,
  Smile,
  Music,
  ThumbsUp,
  Clock,
} from "lucide-react-native";

export default function ChatScreen() {
  const [inputText, setInputText] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputPairingCode, setInputPairingCode] = useState("");
  const [isPairingLoading, setIsPairingLoading] = useState(false);
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

  const {
    getActiveUser,
    getPartnerUser,
    isPaired,
    couple,
    availableUsers,
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    fetchAvailableUsers,
    sendPartnerRequest,
    acceptPartnerRequest,
    declinePartnerRequest,
    getIncomingRequests,
    getRequestStatusForUser,
    pairWithUser,
    setPairingCode,
    unpairCouple,
  } = useCoupleStore();

  const { colors, isDark } = useThemeStore();

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();
  const incomingRequests = getIncomingRequests();

  // Filter users by search query
  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      u.displayName.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  // Fetch available users and messages on mount
  useEffect(() => {
    fetchAvailableUsers();
    if (isPaired && couple.id) {
      fetchMessages(couple.id);
    }
  }, [isPaired, couple.id]);

  // Mark partner messages as read when screen is viewed
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

  const handleSend = useCallback(
    (textToSend?: string) => {
      const text = (textToSend || inputText).trim();
      if (!text) return;
      sendMessage(text, activeUser.id, activeUser.displayName);
      if (!textToSend) setInputText("");
    },
    [inputText, activeUser.id, activeUser.displayName]
  );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      sendPhotoMessage(uri, activeUser.id, activeUser.displayName, "Shared a photo");
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(couple.pairingCode || "DUO-HUB");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinWithCode = async () => {
    const code = inputPairingCode.trim().toUpperCase();
    if (!code) {
      toast.warning("Pairing Code Required", "Please enter a code to join your partner.");
      return;
    }
    setIsPairingLoading(true);
    try {
      const res = await setPairingCode(code);
      if (res.success) {
        toast.success("Pairing Successful", res.message || "Connected with partner!");
        setInputPairingCode("");
      } else {
        toast.error("Pairing Failed", res.message || "Could not link with that code.");
      }
    } catch (err: any) {
      toast.error("Pairing Error", err?.message || "An unexpected error occurred.");
    } finally {
      setIsPairingLoading(false);
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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const quickActions = [
    { id: "heart", Icon: Heart, color: "#f43f5e", fill: "#f43f5e", text: "Love you!" },
    { id: "sparkles", Icon: Sparkles, color: "#eab308", fill: undefined, text: "Thinking of you" },
    { id: "coffee", Icon: Coffee, color: "#b45309", fill: undefined, text: "Coffee break?" },
    { id: "smile", Icon: Smile, color: "#10b981", fill: undefined, text: "Hey there!" },
    { id: "music", Icon: Music, color: "#8b5cf6", fill: undefined, text: "Listening to music" },
    { id: "thumbsup", Icon: ThumbsUp, color: "#0284c7", fill: undefined, text: "Sounds good!" },
  ];

  const showIncomingCallModal =
    callState.isCallActive &&
    callState.callDirection === "incoming" &&
    callState.callStatus === "ringing";

  const showActiveCallOverlay =
    callState.isCallActive &&
    (callState.callStatus === "connected" ||
      (callState.callStatus === "ringing" && callState.callDirection === "outgoing"));

  // ==========================================
  // UNPAIRED STATE: Connect with Partner Hub
  // ==========================================
  if (!isPaired) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.unpairedScrollContent}
      >
        {/* Hero Card */}
        <View style={styles.unpairedHeroCard}>
          <View style={styles.heroHeartCircle}>
            <Heart size={32} color="#f43f5e" fill="#f43f5e" />
          </View>
          <Text style={styles.unpairedHeroTitle}>Private 2-User Hub</Text>
          <Text style={styles.unpairedHeroSubtitle}>
            Dumbo is a private 1-on-1 space for you and your partner. Connect with your partner below to unlock live chat, instant audio & video calls, shared music, and hydration sync!
          </Text>

          {/* Quick Demo Pair Button */}
          <TouchableOpacity
            onPress={() => {
              const demoUser = availableUsers.find((u) => u.id !== activeUser.id) || {
                id: "user_kirti",
                coupleId: "",
                displayName: "Kirti Chaudhari",
                username: "kirti",
                avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kirti",
                isOnline: true,
                isDnd: false,
              };
              pairWithUser(demoUser);
            }}
            style={styles.quickPairBtn}
          >
            <Sparkles size={16} color="#ffffff" />
            <Text style={styles.quickPairBtnText}>Instant Pair with Partner (Demo / Test)</Text>
          </TouchableOpacity>
        </View>

        {/* Incoming Partner Requests */}
        {incomingRequests.length > 0 && (
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Heart size={16} color="#f43f5e" fill="#f43f5e" />
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                Incoming Connection Request
              </Text>
            </View>
            {incomingRequests.map((req) => (
              <View key={req.id} style={styles.incomingReqItem}>
                <Image source={{ uri: req.fromUserAvatar }} style={styles.userAvatar} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.userNameText, { color: colors.text }]}>{req.fromUserName}</Text>
                  <Text style={styles.userRoleText}>wants to connect as your partner</Text>
                </View>
                <View style={styles.reqActionBtns}>
                  <TouchableOpacity
                    onPress={() => acceptPartnerRequest(req.id)}
                    style={styles.acceptBtn}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => declinePartnerRequest(req.id)}
                    style={styles.declineBtn}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Users & Search */}
        <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Users size={16} color="#f43f5e" />
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
              Find & Connect With Registered Users
            </Text>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }]}>
            <Search size={14} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or @username..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearchQuery} style={{ padding: 4 }}>
                <X size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* User List */}
          <View style={styles.userList}>
            {filteredUsers.length === 0 ? (
              <Text style={styles.emptyUserListText}>No users found matching "{searchQuery}"</Text>
            ) : (
              filteredUsers.map((u) => {
                const isCurrent = u.id === activeUser.id;
                const reqStatus = getRequestStatusForUser(u.id);

                return (
                  <View key={u.id} style={[styles.userRow, { borderColor: colors.border }]}>
                    <View style={styles.userInfoLeft}>
                      <Image source={{ uri: u.avatarUrl }} style={styles.userAvatar} />
                      <View>
                        <View style={styles.nameWithDot}>
                          <Text style={[styles.userNameText, { color: colors.text }]}>
                            {u.displayName} {isCurrent ? "(You)" : ""}
                          </Text>
                          <View
                            style={[
                              styles.onlineStatusDot,
                              { backgroundColor: u.isOnline ? "#10b981" : "#94a3b8" },
                            ]}
                          />
                        </View>
                        <Text style={styles.userRoleText}>
                          {u.username ? `@${u.username}` : "registered user"}
                        </Text>
                      </View>
                    </View>

                    {!isCurrent && (
                      <View>
                        {reqStatus === "accepted" ? (
                          <View style={styles.connectedBadge}>
                            <Heart size={11} color="#15803d" fill="#15803d" />
                            <Text style={styles.connectedBadgeText}>Connected</Text>
                          </View>
                        ) : reqStatus === "pending_sent" ? (
                          <View style={styles.pendingBadge}>
                            <Clock size={11} color="#b45309" />
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => pairWithUser(u)}
                            style={styles.connectUserBtn}
                          >
                            <UserPlus size={13} color="#ffffff" />
                            <Text style={styles.connectUserBtnText}>Connect & Chat</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Pairing Code Card */}
        <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHeaderTitle, { color: colors.text, marginBottom: 4 }]}>
            Your Pairing Code
          </Text>
          <Text style={styles.codeSubtitle}>
            Share this pairing code with your partner so they can connect with you directly.
          </Text>
          <View style={[styles.codeDisplayBox, { backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }]}>
            <Text style={[styles.codeDisplayText, { color: colors.text }]}>
              {couple.pairingCode || "DUO-HUB"}
            </Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyCodeBtn}>
              {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#f43f5e" />}
              <Text style={[styles.copyCodeText, { color: copiedCode ? "#10b981" : "#f43f5e" }]}>
                {copiedCode ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Join Partner with Code */}
          <View style={[styles.enterCodeDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.cardHeaderTitle, { color: colors.text, marginBottom: 4 }]}>
            Join Partner With Code
          </Text>
          <Text style={styles.codeSubtitle}>
            Have your partner's code? Enter it below to link your accounts together instantly.
          </Text>
          <View style={styles.enterCodeRow}>
            <TextInput
              value={inputPairingCode}
              onChangeText={setInputPairingCode}
              placeholder="e.g. DUO-HUB"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              maxLength={12}
              style={[
                styles.enterCodeInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  borderColor: colors.border,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleJoinWithCode}
              disabled={isPairingLoading || !inputPairingCode.trim()}
              style={[
                styles.enterCodeBtn,
                (!inputPairingCode.trim() || isPairingLoading) && styles.enterCodeBtnDisabled,
              ]}
            >
              {isPairingLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.enterCodeBtnText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==========================================
  // PAIRED STATE: Active Chat View
  // ==========================================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Top Action Bar */}
      <View style={[styles.topBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.topBarLeft}>
          <Image source={{ uri: partnerUser.avatarUrl }} style={styles.topPartnerAvatar} />
          <View>
            <View style={styles.nameRow}>
              <Text style={[styles.topBarTitle, { color: colors.text }]}>
                {partnerUser.displayName}
              </Text>
              <View
                style={[
                  styles.onlineStatusDot,
                  { backgroundColor: partnerUser.isOnline ? "#10b981" : "#94a3b8" },
                ]}
              />
            </View>
            <Text style={[styles.topBarSub, { color: colors.textSecondary }]}>
              {partnerUser.isOnline ? "Active now" : "Offline"} • End-to-End Private
            </Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            onPress={() => startCall("audio")}
            style={[styles.callIconBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
            accessibilityLabel="Audio Call"
          >
            <Phone size={16} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => startCall("video")}
            style={[styles.callIconBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
            accessibilityLabel="Video Call"
          >
            <Video size={16} color="#f43f5e" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={unpairCouple}
            style={[styles.unpairBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
            accessibilityLabel="Switch Partner"
          >
            <UserCheck size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Action Icons Bar */}
      <View style={[styles.quickActionsBar, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}>
        {quickActions.map((action) => {
          const IconComp = action.Icon;
          return (
            <TouchableOpacity
              key={action.id}
              onPress={() => handleSend(action.text)}
              style={[
                styles.actionIconPill,
                { backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: colors.border },
              ]}
              accessibilityLabel={action.text}
            >
              <IconComp size={15} color={action.color} fill={action.fill} />
            </TouchableOpacity>
          );
        })}
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
            <MessageCircle size={44} color="#cbd5e1" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Say hi to {partnerUser.displayName}!
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
                        <View style={styles.pendingSyncBox}>
                          <Clock size={9} color="#fde68a" />
                          <Text style={styles.pendingSyncText}>Pending</Text>
                        </View>
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

      {/* Input Bar */}
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
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          blurOnSubmit={false}
          multiline
        />

        <TouchableOpacity
          onPress={() => handleSend()}
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          disabled={!inputText.trim()}
        >
          <Send size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ===== INCOMING CALL MODAL ===== */}
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

      {/* ===== ACTIVE CALL OVERLAY ===== */}
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

  // ===== UNPAIRED VIEW STYLES =====
  unpairedScrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  unpairedHeroCard: {
    backgroundColor: "#f43f5e",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#f43f5e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeartCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  unpairedHeroTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  unpairedHeroSubtitle: {
    color: "#ffe4e6",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  quickPairBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickPairBtnText: {
    color: "#e11d48",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  incomingReqItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  reqActionBtns: {
    flexDirection: "row",
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  declineBtn: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  declineBtnText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  userList: {
    gap: 10,
  },
  emptyUserListText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    paddingVertical: 14,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  userInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e2e8f0",
  },
  nameWithDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  onlineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userRoleText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },
  connectedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectedBadgeText: {
    color: "#15803d",
    fontSize: 11,
    fontWeight: "bold",
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pendingBadgeText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "bold",
  },
  connectUserBtn: {
    backgroundColor: "#f43f5e",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectUserBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  codeSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 8,
  },
  codeDisplayBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  codeDisplayText: {
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  copyCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  copyCodeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  // ===== PAIRED CHAT STYLES =====
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
    gap: 10,
  },
  topPartnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f43f5e",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  topBarSub: {
    fontSize: 10,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unpairBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  actionIconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
    marginBottom: 6,
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
  pendingSyncBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
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
  enterCodeDivider: {
    height: 1,
    marginVertical: 14,
  },
  enterCodeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  enterCodeInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  enterCodeBtn: {
    backgroundColor: "#f43f5e",
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  enterCodeBtnDisabled: {
    opacity: 0.5,
  },
  enterCodeBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
