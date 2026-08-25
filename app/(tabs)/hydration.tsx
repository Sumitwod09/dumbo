import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { Droplet, Plus, Bell, History, Award } from "lucide-react-native";

export default function HydrationScreen() {
  const {
    logs,
    dailyTargetMl,
    reminderActive,
    logWater,
    triggerHourlyReminder,
    dismissReminder,
    getUserDailyTotal,
  } = useHydrationStore();

  const { getActiveUser, getPartnerUser } = useCoupleStore();
  const { colors, isDark } = useThemeStore();
  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  const myTotal = getUserDailyTotal(activeUser.id);
  const partnerTotal = getUserDailyTotal(partnerUser.id);

  const myProgress = Math.min((myTotal / dailyTargetMl) * 100, 100);
  const partnerProgress = Math.min((partnerTotal / dailyTargetMl) * 100, 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Droplet size={20} color="#0284c7" />
            <Text style={[styles.pageTitle, { color: colors.text }]}>Hydration Check-in</Text>
          </View>
          <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
            Mutual daily water accountability log
          </Text>
        </View>

        <TouchableOpacity onPress={triggerHourlyReminder} style={styles.reminderBtn}>
          <Bell size={12} color="#b45309" />
          <Text style={styles.reminderBtnText}>Hourly Prompt</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Banner */}
      {reminderActive && (
        <View style={styles.promptBanner}>
          <View style={styles.promptLeft}>
            <View style={styles.bellBox}>
              <Bell size={16} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.promptTitle}>Hourly Hydration Prompt 💧</Text>
              <Text style={styles.promptSub}>Time for a glass of water!</Text>
            </View>
          </View>
          <TouchableOpacity onPress={dismissReminder} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Cards */}
      <View style={styles.cardsRow}>
        {/* Active User */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.userName, { color: colors.text }]}>You ({activeUser.displayName})</Text>
            {myTotal >= dailyTargetMl && <Award size={14} color="#f59e0b" />}
          </View>

          <View style={styles.counterBox}>
            <Text style={styles.counterTextSky}>{myTotal}</Text>
            <Text style={[styles.counterTarget, { color: colors.textSecondary }]}> / {dailyTargetMl} ml</Text>
          </View>

          <View style={[styles.trackBar, { backgroundColor: isDark ? "#334155" : "#e2e8f0" }]}>
            <View style={[styles.fillBarSky, { width: `${myProgress}%` }]} />
          </View>

          <View style={styles.quickBtns}>
            <TouchableOpacity
              onPress={() => logWater(250, activeUser.id, activeUser.displayName)}
              style={styles.quickBtnSky}
            >
              <Text style={styles.quickTextSky}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => logWater(500, activeUser.id, activeUser.displayName)}
              style={styles.quickBtnSky}
            >
              <Text style={styles.quickTextSky}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Partner */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.userName, { color: colors.text }]}>{partnerUser.displayName}</Text>
            {partnerTotal >= dailyTargetMl && <Award size={14} color="#f59e0b" />}
          </View>

          <View style={styles.counterBox}>
            <Text style={styles.counterTextAmber}>{partnerTotal}</Text>
            <Text style={[styles.counterTarget, { color: colors.textSecondary }]}> / {dailyTargetMl} ml</Text>
          </View>

          <View style={[styles.trackBar, { backgroundColor: isDark ? "#334155" : "#e2e8f0" }]}>
            <View style={[styles.fillBarAmber, { width: `${partnerProgress}%` }]} />
          </View>

          <View style={styles.quickBtns}>
            <TouchableOpacity
              onPress={() => logWater(250, partnerUser.id, partnerUser.displayName)}
              style={styles.quickBtnAmber}
            >
              <Text style={styles.quickTextAmber}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => logWater(500, partnerUser.id, partnerUser.displayName)}
              style={styles.quickBtnAmber}
            >
              <Text style={styles.quickTextAmber}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Log History Timeline */}
      <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.historyHeader}>
          <History size={16} color="#0284c7" />
          <Text style={[styles.historyTitle, { color: colors.text }]}>Log History Timeline</Text>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Droplet size={32} color="#cbd5e1" />
            <Text style={[styles.emptyHistoryText, { color: colors.text }]}>No logs yet today</Text>
            <Text style={[styles.emptyHistorySub, { color: colors.textSecondary }]}>
              Log your first glass of water above!
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <View
              key={log.id}
              style={[styles.historyRow, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}
            >
              <View style={styles.historyUserGroup}>
                <View
                  style={[
                    styles.userDot,
                    { backgroundColor: log.userId === activeUser.id ? "#0284c7" : "#f59e0b" },
                  ]}
                >
                  <Text style={styles.userDotText}>{log.userName[0]}</Text>
                </View>
                <View>
                  <Text style={[styles.historyUserName, { color: colors.text }]}>{log.userName}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(log.loggedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              <Text style={styles.amountText}>+{log.amountMl} ml</Text>
            </View>
          ))
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
  reminderBtn: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reminderBtnText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "bold",
  },
  promptBanner: {
    backgroundColor: "#f59e0b",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promptLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bellBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  promptTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  promptSub: {
    color: "#fef3c7",
    fontSize: 10,
  },
  dismissBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dismissText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
  },
  progressCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "center",
    marginVertical: 4,
  },
  counterTextSky: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0284c7",
  },
  counterTextAmber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  counterTarget: {
    fontSize: 11,
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
  quickBtns: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  quickBtnSky: {
    flex: 1,
    backgroundColor: "#e0f2fe",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  quickTextSky: {
    color: "#0284c7",
    fontSize: 10,
    fontWeight: "bold",
  },
  quickBtnAmber: {
    flex: 1,
    backgroundColor: "#fef3c7",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  quickTextAmber: {
    color: "#b45309",
    fontSize: 10,
    fontWeight: "bold",
  },
  historyCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyHistoryText: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  emptyHistorySub: {
    fontSize: 10,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 10,
  },
  historyUserGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  userDotText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  historyUserName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  historyTime: {
    fontSize: 9,
    color: "#94a3b8",
  },
  amountText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0284c7",
  },
});
