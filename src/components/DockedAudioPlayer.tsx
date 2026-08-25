import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useAudioStore } from "@/stores/useAudioStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { Play, Pause, SkipForward, Music } from "lucide-react-native";

export function DockedAudioPlayer() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, positionSeconds, durationSeconds } =
    useAudioStore();
  const { colors, isDark } = useThemeStore();

  if (!currentTrack) return null;

  const progressPercent = durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: colors.border }]}>
      {/* Progress Line */}
      <View style={styles.progressTrack}>
        <View style={[styles.fillBar, { width: `${Math.min(progressPercent, 100)}%` }]} />
      </View>

      <View style={styles.playerRow}>
        <Image
          source={{
            uri:
              currentTrack.coverArtUrl ||
              "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100",
          }}
          style={styles.coverArt}
        />

        <View style={styles.trackInfo}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
            {currentTrack.artist} • {currentTrack.addedByName}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
            {isPlaying ? (
              <Pause size={18} color="#ffffff" />
            ) : (
              <Play size={18} color="#ffffff" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={nextTrack} style={styles.nextBtn}>
            <SkipForward size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: "#e2e8f0",
    width: "100%",
    borderRadius: 1,
    marginBottom: 6,
    overflow: "hidden",
  },
  fillBar: {
    height: "100%",
    backgroundColor: "#f43f5e",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coverArt: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
  },
  artist: {
    fontSize: 10,
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    padding: 6,
  },
});
