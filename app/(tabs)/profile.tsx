import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  User,
  AtSign,
  Heart,
  Search,
  Check,
  X,
  Smartphone,
  Moon,
  Copy,
  Users,
  UserPlus,
  RefreshCw,
  Clock,
} from "lucide-react-native";

export default function ProfileScreen() {
  const {
    couple,
    availableUsers,
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    fetchAvailableUsers,
    updateProfile,
    checkUsernameAvailability,
    sendPartnerRequest,
    acceptPartnerRequest,
    declinePartnerRequest,
    getIncomingRequests,
    getRequestStatusForUser,
    toggleDnd,
    getActiveUser,
    getPartnerUser,
  } = useCoupleStore();

  const { colors, isDark } = useThemeStore();
  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();
  const incomingRequests = getIncomingRequests();

  const [displayName, setDisplayName] = useState(activeUser.displayName || "");
  const [username, setUsername] = useState(activeUser.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setDisplayName(activeUser.displayName || "");
    setUsername(activeUser.username || "");
  }, [activeUser.displayName, activeUser.username]);

  // Auto-fetch available users on mount
  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
  const isUsernameAvailable =
    !cleanUsername ||
    cleanUsername === activeUser.username?.toLowerCase() ||
    checkUsernameAvailability(cleanUsername);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setFeedback(null);

    const res = await updateProfile(displayName, username);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: "success", text: "Profile settings & unique username updated!" });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update profile." });
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(couple.pairingCode || "DUO-HUB");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <User size={20} color="#f43f5e" />
          <Text style={[styles.pageTitle, { color: colors.text }]}>Profile & Account</Text>
        </View>
        <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
          Customize your unique username, profile, and partner connections
        </Text>
      </View>

      {/* 1. Active Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileCardTop}>
          <Image source={{ uri: activeUser.avatarUrl }} style={styles.profileAvatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>{activeUser.displayName}</Text>
              {activeUser.username ? (
                <View style={styles.usernameBadge}>
                  <Text style={styles.usernameBadgeText}>@{activeUser.username}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.profileStatus}>
              Online • Connected to {partnerUser.displayName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleDnd(activeUser.id)}
            style={[styles.dndBtn, activeUser.isDnd && styles.dndBtnActive]}
          >
            <Moon size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Choose Unique Username & Profile Customization Form */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <AtSign size={16} color="#f43f5e" />
          <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
            Choose Unique Username & Settings
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Display Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Kirti Chaudhari"
            placeholderTextColor="#94a3b8"
            style={[
              styles.textInput,
              { backgroundColor: isDark ? "#0f172a" : "#f8fafc", color: colors.text },
            ]}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelWithValidation}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Unique Username</Text>
            {cleanUsername ? (
              <Text style={[styles.validationText, { color: isUsernameAvailable ? "#10b981" : "#f43f5e" }]}>
                {isUsernameAvailable ? "✓ Available" : "✗ Username Taken"}
              </Text>
            ) : null}
          </View>
          <View style={[styles.usernameInputBox, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="choose_username (e.g. kirti, sumit)"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              style={[styles.usernameInput, { color: colors.text }]}
            />
          </View>
          <Text style={styles.inputHelp}>
            Your unique username allows other users to search and connect with you directly.
          </Text>
        </View>

        {feedback && (
          <View
            style={[
              styles.feedbackBox,
              { backgroundColor: feedback.type === "success" ? "#ecfdf5" : "#fff1f2" },
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                { color: feedback.type === "success" ? "#047857" : "#e11d48" },
              ]}
            >
              {feedback.text}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={isSaving || (!!cleanUsername && !isUsernameAvailable)}
          style={[
            styles.saveProfileBtn,
            (isSaving || (!!cleanUsername && !isUsernameAvailable)) && styles.disabledBtn,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveProfileText}>Save Profile Settings</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Dedicated User Search Bar & Connections Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderBetween}>
          <View style={styles.cardHeaderRow}>
            <Users size={16} color="#f43f5e" />
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
              User Search & Partner Requests
            </Text>
          </View>
          <Text style={styles.userCountText}>{availableUsers.length} Users</Text>
        </View>

        {/* Incoming Request Banner */}
        {incomingRequests.length > 0 && (
          <View style={styles.incomingBanner}>
            <Text style={styles.incomingTitle}>Incoming Partner Connection Request</Text>
            {incomingRequests.map((req) => (
              <View key={req.id} style={styles.incomingRow}>
                <Image source={{ uri: req.fromUserAvatar }} style={styles.incomingAvatar} />
                <View style={styles.incomingInfo}>
                  <Text style={styles.incomingName}>{req.fromUserName}</Text>
                  <Text style={styles.incomingSub}>wants to connect</Text>
                </View>
                <View style={styles.incomingActions}>
                  <TouchableOpacity
                    onPress={() => acceptPartnerRequest(req.id)}
                    style={styles.acceptBtn}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => declinePartnerRequest(req.id)}
                    style={styles.declineBtn}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}>
          <Search size={14} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users by @username, name..."
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

        {/* Search Results List */}
        <View style={styles.userList}>
          {filteredUsers.length === 0 ? (
            <Text style={styles.noResultsText}>No registered users match "{searchQuery}"</Text>
          ) : (
            filteredUsers.map((u) => {
              const isCurrent = u.id === activeUser.id;
              const reqStatus = getRequestStatusForUser(u.id);

              return (
                <View key={u.id} style={[styles.userItem, { borderColor: colors.border }]}>
                  <View style={styles.userItemLeft}>
                    <Image source={{ uri: u.avatarUrl }} style={styles.userItemAvatar} />
                    <View>
                      <Text style={[styles.userItemName, { color: colors.text }]}>
                        {u.displayName} {isCurrent ? "(You)" : ""}
                      </Text>
                      <Text style={styles.userItemSub}>
                        {u.username ? `@${u.username}` : "registered user"}
                      </Text>
                    </View>
                  </View>

                  {!isCurrent && (
                    <View>
                      {reqStatus === "accepted" ? (
                        <View style={styles.connectedBadge}>
                          <Heart size={11} color="#15803d" fill="#15803d" />
                          <Text style={styles.connectedText}>Connected</Text>
                        </View>
                      ) : reqStatus === "pending_sent" ? (
                        <View style={styles.pendingBadge}>
                          <Clock size={11} color="#b45309" />
                          <Text style={styles.pendingText}>Pending</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => sendPartnerRequest(u)}
                          style={styles.connectBtn}
                        >
                          <UserPlus size={12} color="#ffffff" />
                          <Text style={styles.connectText}>Connect</Text>
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

      {/* 4. Pairing Code & Download APK Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderBetween}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Private Pairing Code</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.copyRow}>
            {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#f43f5e" />}
            <Text style={styles.copyText}>{copiedCode ? "Copied!" : "Copy Code"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.codeDisplayBox, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}>
          <Text style={[styles.codeDisplayText, { color: colors.text }]}>
            {couple.pairingCode || "DUO-HUB"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL("https://github.com/Sumitwod09/dumbo/releases/latest/download/app-debug.apk")
          }
          style={styles.apkDownloadBtn}
        >
          <Smartphone size={14} color="#ffffff" />
          <Text style={styles.apkDownloadText}>Download Android APK</Text>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: "#f43f5e",
    borderRadius: 18,
    padding: 16,
  },
  profileCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  usernameBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  usernameBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  profileStatus: {
    color: "#ffe4e6",
    fontSize: 11,
    marginTop: 2,
  },
  dndBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  dndBtnActive: {
    backgroundColor: "#0f172a",
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  formGroup: {},
  inputLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  textInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  labelWithValidation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validationText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  usernameInputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  atSymbol: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    fontSize: 12,
  },
  inputHelp: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 4,
  },
  feedbackBox: {
    padding: 8,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  saveProfileBtn: {
    backgroundColor: "#f43f5e",
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  saveProfileText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  userCountText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  incomingBanner: {
    backgroundColor: "#fff1f2",
    padding: 10,
    borderRadius: 12,
  },
  incomingTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#e11d48",
    marginBottom: 6,
  },
  incomingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 8,
  },
  incomingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  incomingInfo: {
    flex: 1,
    marginLeft: 8,
  },
  incomingName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  incomingSub: {
    fontSize: 9,
    color: "#94a3b8",
  },
  incomingActions: {
    flexDirection: "row",
    gap: 4,
  },
  acceptBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acceptText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  declineBtn: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  declineText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
  },
  userList: {
    gap: 8,
  },
  noResultsText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 10,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  userItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userItemName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  userItemSub: {
    fontSize: 10,
    color: "#94a3b8",
  },
  connectedBadge: {
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
  pendingBadge: {
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
  connectText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    color: "#f43f5e",
    fontSize: 11,
    fontWeight: "bold",
  },
  codeDisplayBox: {
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  codeDisplayText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  apkDownloadBtn: {
    backgroundColor: "#f43f5e",
    height: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  apkDownloadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
