import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StyleSheet,
  FlatList,
} from "react-native";
import { useAudioStore } from "@/stores/useAudioStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Plus,
  Trash2,
  ListMusic,
  Volume2,
  VolumeX,
} from "lucide-react-native";

export default function MusicScreen() {
  const {
    currentTrack,
    queue,
    isPlaying,
    positionSeconds,
    durationSeconds,
    volume,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    addTrack,
    removeTrack,
  } = useAudioStore();

  const { getActiveUser } = useCoupleStore();
  const { colors, isDark } = useThemeStore();
  const activeUser = getActiveUser();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleAddSong = () => {
    if (!title.trim()) return;

    addTrack({
      coupleId: "couple-888-999-111",
      title: title.trim(),
      artist: artist.trim() || "Unknown Artist",
      storagePath:
        url.trim() ||
        "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
      durationSeconds: 180,
      addedBy: activeUser.id,
      addedByName: activeUser.displayName,
      coverArtUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    });

    setTitle("");
    setArtist("");
    setUrl("");
    setShowAddModal(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Music size={20} color="#f43f5e" />
            <Text style={[styles.pageTitle, { color: colors.text }]}>Shared Music Queue</Text>
          </View>
          <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
            Synched queue for both partners
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Plus size={14} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Song</Text>
        </TouchableOpacity>
      </View>

      {/* Main Track Display Card */}
      {currentTrack && (
        <View style={styles.playerCard}>
          <Image
            source={{
              uri:
                currentTrack.coverArtUrl ||
                "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300",
            }}
            style={styles.bigCoverArt}
          />

          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
          <Text style={styles.addedByText}>Added by {currentTrack.addedByName}</Text>

          {/* Seek Bar Progress */}
          <View style={styles.seekContainer}>
            <View style={styles.seekTrack}>
              <View
                style={[
                  styles.seekFill,
                  {
                    width: `${
                      durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.timeLabels}>
              <Text style={styles.timeText}>{formatTime(positionSeconds)}</Text>
              <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
            </View>
          </View>

          {/* Playback Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={prevTrack} style={styles.controlCircleSmall}>
              <SkipBack size={18} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlay} style={styles.controlCircleBig}>
              {isPlaying ? (
                <Pause size={24} color="#ffffff" />
              ) : (
                <Play size={24} color="#ffffff" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={nextTrack} style={styles.controlCircleSmall}>
              <SkipForward size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Queue List Card */}
      <View style={[styles.queueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.queueHeaderRow}>
          <View style={styles.titleRow}>
            <ListMusic size={16} color="#f43f5e" />
            <Text style={[styles.queueTitle, { color: colors.text }]}>Playlist Queue</Text>
          </View>
          <Text style={[styles.queueCount, { color: colors.textSecondary }]}>
            {queue.length} tracks
          </Text>
        </View>

        {queue.length === 0 ? (
          <View style={styles.emptyQueue}>
            <Music size={32} color="#cbd5e1" />
            <Text style={[styles.emptyQueueText, { color: colors.text }]}>No tracks in queue</Text>
            <Text style={[styles.emptyQueueSub, { color: colors.textSecondary }]}>
              Add songs to start listening together!
            </Text>
          </View>
        ) : (
          queue.map((track, idx) => {
            const isSelected = currentTrack?.id === track.id;

            return (
              <TouchableOpacity
                key={track.id}
                onPress={() => playTrack(track)}
                style={[
                  styles.queueItem,
                  isSelected && styles.queueItemSelected,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={styles.queueIndex}>{idx + 1}</Text>
                <Image
                  source={{
                    uri:
                      track.coverArtUrl ||
                      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100",
                  }}
                  style={styles.queueCover}
                />
                <View style={styles.queueTrackInfo}>
                  <Text
                    style={[
                      styles.queueTrackTitle,
                      { color: isSelected ? "#f43f5e" : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text style={[styles.queueTrackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                    {track.artist} • Added by {track.addedByName}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => removeTrack(track.id)} style={styles.removeBtn}>
                  <Trash2 size={14} color="#94a3b8" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Add Song Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Add Song to Queue</Text>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text }]}>Song Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Sunset Reverie"
                placeholderTextColor="#94a3b8"
                style={[
                  styles.modalInput,
                  { backgroundColor: isDark ? "#0f172a" : "#f1f5f9", color: colors.text },
                ]}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text }]}>Artist</Text>
              <TextInput
                value={artist}
                onChangeText={setArtist}
                placeholder="e.g. Chill Beats"
                placeholderTextColor="#94a3b8"
                style={[
                  styles.modalInput,
                  { backgroundColor: isDark ? "#0f172a" : "#f1f5f9", color: colors.text },
                ]}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text }]}>Audio MP3 URL</Text>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="Paste MP3 URL..."
                placeholderTextColor="#94a3b8"
                style={[
                  styles.modalInput,
                  { backgroundColor: isDark ? "#0f172a" : "#f1f5f9", color: colors.text },
                ]}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddSong} style={styles.modalAddBtn}>
                <Text style={styles.modalAddText}>Add Track</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  addBtn: {
    backgroundColor: "#f43f5e",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  playerCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  bigCoverArt: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 12,
  },
  trackTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  trackArtist: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  addedByText: {
    color: "#f43f5e",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  seekContainer: {
    width: "100%",
    marginTop: 16,
  },
  seekTrack: {
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    overflow: "hidden",
  },
  seekFill: {
    height: "100%",
    backgroundColor: "#f43f5e",
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: {
    color: "#94a3b8",
    fontSize: 10,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 16,
  },
  controlCircleSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  controlCircleBig: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  queueCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  queueHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  queueCount: {
    fontSize: 11,
  },
  emptyQueue: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyQueueText: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 6,
  },
  emptyQueueSub: {
    fontSize: 11,
    marginTop: 2,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  queueItemSelected: {
    backgroundColor: "#fff1f2",
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  queueIndex: {
    width: 20,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "bold",
  },
  queueCover: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  queueTrackInfo: {
    flex: 1,
    marginLeft: 10,
  },
  queueTrackTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  queueTrackArtist: {
    fontSize: 10,
    marginTop: 1,
  },
  removeBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 14,
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalInput: {
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "bold",
  },
  modalAddBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAddText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
