import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { syncEngine, SyncState } from "@/lib/offline/syncEngine";
import * as Clipboard from "expo-clipboard";
import {
  Sunrise,
  Sun,
  Sunset,
  MoonStar,
  Wifi,
  WifiOff,
  RefreshCw,
  Heart,
  Search,
  UserPlus,
  Copy,
  Check,
  X,
  Clock,
} from "lucide-react-native";

export function TopHeader() {
  const {
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
    getActiveUser,
    getPartnerUser,
  } = useCoupleStore();
  const { currentTheme, overrideTheme, colors, isDark } = useThemeStore();

  const [showPairModal, setShowPairModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ state: SyncState; pendingCount: number }>({
    state: "online",
    pendingCount: 0,
  });

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();
  const incomingRequests = getIncomingRequests();

  // Filter by both displayName AND username
  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      u.displayName.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Auto-fetch users when modal opens
  useEffect(() => {
    if (showPairModal) {
      fetchAvailableUsers();
    }
  }, [showPairModal]);

  const getThemeIcon = () => {
    switch (currentTheme) {
      case "morning":
        return <Sunrise size={16} color="#f59e0b" />;
      case "day":
        return <Sun size={16} color="#0284c7" />;
      case "evening":
        return <Sunset size={16} color="#e11d48" />;
      case "night":
        return <MoonStar size={16} color="#818cf8" />;
    }
  };

  const cycleTheme = () => {
    const themes: ("morning" | "day" | "evening" | "night")[] = [
      "morning",
      "day",
      "evening",
      "night",
    ];
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    overrideTheme(themes[nextIndex]);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(couple.pairingCode || "DUO-HUB");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCloseModal = () => {
    setShowPairModal(false);
    clearSearchQuery();
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerLeft}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>D</Text>
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={[styles.appTitle, { color: colors.text }]}>Dumbo</Text>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>2-User Hub</Text>
            </View>
          </View>
          <View style={styles.presenceRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: partnerUser.isOnline ? "#10b981" : "#94a3b8" },
              ]}
            />
            <Text style={[styles.partnerName, { color: colors.textSecondary }]}>
              {partnerUser.displayName} {!partnerUser.isOnline ? "(offline)" : ""}
            </Text>
            {partnerUser.isDnd && (
              <View style={styles.dndBadge}>
                <Text style={styles.dndText}>DND</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.headerRight}>
        {/* Sync Status Pill */}
        <View
          style={[
            styles.syncPill,
            syncStatus.state === "online"
              ? styles.syncOnline
              : syncStatus.state === "syncing"
              ? styles.syncing
              : styles.syncOffline,
          ]}
        >
          {syncStatus.state === "online" ? (
            <>
              <Wifi size={12} color="#10b981" />
              <Text style={[styles.syncText, { color: "#10b981" }]}>Synced</Text>
            </>
          ) : syncStatus.state === "syncing" ? (
            <>
              <RefreshCw size={12} color="#0284c7" />
              <Text style={[styles.syncText, { color: "#0284c7" }]}>Syncing...</Text>
            </>
          ) : (
            <>
              <WifiOff size={12} color="#f59e0b" />
              <Text style={[styles.syncText, { color: "#f59e0b" }]}>
                Offline ({syncStatus.pendingCount})
              </Text>
            </>
          )}
        </View>

        {/* Theme Button */}
        <TouchableOpacity
          onPress={cycleTheme}
          style={[styles.iconButton, { backgroundColor: isDark ? "#334155" : "#f1f5f9" }]}
        >
          {getThemeIcon()}
        </TouchableOpacity>

        {/* Pairing / Heart Modal Trigger */}
        <TouchableOpacity
          onPress={() => setShowPairModal(true)}
          style={[styles.iconButton, { backgroundColor: isDark ? "#4c1d95" : "#ffe4e6" }]}
        >
          <Heart size={16} color="#f43f5e" fill="#f43f5e" />
          {incomingRequests.length > 0 && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* Pairing & Connection Modal */}
      <Modal visible={showPairModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeartIcon}>
                <Heart size={24} color="#f43f5e" fill="#f43f5e" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>2-User Private Pairing</Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Connect your account with your partner to enable shared real-time activity.
              </Text>
            </View>

            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <View style={styles.incomingBox}>
                <Text style={styles.incomingTitle}>Incoming Request</Text>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={styles.requestRow}>
                    <Image source={{ uri: req.fromUserAvatar }} style={styles.reqAvatar} />
                    <Text style={styles.reqName}>{req.fromUserName}</Text>
                    <View style={styles.reqActions}>
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

            {/* Search Input with Clear Button */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }]}>
              <Search size={14} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or @username..."
                placeholderTextColor="#94a3b8"
                style={[styles.searchInput, { color: colors.text }]}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearchQuery} style={styles.clearSearchBtn}>
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* User List */}
            <ScrollView style={styles.userListScroll}>
              {filteredUsers.length === 0 ? (
                <Text style={styles.noUserText}>No users found matching "{searchQuery}"</Text>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === activeUser.id;
                  const reqStatus = getRequestStatusForUser(u.id);

                  return (
                    <View key={u.id} style={[styles.userRow, { borderColor: colors.border }]}>
                      <View style={styles.userInfo}>
                        <Image source={{ uri: u.avatarUrl }} style={styles.userAvatar} />
                        <View>
                          <Text style={[styles.userNameText, { color: colors.text }]}>
                            {u.displayName} {isCurrent ? "(You)" : ""}
                          </Text>
                          <Text style={styles.userRoleText}>
                            {u.username ? `@${u.username}` : "registered user"}
                          </Text>
                        </View>
                      </View>

                      {!isCurrent && (
                        <View>
                          {reqStatus === "accepted" ? (
                            <View style={styles.connectedTag}>
                              <Heart size={10} color="#15803d" fill="#15803d" />
                              <Text style={styles.connectedText}>Connected</Text>
                            </View>
                          ) : reqStatus === "pending_sent" ? (
                            <View style={styles.pendingTag}>
                              <Clock size={10} color="#b45309" />
                              <Text style={styles.pendingText}>Pending</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => sendPartnerRequest(u)}
                              style={styles.connectBtn}
                            >
                              <UserPlus size={12} color="#fff" />
                              <Text style={styles.connectBtnText}>Connect</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Pairing Code */}
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Pairing Code:</Text>
              <View style={[styles.codeBox, { backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }]}>
                <Text style={[styles.codeText, { color: colors.text }]}>
                  {couple.pairingCode || "DUO-HUB"}
                </Text>
                <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                  {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#64748b" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.closeModalBtn}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  hubBadge: {
    backgroundColor: "#ffe4e6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubBadgeText: {
    color: "#e11d48",
    fontSize: 9,
    fontWeight: "bold",
  },
  presenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  partnerName: {
    fontSize: 11,
  },
  dndBadge: {
    backgroundColor: "#ddd6fe",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dndText: {
    color: "#6d28d9",
    fontSize: 8,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncOnline: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  syncing: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
  },
  syncOffline: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  syncText: {
    fontSize: 10,
    fontWeight: "600",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalHeartIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffe4e6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalSub: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  incomingBox: {
    backgroundColor: "#fff1f2",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  incomingTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#e11d48",
    marginBottom: 6,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 8,
  },
  reqAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  reqName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  reqActions: {
    flexDirection: "row",
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  declineBtn: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  declineBtnText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  clearSearchBtn: {
    padding: 4,
  },
  userListScroll: {
    maxHeight: 150,
    marginBottom: 12,
  },
  noUserText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 11,
    paddingVertical: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  userNameText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  userRoleText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  connectedTag: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectedText: {
    color: "#15803d",
    fontSize: 10,
    fontWeight: "bold",
  },
  pendingTag: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pendingText: {
    color: "#b45309",
    fontSize: 10,
    fontWeight: "bold",
  },
  connectBtn: {
    backgroundColor: "#f43f5e",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  codeContainer: {
    marginBottom: 14,
  },
  codeLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 4,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  copyBtn: {
    padding: 4,
  },
  closeModalBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeModalText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
