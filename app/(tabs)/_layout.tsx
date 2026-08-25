import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopHeader } from "@/components/TopHeader";
import { DockedAudioPlayer } from "@/components/DockedAudioPlayer";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Home,
  Music,
  Pencil,
  MessageCircle,
  Timer,
  Droplet,
  User,
} from "lucide-react-native";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <TopHeader />

      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              height: 56 + insets.bottom / 2,
              paddingBottom: insets.bottom / 2,
            },
            tabBarActiveTintColor: "#f43f5e",
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "600",
              marginTop: -4,
              marginBottom: 4,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => <Home size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="music"
            options={{
              title: "Music",
              tabBarIcon: ({ color, size }) => <Music size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="canvas"
            options={{
              title: "Canvas",
              tabBarIcon: ({ color, size }) => <Pencil size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: "Chat",
              tabBarIcon: ({ color, size }) => <MessageCircle size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="focus"
            options={{
              title: "Focus",
              tabBarIcon: ({ color, size }) => <Timer size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="hydration"
            options={{
              title: "Water",
              tabBarIcon: ({ color, size }) => <Droplet size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, size }) => <User size={20} color={color} />,
            }}
          />
        </Tabs>
      </View>

      <DockedAudioPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
