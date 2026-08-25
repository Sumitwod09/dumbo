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
  saveLocalRequests,
  getLocalRequests,
  enqueuePendingAction,
} from "@/lib/offline/storageEngine";
import { syncEngine } from "@/lib/offline/syncEngine";

export interface PartnerRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  toUserName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

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
  searchQuery: string;
  partnerRequests: PartnerRequest[];

  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  syncUserSession: (clerkUser: any) => Promise<void>;
  fetchAvailableUsers: () => Promise<void>;
  updateProfile: (displayName: string, username: string) => Promise<{ success: boolean; error?: string }>;
  checkUsernameAvailability: (username: string) => boolean;
  sendPartnerRequest: (targetUser: UserProfile) => Promise<void>;
  acceptPartnerRequest: (requestId: string) => Promise<void>;
  declinePartnerRequest: (requestId: string) => Promise<void>;
  getRequestStatusForUser: (userId: string) => "none" | "pending_sent" | "pending_received" | "accepted" | "declined";
  getIncomingRequests: () => PartnerRequest[];
  pairWithUser: (targetUser: UserProfile) => Promise<void>;
  toggleDnd: (userId: string) => Promise<void>;
  setPairingCode: (code: string) => Promise<void>;
  setOnlineStatus: (userId: string, isOnline: boolean) => Promise<void>;
  getActiveUser: () => UserProfile;
  getPartnerUser: () => UserProfile;
  switchActiveUser: (userId: string) => void;
  unpairCouple: () => Promise<void>;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: getLocalCouple() || DEFAULT_COUPLE,
  currentUserId: "",
  isPaired: false,
  loading: true,
  searchQuery: "",
  partnerRequests: getLocalRequests(),
  availableUsers: [
    {
      id: "user_kirti",
      coupleId: "",
      displayName: "Kirti Chaudhari",
      username: "kirti",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kirti",
      isOnline: true,
      isDnd: false,
    },
    {
      id: "user_sumit",
      coupleId: "",
      displayName: "Sumit Wod",
      username: "sumit",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Sumit",
      isOnline: true,
      isDnd: false,
    },
  ],

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  clearSearchQuery: () => set({ searchQuery: "" }),

  switchActiveUser: (userId: string) => {
    const { couple, currentUserId } = get();
    if (!couple) return;

    // Swap partner1 and partner2 if switching to the other user
    if (userId !== currentUserId && userId === couple.partner2.id) {
      const swappedCouple = {
        ...couple,
        partner1: couple.partner2,
        partner2: couple.partner1,
      };
      set({ couple: swappedCouple, currentUserId: userId });
      saveLocalCouple(swappedCouple);
    }
  },

  checkUsernameAvailability: (username: string) => {
    const clean = username.trim().toLowerCase().replace(/^@/, "");
    if (!clean) return false;
    const { availableUsers, currentUserId } = get();
    const existing = availableUsers.find(
      (u) => u.id !== currentUserId && u.username?.toLowerCase() === clean
    );
    return !existing;
  },

  updateProfile: async (displayName: string, username: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    const { currentUserId, couple, availableUsers, checkUsernameAvailability } = get();

    if (!displayName.trim()) {
      return { success: false, error: "Display name cannot be empty." };
    }

    if (cleanUsername && !checkUsernameAvailability(cleanUsername)) {
      return { success: false, error: `Username @${cleanUsername} is already taken by another user.` };
    }

    const updatedPartner1: UserProfile = {
      ...couple.partner1,
      displayName: displayName.trim(),
      username: cleanUsername,
    };

    const updatedCouple = { ...couple, partner1: updatedPartner1 };

    const updatedAvailableUsers = availableUsers.map((u) =>
      u.id === currentUserId
        ? { ...u, displayName: displayName.trim(), username: cleanUsername }
        : u
    );

    set({ couple: updatedCouple, availableUsers: updatedAvailableUsers });
    saveLocalCouple(updatedCouple);

    const isConnected = await syncEngine.isOnline();
    if (isConnected && currentUserId) {
      try {
        await supabase
          .from("users")
          .update({ display_name: displayName.trim(), username: cleanUsername })
          .eq("id", currentUserId);
      } catch (err) {
        console.warn("Offline profile sync queued:", err);
      }
    }

    return { success: true };
  },

  fetchAvailableUsers: async () => {
    const defaultUsers: UserProfile[] = [
      {
        id: "user_kirti",
        coupleId: "",
        displayName: "Kirti Chaudhari",
        username: "kirti",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kirti",
        isOnline: true,
        isDnd: false,
      },
      {
        id: "user_sumit",
        coupleId: "",
        displayName: "Sumit Wod",
        username: "sumit",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Sumit",
        isOnline: true,
        isDnd: false,
      },
    ];

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
          username: u.username || "",
          avatarUrl: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
          isOnline: u.is_online || false,
          isDnd: u.is_dnd || false,
        }));

        // Merge fetched users with defaults without duplicating IDs
        const existingIds = new Set(formatted.map((u) => u.id));
        const merged = [...formatted, ...defaultUsers.filter((u) => !existingIds.has(u.id))];
        set({ availableUsers: merged });
      } else {
        set({ availableUsers: defaultUsers });
      }
    } catch (err) {
      console.warn("Using offline available users fallback:", err);
      set({ availableUsers: defaultUsers });
    }
  },

  unpairCouple: async () => {
    const { couple, currentUserId, getActiveUser } = get();
    const activeUser = getActiveUser();
    
    const uncoupledCouple: Couple = {
      id: "",
      createdAt: new Date().toISOString(),
      pairingCode: "UNPAIRED",
      partner1: { ...activeUser, coupleId: "" },
      partner2: PLACEHOLDER_PARTNER,
    };

    set({ couple: uncoupledCouple, isPaired: false });
    saveLocalCouple(uncoupledCouple);

    const isConnected = await syncEngine.isOnline();
    if (isConnected && currentUserId) {
      try {
        await supabase.from("users").update({ couple_id: null }).eq("id", currentUserId);
      } catch (e) {
        console.warn("Offline unpair queued:", e);
      }
    }
  },

  sendPartnerRequest: async (targetUser: UserProfile) => {
    const { getActiveUser, partnerRequests } = get();
    const activeUser = getActiveUser();

    const newRequest: PartnerRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromUserId: activeUser.id,
      fromUserName: activeUser.displayName,
      fromUserAvatar: activeUser.avatarUrl,
      toUserId: targetUser.id,
      toUserName: targetUser.displayName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const updated = [...partnerRequests, newRequest];
    set({ partnerRequests: updated });
    saveLocalRequests(updated);
  },

  acceptPartnerRequest: async (requestId: string) => {
    const { partnerRequests, availableUsers, pairWithUser } = get();
    const request = partnerRequests.find((r) => r.id === requestId);
    if (!request) return;

    const updated = partnerRequests.map((r) =>
      r.id === requestId ? { ...r, status: "accepted" as const } : r
    );
    set({ partnerRequests: updated });
    saveLocalRequests(updated);

    const senderUser = availableUsers.find((u) => u.id === request.fromUserId) || {
      id: request.fromUserId,
      coupleId: "",
      displayName: request.fromUserName,
      avatarUrl: request.fromUserAvatar,
      isOnline: true,
      isDnd: false,
    };

    await pairWithUser(senderUser);
  },

  declinePartnerRequest: async (requestId: string) => {
    const { partnerRequests } = get();
    const updated = partnerRequests.map((r) =>
      r.id === requestId ? { ...r, status: "declined" as const } : r
    );
    set({ partnerRequests: updated });
    saveLocalRequests(updated);
  },

  getIncomingRequests: () => {
    const { currentUserId, partnerRequests } = get();
    return partnerRequests.filter(
      (r) => r.toUserId === currentUserId && r.status === "pending"
    );
  },

  getRequestStatusForUser: (userId: string) => {
    const { currentUserId, partnerRequests, isPaired, couple } = get();
    if (isPaired && couple.partner2.id === userId) return "accepted";

    const req = partnerRequests.find(
      (r) =>
        (r.fromUserId === currentUserId && r.toUserId === userId) ||
        (r.fromUserId === userId && r.toUserId === currentUserId)
    );

    if (!req) return "none";
    if (req.status === "accepted") return "accepted";
    if (req.status === "declined") return "declined";
    if (req.fromUserId === currentUserId) return "pending_sent";
    return "pending_received";
  },

  pairWithUser: async (targetUser: UserProfile) => {
    const { currentUserId, getActiveUser } = get();
    const activeUser = getActiveUser();
    const isConnected = await syncEngine.isOnline();

    let coupleId = targetUser.coupleId;

    if (!coupleId) {
      const newPairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      if (isConnected) {
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

    const updatedPartner1: UserProfile = { ...activeUser, coupleId };
    const updatedPartner2: UserProfile = { ...targetUser, coupleId };

    const updatedCouple: Couple = {
      id: coupleId,
      createdAt: new Date().toISOString(),
      pairingCode: "DUO-HUB",
      partner1: updatedPartner1,
      partner2: updatedPartner2,
    };

    set({ couple: updatedCouple, isPaired: true });
    saveLocalCouple(updatedCouple);

    if (isConnected) {
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
    const isConnected = await syncEngine.isOnline();

    set({ currentUserId: userId });

    if (isConnected) {
      try {
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

              const activeUserProfile: UserProfile = {
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
                partner1: activeUserProfile,
                partner2: partnerUser,
              };

              set({ couple: coupleObj, isPaired: !!partner, loading: false });
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

    const activeUserProfile: UserProfile = {
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
      partner1: activeUserProfile,
      partner2: PLACEHOLDER_PARTNER,
    };

    set({ couple: fallbackCouple, isPaired: false, loading: false });
    saveLocalCouple(fallbackCouple);
  },

  toggleDnd: async (userId: string) => {
    const { couple, currentUserId } = get();
    if (!couple || !currentUserId) return;

    const isActiveUser = userId === currentUserId;
    const targetUser = isActiveUser ? couple.partner1 : couple.partner2;
    const newDnd = !targetUser.isDnd;

    const isConnected = await syncEngine.isOnline();
    if (isActiveUser && isConnected) {
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

    const isConnected = await syncEngine.isOnline();
    if (userId === currentUserId && isConnected) {
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
    return get().couple.partner1;
  },

  getPartnerUser: () => {
    return get().couple.partner2;
  },
}));
