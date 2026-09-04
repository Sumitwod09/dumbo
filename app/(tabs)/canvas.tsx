import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  FlatList,
} from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Pencil,
  Undo2,
  Eraser,
  Save,
  Trash2,
  X,
  Image as ImageIcon,
  Wifi,
  Users,
} from "lucide-react-native";

export default function CanvasScreen() {
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("draw");
  const [selectedDoodle, setSelectedDoodle] = useState<string | null>(null);

  const {
    strokes,
    savedDoodles,
    activeColor,
    brushWidth,
    isSynced,
    subscribeToCanvas,
    cleanupCanvasSubscription,
    addStroke,
    undoLastStroke,
    clearCanvas,
    setActiveColor,
    setBrushWidth,
    saveDoodle,
    deleteDoodle,
  } = useCanvasStore();

  const { getActiveUser, getPartnerUser, couple, isPaired } = useCoupleStore();
  const { colors, isDark } = useThemeStore();
  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  const currentPath = useRef<{ x: number; y: number }[]>([]);
  const [currentStrokePath, setCurrentStrokePath] = useState<string>("");

  // Subscribe to collaborative canvas broadcast channel
  useEffect(() => {
    if (isPaired && couple?.id) {
      subscribeToCanvas(couple.id);
    }
  }, [isPaired, couple?.id]);

  const colorOptions = [
    "#f43f5e",
    "#0ea5e9",
    "#8b5cf6",
    "#f59e0b",
    "#10b981",
    "#000000",
    "#ffffff",
  ];

  // Helper to extract coordinates safely on both native touch & web mouse
  const getCoordinates = (evt: GestureResponderEvent) => {
    const native = evt.nativeEvent as any;
    const x = native.locationX ?? native.offsetX ?? native.layerX ?? 0;
    const y = native.locationY ?? native.offsetY ?? native.layerY ?? 0;
    return { x: Math.round(x), y: Math.round(y) };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { x, y } = getCoordinates(evt);
        currentPath.current = [{ x, y }];
        setCurrentStrokePath(`M ${x} ${y}`);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { x, y } = getCoordinates(evt);
        currentPath.current.push({ x, y });
        setCurrentStrokePath((prev) => `${prev} L ${x} ${y}`);
      },
      onPanResponderRelease: () => {
        if (currentPath.current.length > 0) {
          addStroke({
            id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            color: activeColor,
            width: brushWidth,
            points: [...currentPath.current],
            createdBy: activeUser.id,
          });
        }
        currentPath.current = [];
        setCurrentStrokePath("");
      },
    })
  ).current;

  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points.reduce(
      (acc, point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`,
      ""
    );
  };

  const handleSave = () => {
    // Generate simple placeholder storage path for doodle
    const mockStoragePath =
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400";
    saveDoodle(mockStoragePath, activeUser.id, activeUser.displayName);
    setActiveTab("gallery");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Pencil size={20} color="#f43f5e" />
            <Text style={[styles.pageTitle, { color: colors.text }]}>Real-Time Canvas</Text>
            {isPaired && (
              <View style={[styles.collabBadge, { backgroundColor: isSynced ? "#dcfce7" : "#fef3c7" }]}>
                <View style={[styles.statusDot, { backgroundColor: isSynced ? "#16a34a" : "#d97706" }]} />
                <Text style={[styles.collabBadgeText, { color: isSynced ? "#15803d" : "#b45309" }]}>
                  {isSynced ? `Live with ${partnerUser.displayName.split(" ")[0]}` : "Connecting..."}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
            {isPaired ? "Draw together collaboratively in real-time" : "Draw and save your personal sketches (Pair to draw live)"}
          </Text>
        </View>

        <View style={[styles.tabToggleBox, { backgroundColor: isDark ? "#1e293b" : "#e2e8f0" }]}>
          <TouchableOpacity
            onPress={() => setActiveTab("draw")}
            style={[styles.tabToggleBtn, activeTab === "draw" && styles.tabToggleActive]}
          >
            <Text
              style={[
                styles.tabToggleText,
                { color: activeTab === "draw" ? "#f43f5e" : colors.textSecondary },
              ]}
            >
              Canvas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("gallery")}
            style={[styles.tabToggleBtn, activeTab === "gallery" && styles.tabToggleActive]}
          >
            <Text
              style={[
                styles.tabToggleText,
                { color: activeTab === "gallery" ? "#f43f5e" : colors.textSecondary },
              ]}
            >
              Gallery ({savedDoodles.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "draw" ? (
        <ScrollView contentContainerStyle={styles.drawContent}>
          {/* Touch Canvas */}
          <View
            style={[styles.canvasCard, { backgroundColor: "#ffffff", borderColor: colors.border }]}
            {...panResponder.panHandlers}
          >
            <Svg style={StyleSheet.absoluteFill}>
              {/* Render existing strokes */}
              {strokes.map((stroke) => (
                <Path
                  key={stroke.id}
                  d={pointsToPath(stroke.points)}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
              {/* Live drawing stroke */}
              {currentStrokePath ? (
                <Path
                  d={currentStrokePath}
                  stroke={activeColor}
                  strokeWidth={brushWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null}
            </Svg>
          </View>

          {/* Color Palette & Brush Controls */}
          <View style={[styles.toolbarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.colorPaletteRow}>
              {colorOptions.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setActiveColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    activeColor === c && styles.colorDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Brush Width Selector */}
            <View style={styles.brushWidthRow}>
              <Text style={[styles.brushLabel, { color: colors.textSecondary }]}>Size:</Text>
              {[2, 4, 8, 12, 16].map((w) => (
                <TouchableOpacity
                  key={w}
                  onPress={() => setBrushWidth(w)}
                  style={[
                    styles.widthPill,
                    { backgroundColor: isDark ? "#0f172a" : "#f1f5f9" },
                    brushWidth === w && styles.widthPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.widthPillText,
                      { color: brushWidth === w ? "#ffffff" : colors.text },
                    ]}
                  >
                    {w}px
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions Toolbar */}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => undoLastStroke()} style={styles.actionBtn}>
                <Undo2 size={14} color={colors.text} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => clearCanvas()} style={styles.actionBtn}>
                <Eraser size={14} color={colors.text} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Save size={14} color="#ffffff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Saved Gallery Grid */
        <View style={styles.galleryContent}>
          {savedDoodles.length === 0 ? (
            <View style={styles.emptyGallery}>
              <ImageIcon size={36} color="#cbd5e1" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Doodles Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Export your drawings from the canvas to keep memories!
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedDoodles}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.galleryGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedDoodle(item.storagePath)}
                  style={[styles.doodleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Image source={{ uri: item.storagePath }} style={styles.doodleImage} />
                  <View style={styles.doodleFooter}>
                    <View style={styles.doodleMeta}>
                      <Text style={[styles.doodleTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.doodleAuthor}>By {item.createdByName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteDoodle(item.id)} style={styles.deleteDoodleBtn}>
                      <Trash2 size={12} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Lightbox Preview Modal */}
      <Modal visible={!!selectedDoodle} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setSelectedDoodle(null)} style={styles.closeModalBtn}>
              <X size={16} color={colors.text} />
            </TouchableOpacity>
            {selectedDoodle && (
              <Image source={{ uri: selectedDoodle }} style={styles.previewImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  collabBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  collabBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pageSub: {
    fontSize: 11,
    marginTop: 2,
  },
  tabToggleBox: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 2,
  },
  tabToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabToggleActive: {
    backgroundColor: "#ffffff",
  },
  tabToggleText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  drawContent: {
    padding: 14,
    gap: 12,
  },
  canvasCard: {
    height: 340,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  toolbarCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  colorPaletteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: "#f43f5e",
    transform: [{ scale: 1.15 }],
  },
  brushWidthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brushLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  widthPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  widthPillActive: {
    backgroundColor: "#f43f5e",
  },
  widthPillText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#f43f5e",
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  galleryContent: {
    flex: 1,
    padding: 14,
  },
  emptyGallery: {
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
    textAlign: "center",
  },
  galleryGrid: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  doodleCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  doodleImage: {
    width: "100%",
    height: 120,
  },
  doodleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  doodleMeta: {
    flex: 1,
  },
  doodleTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  doodleAuthor: {
    fontSize: 9,
    color: "#94a3b8",
  },
  deleteDoodleBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    height: 400,
    borderRadius: 20,
    padding: 12,
  },
  closeModalBtn: {
    alignSelf: "flex-end",
    padding: 4,
  },
  previewImage: {
    flex: 1,
    borderRadius: 12,
  },
});
