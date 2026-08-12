import { create } from "zustand";
import { Couple, UserProfile } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useAudioStore } from "./useAudioStore";
import { useChatStore } from "./useChatStore";
import { useHydrationStore } from "./useHydrationStore";
import { useCanvasStore } from "./useCanvasStore";
import {
  saveLocalCouple,
  getLocalCouple,
  enqueuePendingAction,
} from "@/lib/offline/storageEngine";

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
  pairingCode: "UNPAIRED",
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
  availableUsers: UserProfile[];

  // Actions
  syncUserSession: (clerkUser: any) => Promise<void>;
  fetchAvailableUsers: () => Promise<void>;
  pairWithUser: (targetUser: UserProfile) => Promise<void>;
  toggleDnd: (userId: string) => Promise<void>;
  setPairingCode: (code: string) => Promise<void>;
  setOnlineStatus: (userId: string, isOnline: boolean) => Promise<void>;
  getActiveUser: () => UserProfile;
  getPartnerUser: () => UserProfile;
  initPresence: () => () => void;
  switchActiveUser: (userId: string) => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: getLocalCouple() || DEFAULT_COUPLE,
  currentUserId: "",
  isPaired: false,
  loading: true,
  availableUsers: [
    {
      id: "user_kirti",
      coupleId: "",
      displayName: "Kirti Chaudhari",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kirti",
      isOnline: true,
      isDnd: false,
    },
    {
      id: "user_sumit",
      coupleId: "",
      displayName: "Sumit Wod",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Sumit",
      isOnline: true,
      isDnd: false,
    },
  ],

  switchActiveUser: () => {}, // Managed by Clerk

  fetchAvailableUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: UserProfile[] = data.map((u: any) => ({
          id: u.id,
          coupleId: u.couple_id || "",
          displayName: u.display_name || u.id,
          avatarUrl: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
          isOnline: u.is_online || false,
          isDnd: u.is_dnd || false,
        }));
        set({ availableUsers: formatted });
      }
    } catch (err) {
      console.warn("Using offline available users fallback:", err);
    }
  },

  pairWithUser: async (targetUser: UserProfile) => {
    const { currentUserId, getActiveUser } = get();
    const activeUser = getActiveUser();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // Check if target user already belongs to a couple or create new couple
    let coupleId = targetUser.coupleId;

    if (!coupleId) {
      // Generate a new couple ID
      const newPairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      if (isOnline) {
        try {
          const { data: newCouple, error: coupleErr } = await supabase
            .from("couples")
            .insert({ pairing_code: newPairingCode })
            .select()
            .single();

          if (!coupleErr && newCouple) {
            coupleId = newCouple.id;
          }
        } catch (e) {
          console.warn("Failed online couple creation:", e);
        }
      }

      if (!coupleId) {
        coupleId = `couple-local-${Date.now()}`;
      }
    }

    // Assign couple_id to both users
    const updatedPartner1: UserProfile = { ...activeUser, coupleId };
    const updatedPartner2: UserProfile = { ...targetUser, coupleId };

    const updatedCouple: Couple = {
      id: coupleId,
      createdAt: new Date().toISOString(),
      pairingCode: "DUO-HUB",
      partner1: updatedPartner1,
      partner2: updatedPartner2,
    };

    set({
      couple: updatedCouple,
      isPaired: true,
    });
    saveLocalCouple(updatedCouple);

    if (isOnline) {
      try {
        await supabase.from("users").update({ couple_id: coupleId }).eq("id", currentUserId);
        await supabase.from("users").update({ couple_id: coupleId }).eq("id", targetUser.id);
      } catch (e) {
        enqueuePendingAction({ type: "PAIR_COUPLE", payload: { userId: currentUserId, coupleId } });
        enqueuePendingAction({ type: "PAIR_COUPLE", payload: { userId: targetUser.id, coupleId } });
      }
    } else {
      enqueuePendingAction({ type: "PAIR_COUPLE", payload: { userId: currentUserId, coupleId } });
      enqueuePendingAction({ type: "PAIR_COUPLE", payload: { userId: targetUser.id, coupleId } });
    }

    // Trigger store data sync for couple space
    useAudioStore.getState().fetchSongs(coupleId);
    useChatStore.getState().fetchMessages(coupleId);
    useHydrationStore.getState().fetchLogs(coupleId);
    useCanvasStore.getState().fetchDoodles(coupleId);
  },

  syncUserSession: async (clerkUser: any) => {
    if (!clerkUser) {
      set({ couple: DEFAULT_COUPLE, currentUserId: "", isPaired: false, loading: false });
      return;
    }

    const userId = clerkUser.id;
    const displayName = clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses?.[0]?.emailAddress || "You";
    const avatarUrl = clerkUser.imageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    set({ currentUserId: userId });

    if (isOnline) {
      try {
        // Upsert profile in Supabase
        const { data: userProfile, error: upsertErr } = await supabase
          .from("users")
          .upsert({
            id: userId,
            display_name: displayName,
            avatar_url: avatarUrl,
          })
          .select()
          .single();

        if (!upsertErr && userProfile) {
          get().fetchAvailableUsers();

          if (userProfile.couple_id) {
            const { data: members } = await supabase
              .from("users")
              .select("*")
              .eq("couple_id", userProfile.couple_id);

            if (members) {
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

              const coupleObj: Couple = {
                id: userProfile.couple_id,
                createdAt: new Date().toISOString(),
                pairingCode: "DUO-HUB",
                partner1: activeUser,
                partner2: partnerUser,
              };

              set({
                couple: coupleObj,
                isPaired: !!partner,
                loading: false,
              });
              saveLocalCouple(coupleObj);

              useAudioStore.getState().fetchSongs(userProfile.couple_id);
              useChatStore.getState().fetchMessages(userProfile.couple_id);
              useHydrationStore.getState().fetchLogs(userProfile.couple_id);
              useCanvasStore.getState().fetchDoodles(userProfile.couple_id);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Online user sync failed, using offline mode:", err);
      }
    }

    // Offline / Unpaired fallback
    const cachedCouple = getLocalCouple();
    if (cachedCouple) {
      set({
        couple: cachedCouple,
        isPaired: cachedCouple.partner2.id !== "no-partner-yet",
        loading: false,
      });
      return;
    }

    const activeUser: UserProfile = {
      id: userId,
      coupleId: "",
      displayName,
      avatarUrl,
      isOnline: true,
      isDnd: false,
    };

    const fallbackCouple: Couple = {
      id: "",
      createdAt: new Date().toISOString(),
      pairingCode: "UNPAIRED",
      partner1: activeUser,
      partner2: PLACEHOLDER_PARTNER,
    };

    set({
      couple: fallbackCouple,
      isPaired: false,
      loading: false,
    });
    saveLocalCouple(fallbackCouple);
  },

  toggleDnd: async (userId: string) => {
    const { couple, currentUserId } = get();
    if (!couple || !currentUserId) return;

    const isActiveUser = userId === currentUserId;
    const targetUser = isActiveUser ? couple.partner1 : couple.partner2;
    const newDnd = !targetUser.isDnd;

    if (isActiveUser && navigator.onLine) {
      await supabase.from("users").update({ is_dnd: newDnd }).eq("id", userId);
    }

    const updatedCouple = {
      ...couple,
      partner1: isActiveUser ? { ...couple.partner1, isDnd: newDnd } : couple.partner1,
      partner2: !isActiveUser ? { ...couple.partner2, isDnd: newDnd } : couple.partner2,
    };

    set({ couple: updatedCouple });
    saveLocalCouple(updatedCouple);
  },

  setPairingCode: async (code: string) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    const { data: existingCouple } = await supabase
      .from("couples")
      .select("*")
      .eq("pairing_code", code)
      .single();

    let coupleId = existingCouple?.id;

    if (!coupleId) {
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

    await supabase.from("users").update({ couple_id: coupleId }).eq("id", currentUserId);

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

    if (userId === currentUserId && navigator.onLine) {
      await supabase.from("users").update({ is_online: isOnline }).eq("id", userId);
    }

    const isActiveUser = userId === currentUserId;
    const updatedCouple = {
      ...couple,
      partner1: isActiveUser ? { ...couple.partner1, isOnline } : couple.partner1,
      partner2: !isActiveUser ? { ...couple.partner2, isOnline } : couple.partner2,
    };

    set({ couple: updatedCouple });
    saveLocalCouple(updatedCouple);
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
