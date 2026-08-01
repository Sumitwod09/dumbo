import { create } from "zustand";
import { Couple, UserProfile } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useAudioStore } from "./useAudioStore";
import { useChatStore } from "./useChatStore";
import { useHydrationStore } from "./useHydrationStore";
import { useCanvasStore } from "./useCanvasStore";

const PLACEHOLDER_PARTNER: UserProfile = {
  id: "no-partner-yet",
  coupleId: "",
  displayName: "Waiting for partner...",
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=placeholder",
  isOnline: false,
  isDnd: false,
};

const DEFAULT_COUPLE: Couple = {
  id: "",
  createdAt: new Date().toISOString(),
  pairingCode: "",
  partner1: {
    id: "loading",
    coupleId: "",
    displayName: "Loading...",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=loading",
    isOnline: false,
    isDnd: false,
  },
  partner2: PLACEHOLDER_PARTNER,
};

interface CoupleState {
  couple: Couple;
  currentUserId: string;
  isPaired: boolean;
  loading: boolean;

  // Actions
  syncUserSession: (clerkUser: any) => Promise<void>;
  toggleDnd: (userId: string) => Promise<void>;
  setPairingCode: (code: string) => Promise<void>;
  setOnlineStatus: (userId: string, isOnline: boolean) => Promise<void>;
  getActiveUser: () => UserProfile;
  getPartnerUser: () => UserProfile;
  initPresence: () => () => void;
  switchActiveUser: (userId: string) => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: DEFAULT_COUPLE,
  currentUserId: "",
  isPaired: false,
  loading: true,

  switchActiveUser: () => {}, // No-op, managed by Clerk

  syncUserSession: async (clerkUser: any) => {
    if (!clerkUser) {
      set({ couple: DEFAULT_COUPLE, currentUserId: "", isPaired: false, loading: false });
      return;
    }

    const userId = clerkUser.id;
    const displayName = clerkUser.fullName || clerkUser.firstName || "You";
    const avatarUrl = clerkUser.imageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

    // 1. Upsert profile in Supabase
    const { data: userProfile, error: upsertErr } = await supabase
      .from("users")
      .upsert({
        id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (upsertErr || !userProfile) {
      console.error("Failed to sync user profile:", upsertErr);
      return;
    }

    set({ currentUserId: userId });

    // 2. Fetch pairing status
    if (userProfile.couple_id) {
      const { data: members, error: membersErr } = await supabase
        .from("users")
        .select("*")
        .eq("couple_id", userProfile.couple_id);

      if (!membersErr && members) {
        const active = members.find((m) => m.id === userId) || userProfile;
        const partner = members.find((m) => m.id !== userId);

        const activeUser: UserProfile = {
          id: active.id,
          coupleId: active.couple_id,
          displayName: active.display_name,
          avatarUrl: active.avatar_url,
          isOnline: active.is_online,
          isDnd: active.is_dnd,
        };

        const partnerUser: UserProfile = partner
          ? {
              id: partner.id,
              coupleId: partner.couple_id,
              displayName: partner.display_name,
              avatarUrl: partner.avatar_url,
              isOnline: partner.is_online,
              isDnd: partner.is_dnd,
            }
          : PLACEHOLDER_PARTNER;

        // Fetch the couple details (pairing code)
        const { data: coupleDetails } = await supabase
          .from("couples")
          .select("*")
          .eq("id", userProfile.couple_id)
          .single();

        set({
          couple: {
            id: userProfile.couple_id,
            createdAt: coupleDetails?.created_at || new Date().toISOString(),
            pairingCode: coupleDetails?.pairing_code || "UNPAIRED",
            partner1: activeUser,
            partner2: partnerUser,
          },
          isPaired: !!partner,
          loading: false,
        });

        // Trigger background data fetches for the couple space
        useAudioStore.getState().fetchSongs(userProfile.couple_id);
        useChatStore.getState().fetchMessages(userProfile.couple_id);
        useHydrationStore.getState().fetchLogs(userProfile.couple_id);
        useCanvasStore.getState().fetchDoodles(userProfile.couple_id);

        return;
      }
    }

    // Unpaired/no couple yet
    const activeUser: UserProfile = {
      id: userProfile.id,
      coupleId: "",
      displayName: userProfile.display_name,
      avatarUrl: userProfile.avatar_url,
      isOnline: userProfile.is_online,
      isDnd: userProfile.is_dnd,
    };

    set({
      couple: {
        id: "",
        createdAt: new Date().toISOString(),
        pairingCode: "",
        partner1: activeUser,
        partner2: PLACEHOLDER_PARTNER,
      },
      isPaired: false,
      loading: false,
    });
  },

  toggleDnd: async (userId: string) => {
    const { couple, currentUserId } = get();
    if (!couple || !currentUserId) return;

    const isActiveUser = userId === currentUserId;
    const targetUser = isActiveUser ? couple.partner1 : couple.partner2;
    const newDnd = !targetUser.isDnd;

    if (isActiveUser) {
      // Persist active user's DND to database
      await supabase.from("users").update({ is_dnd: newDnd }).eq("id", userId);
    }

    // Optimistically update store state
    set({
      couple: {
        ...couple,
        partner1: isActiveUser ? { ...couple.partner1, isDnd: newDnd } : couple.partner1,
        partner2: !isActiveUser ? { ...couple.partner2, isDnd: newDnd } : couple.partner2,
      },
    });
  },

  setPairingCode: async (code: string) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    // 1. Check if couple with code already exists (Join flow)
    const { data: existingCouple } = await supabase
      .from("couples")
      .select("*")
      .eq("pairing_code", code)
      .single();

    let coupleId = existingCouple?.id;

    if (!coupleId) {
      // 2. If not, create new couple (Create flow)
      const { data: newCouple, error: createErr } = await supabase
        .from("couples")
        .insert({ pairing_code: code })
        .select()
        .single();

      if (createErr) {
        console.error("Failed to create couple:", createErr);
        return;
      }
      coupleId = newCouple.id;
    }

    // 3. Link user to the couple
    await supabase.from("users").update({ couple_id: coupleId }).eq("id", currentUserId);

    // 4. Re-sync user session
    const { data: freshUser } = await supabase.from("users").select("*").eq("id", currentUserId).single();
    if (freshUser) {
      const clerkUserMock = {
        id: freshUser.id,
        fullName: freshUser.display_name,
        imageUrl: freshUser.avatar_url,
      };
      await get().syncUserSession(clerkUserMock);
    }
  },

  setOnlineStatus: async (userId: string, isOnline: boolean) => {
    const { couple, currentUserId } = get();
    if (!couple || !currentUserId) return;

    if (userId === currentUserId) {
      await supabase.from("users").update({ is_online: isOnline }).eq("id", userId);
    }

    const isActiveUser = userId === currentUserId;
    set({
      couple: {
        ...couple,
        partner1: isActiveUser ? { ...couple.partner1, isOnline } : couple.partner1,
        partner2: !isActiveUser ? { ...couple.partner2, isOnline } : couple.partner2,
      },
    });
  },

  getActiveUser: () => {
    const { couple } = get();
    return couple.partner1;
  },

  getPartnerUser: () => {
    const { couple } = get();
    return couple.partner2;
  },

  initPresence: () => {
    if (typeof window === "undefined") return () => {};

    const { currentUserId, setOnlineStatus } = get();
    if (!currentUserId) return () => {};

    setOnlineStatus(currentUserId, true);

    const handleBeforeUnload = () => {
      setOnlineStatus(currentUserId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  },
}));
