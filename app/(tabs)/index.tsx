import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useAudioStore } from "@/stores/useAudioStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useChatStore } from "@/stores/useChatStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Heart,
  Music,
  Play,
  Pause,
  Pencil,
  MessageCircle,
  Timer,
  Droplet,
  Moon,
  Sparkles,
  ChevronRight,
  Plus,
  Video,
  Download,
} from "lucide-react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { couple, toggleDnd, getActiveUser, getPartnerUser } = useCoupleStore();
  const { currentTrack, isPlaying, togglePlay } = useAudioStore();
  const { phase, remainingSeconds, isRunning, startFocus } = useTimerStore();
  const { getUserDailyTotal, dailyTargetMl, logWater } = useHydrationStore();
  const { savedDoodles } = useCanvasStore();
  const { messages, startCall } = useChatStore();
  const { colors, isDark } = useThemeStore();

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  const myWaterTotal = getUserDailyTotal(activeUser.id);
  const partnerWaterTotal = getUserDailyTotal(partnerUser.id);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const latestMessage = messages[messages.length - 1];

  const myProgress = Math.min((myWaterTotal / dailyTargetMl) * 100, 100);
  const partnerProgress = Math.min((partnerWaterTotal / dailyTargetMl) * 100, 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Shared Presence Banner */}
      <View style={styles.presenceBanner}>
        <View style={styles.bannerHeader}>
          <View style={styles.avatarRow}>
            <Image source={{ uri: activeUser.avatarUrl }} style={styles.avatar} />
            <Image source={{ uri: partnerUser.avatarUrl }} style={[styles.avatar, styles.avatarOverlap]} />
          </View>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerNames}>
              {activeUser.displayName} & {partnerUser.displayName} <Heart size={14} color="#fecdd3" fill="#fecdd3" />
            </Text>
            <Text style={styles.pairingCodeText}>
              Connected • Code: <Text style={styles.codeBold}>{couple.pairingCode}</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleDnd(activeUser.id)}
            style={[styles.dndBtn, activeUser.isDnd && styles.dndActive]}
          >
            <Moon size={12} color="#ffffff" />
            <Text style={styles.dndBtnText}>{activeUser.isDnd ? "DND On" : "DND Off"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bannerFooter}>
          <View style={styles.statusSubRow}>
            <Sparkles size={12} color="#fef08a" />
            <Text style={styles.statusSubText} numberOfLines={1}>
              {partnerUser.isDnd
                ? `${partnerUser.displayName} is in DND mode`
                : "Partner is available to talk"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              startCall("video");
              router.push("/(tabs)/chat");
            }}
            style={styles.callNowBtn}
          >
            <Video size={12} color="#e11d48" />
            <Text style={styles.callNowText}>Call Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mobile APK Download Card */}
      <View style={[styles.card, { backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: colors.border }]}>
        <View style={styles.apkRow}>
          <View style={styles.apkIconBox}>
            <Download size={18} color="#ffffff" />
          </View>
          <View style={styles.apkInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Native Mobile App (APK)</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              100% Offline Chat & Cellular SMS Fallback
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://github.com/Sumitwod09/dumbo/releases/latest/download/app-debug.apk")
            }
            style={styles.downloadBtn}
          >
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Grid Shortcuts (Audio & Pomodoro) */}
      <View style={styles.gridRow}>
        {/* Audio Card */}
        <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.gridHeader}>
            <View style={styles.iconCircleRose}>
              <Music size={14} color="#f43f5e" />
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/music")}>
              <Text style={styles.linkText}>Queue ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridBody}>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Now Playing</Text>
            <Text style={[styles.cardBoldTitle, { color: colors.text }]} numberOfLines={1}>
              {currentTrack?.title || "No Track Selected"}
            </Text>
          </View>
          <TouchableOpacity onPress={togglePlay} style={styles.actionBtnRose}>
            {isPlaying ? <Pause size={12} color="#f43f5e" /> : <Play size={12} color="#f43f5e" />}
            <Text style={styles.actionBtnRoseText}>{isPlaying ? "Pause" : "Play"}</Text>
          </TouchableOpacity>
        </View>

        {/* Pomodoro Focus Card */}
        <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.gridHeader}>
            <View style={styles.iconCircleViolet}>
              <Timer size={14} color="#8b5cf6" />
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/focus")}>
              <Text style={styles.linkTextViolet}>Focus ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridBody}>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Pomodoro Timer</Text>
            <Text style={[styles.timerValueText, { color: colors.text }]}>
              {formatTimer(remainingSeconds)}
            </Text>
          </View>
          {!isRunning ? (
            <TouchableOpacity
              onPress={() => startFocus(25, activeUser.displayName)}
              style={styles.actionBtnViolet}
            >
              <Play size={12} color="#8b5cf6" />
              <Text style={styles.actionBtnVioletText}>Start 25m</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activePhaseTag}>
              <Text style={styles.activePhaseText}>Active ({phase})</Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. Hydration Mutual Progress */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <View style={styles.iconCircleSky}>
              <Droplet size={14} color="#0284c7" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Hydration Log</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Target: {dailyTargetMl}ml each
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/hydration")}>
            <Text style={styles.linkTextSky}>View Log ›</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bars */}
        <View style={styles.progressSection}>
          <View style={styles.barGroup}>
            <View style={styles.barLabelRow}>
              <Text style={[styles.barLabel, { color: colors.text }]}>You ({activeUser.displayName})</Text>
              <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                {myWaterTotal} / {dailyTargetMl} ml
              </Text>
            </View>
            <View style={[styles.trackBar, { backgroundColor: isDark ? "#334155" : "#e2e8f0" }]}>
              <View style={[styles.fillBarSky, { width: `${myProgress}%` }]} />
            </View>
          </View>

          <View style={styles.barGroup}>
            <View style={styles.barLabelRow}>
              <Text style={[styles.barLabel, { color: colors.text }]}>{partnerUser.displayName}</Text>
              <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                {partnerWaterTotal} / {dailyTargetMl} ml
              </Text>
            </View>
            <View style={[styles.trackBar, { backgroundColor: isDark ? "#334155" : "#e2e8f0" }]}>
              <View style={[styles.fillBarAmber, { width: `${partnerProgress}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.quickLogButtons}>
          <TouchableOpacity
            onPress={() => logWater(250, activeUser.id, activeUser.displayName)}
            style={styles.quickLogBtn}
          >
            <Plus size={12} color="#0284c7" />
            <Text style={styles.quickLogText}>+250ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => logWater(500, activeUser.id, activeUser.displayName)}
            style={styles.quickLogBtn}
          >
            <Plus size={12} color="#0284c7" />
            <Text style={styles.quickLogText}>+500ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Canvas Preview */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <View style={styles.iconCircleRose}>
              <Pencil size={14} color="#f43f5e" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Collaborative Canvas</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {savedDoodles.length} saved doodles in library
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/canvas")}
            style={styles.openCanvasBtn}
          >
            <Text style={styles.openCanvasText}>Open Canvas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Recent Chat Snippet */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <MessageCircle size={16} color="#f43f5e" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Chat</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/chat")}>
            <Text style={styles.linkTextRose}>Open Chat ›</Text>
          </TouchableOpacity>
        </View>

        {latestMessage && (
          <View style={[styles.snippetBox, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}>
            <View style={styles.snippetAvatar}>
              <Text style={styles.snippetAvatarText}>{latestMessage.senderName[0]}</Text>
            </View>
            <View style={styles.snippetContent}>
              <View style={styles.snippetHeaderRow}>
                <Text style={[styles.snippetSender, { color: colors.text }]}>
                  {latestMessage.senderName}
                </Text>
                <Text style={styles.snippetTime}>
                  {new Date(latestMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={[styles.snippetText, { color: colors.textSecondary }]} numberOfLines={1}>
                {latestMessage.content || "Uploaded a photo"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 30,
  },
  presenceBanner: {
    backgroundColor: "#f43f5e",
    borderRadius: 18,
    padding: 16,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarRow: {
    flexDirection: "row",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarOverlap: {
    marginLeft: -14,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  partnerNames: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  pairingCodeText: {
    color: "#fecdd3",
    fontSize: 11,
    marginTop: 2,
  },
  codeBold: {
    fontWeight: "bold",
  },
  dndBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dndActive: {
    backgroundColor: "#0f172a",
  },
  dndBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  bannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  statusSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statusSubText: {
    color: "#ffe4e6",
    fontSize: 11,
  },
  callNowBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  callNowText: {
    color: "#e11d48",
    fontSize: 11,
    fontWeight: "bold",
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  apkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  apkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  apkInfo: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  downloadBtn: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  downloadBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  gridHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircleRose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ffe4e6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleViolet: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#edd8fe",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSky: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  linkTextViolet: {
    fontSize: 11,
    color: "#8b5cf6",
  },
  linkTextSky: {
    fontSize: 11,
    color: "#0284c7",
  },
  linkTextRose: {
    fontSize: 11,
    color: "#f43f5e",
  },
  gridBody: {
    marginVertical: 8,
  },
  cardBoldTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  timerValueText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 2,
  },
  actionBtnRose: {
    backgroundColor: "#ffe4e6",
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionBtnRoseText: {
    color: "#f43f5e",
    fontSize: 11,
    fontWeight: "bold",
  },
  actionBtnViolet: {
    backgroundColor: "#edd8fe",
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionBtnVioletText: {
    color: "#8b5cf6",
    fontSize: 11,
    fontWeight: "bold",
  },
  activePhaseTag: {
    backgroundColor: "#dcfce7",
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  activePhaseText: {
    color: "#15803d",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressSection: {
    marginVertical: 10,
    gap: 8,
  },
  barGroup: {},
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  barValue: {
    fontSize: 10,
  },
  trackBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fillBarSky: {
    height: "100%",
    backgroundColor: "#0284c7",
    borderRadius: 4,
  },
  fillBarAmber: {
    height: "100%",
    backgroundColor: "#f59e0b",
    borderRadius: 4,
  },
  quickLogButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickLogBtn: {
    flex: 1,
    backgroundColor: "#e0f2fe",
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  quickLogText: {
    color: "#0284c7",
    fontSize: 11,
    fontWeight: "bold",
  },
  openCanvasBtn: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openCanvasText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  snippetBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  snippetAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  snippetAvatarText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
  },
  snippetContent: {
    flex: 1,
  },
  snippetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  snippetSender: {
    fontSize: 11,
    fontWeight: "bold",
  },
  snippetTime: {
    fontSize: 9,
    color: "#94a3b8",
  },
  snippetText: {
    fontSize: 11,
    marginTop: 1,
  },
});
