import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import ConfettiCannon from "react-native-confetti-cannon";
import { useTimerStore } from "@/stores/useTimerStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Moon,
  Sparkles,
  Coffee,
  PartyPopper,
} from "lucide-react-native";

export default function FocusScreen() {
  const {
    phase,
    remainingSeconds,
    totalSeconds,
    isRunning,
    startedByName,
    showCompletionOverlay,
    completedPhase,
    startFocus,
    startBreak,
    pauseTimer,
    resumeTimer,
    stopTimer,
    dismissCompletionOverlay,
  } = useTimerStore();

  const { getActiveUser, toggleDnd } = useCoupleStore();
  const { colors, isDark } = useThemeStore();
  const activeUser = getActiveUser();

  const progressPercent =
    totalSeconds > 0
      ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
      : 0;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const circumference = 2 * Math.PI * 84;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Timer size={20} color="#8b5cf6" />
          <Text style={[styles.pageTitle, { color: colors.text }]}>Joint Focus Timer</Text>
        </View>
        <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
          Synchronized Pomodoro timer for deep work together
        </Text>
      </View>

      {/* Do Not Disturb Banner */}
      <View style={styles.dndCard}>
        <View style={styles.dndLeft}>
          <View style={styles.moonIconBox}>
            <Moon size={18} color="#c4b5fd" />
          </View>
          <View>
            <Text style={styles.dndTitle}>Do Not Disturb Status</Text>
            <Text style={styles.dndSub}>
              {activeUser.isDnd ? "Your status is set to DND" : "Surfaces quiet mood to partner"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => toggleDnd(activeUser.id)}
          style={[styles.dndToggleBtn, activeUser.isDnd && styles.dndToggleActive]}
        >
          <Text style={[styles.dndToggleText, activeUser.isDnd && styles.dndToggleTextActive]}>
            {activeUser.isDnd ? "Active (DND)" : "Toggle DND"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Countdown Display Card */}
      <View style={[styles.timerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Phase Badge */}
        <View style={styles.phaseBadgeRow}>
          <View
            style={[
              styles.phaseBadge,
              phase === "focus"
                ? styles.phaseFocus
                : phase === "break"
                ? styles.phaseBreak
                : styles.phaseIdle,
            ]}
          >
            <Text
              style={[
                styles.phaseBadgeText,
                phase === "focus"
                  ? styles.phaseFocusText
                  : phase === "break"
                  ? styles.phaseBreakText
                  : styles.phaseIdleText,
              ]}
            >
              {phase === "idle" ? "Ready" : phase.toUpperCase()}
            </Text>
          </View>
          {startedByName && phase !== "idle" && (
            <Text style={[styles.startedByText, { color: colors.textSecondary }]}>
              Started by {startedByName}
            </Text>
          )}
        </View>

        {/* SVG Circular Ring Timer */}
        <View style={styles.circleContainer}>
          <Svg width={200} height={200}>
            <Circle
              cx={100}
              cy={100}
              r={84}
              stroke={isDark ? "#334155" : "#e2e8f0"}
              strokeWidth={10}
              fill="none"
            />
            <Circle
              cx={100}
              cy={100}
              r={84}
              stroke={phase === "break" ? "#10b981" : "#8b5cf6"}
              strokeWidth={10}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </Svg>

          <View style={styles.counterCenter}>
            <Text style={[styles.counterText, { color: colors.text }]}>
              {formatTimer(remainingSeconds)}
            </Text>
            <Text style={[styles.counterSub, { color: colors.textSecondary }]}>
              {phase === "break" ? "Relax & Hydrate" : "Deep Focus Session"}
            </Text>
          </View>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetRow}>
          <TouchableOpacity
            onPress={() => startFocus(25, activeUser.displayName)}
            style={[styles.presetBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>25m Focus</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => startFocus(45, activeUser.displayName)}
            style={[styles.presetBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>45m Deep</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => startBreak(5, activeUser.displayName)}
            style={[styles.presetBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>5m Break</Text>
          </TouchableOpacity>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsRow}>
          {!isRunning ? (
            <TouchableOpacity
              onPress={() =>
                phase === "idle"
                  ? startFocus(25, activeUser.displayName)
                  : resumeTimer()
              }
              style={styles.playCircleBtn}
            >
              <Play size={24} color="#ffffff" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pauseTimer} style={styles.pauseCircleBtn}>
              <Pause size={24} color="#ffffff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={stopTimer} style={[styles.resetBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
            <RotateCcw size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Completion Modal Overlay */}
      <Modal visible={showCompletionOverlay} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ConfettiCannon count={100} origin={{ x: 180, y: 0 }} />
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalIconBox}>
              <PartyPopper size={32} color="#ffffff" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {completedPhase === "focus"
                ? "Focus Session Complete! 🎉"
                : "Break Time Over! ⏰"}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              {completedPhase === "focus"
                ? "Great work! Transitioning to a 5-minute break..."
                : "Ready to start another focus session?"}
            </Text>
            <TouchableOpacity onPress={dismissCompletionOverlay} style={styles.modalDismissBtn}>
              <Text style={styles.modalDismissText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 14,
    paddingBottom: 30,
  },
  headerRow: {
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pageSub: {
    fontSize: 11,
    marginTop: 2,
  },
  dndCard: {
    backgroundColor: "#4c1d95",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dndLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  moonIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dndTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  dndSub: {
    color: "#c4b5fd",
    fontSize: 10,
    marginTop: 1,
  },
  dndToggleBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dndToggleActive: {
    backgroundColor: "#a7f3d0",
  },
  dndToggleText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  dndToggleTextActive: {
    color: "#065f46",
  },
  timerCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  phaseBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phaseFocus: {
    backgroundColor: "#edd8fe",
  },
  phaseFocusText: {
    color: "#6d28d9",
  },
  phaseBreak: {
    backgroundColor: "#dcfce7",
  },
  phaseBreakText: {
    color: "#15803d",
  },
  phaseIdle: {
    backgroundColor: "#f1f5f9",
  },
  phaseIdleText: {
    color: "#64748b",
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  startedByText: {
    fontSize: 11,
  },
  circleContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  counterCenter: {
    position: "absolute",
    alignItems: "center",
  },
  counterText: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  counterSub: {
    fontSize: 11,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  presetText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
  playCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalSub: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  modalDismissBtn: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalDismissText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
