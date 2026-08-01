import { create } from "zustand";
import { Couple, UserProfile } from "@/types";
import { MOCK_COUPLE } from "@/lib/mock/mockData";

interface CoupleState {
  couple: Couple;
  currentUserId: string; // active persona
  isPaired: boolean;

  // Actions
  switchActiveUser: (userId: string) => void;
  toggleDnd: (userId: string) => void;
  setPairingCode: (code: string) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  getActiveUser: () => UserProfile;
  getPartnerUser: () => UserProfile;
  initPresence: () => () => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: MOCK_COUPLE,
  currentUserId: MOCK_COUPLE.partner1.id,
  isPaired: true,

  switchActiveUser: (userId: string) => set({ currentUserId: userId }),

  toggleDnd: (userId: string) => {
    const { couple } = get();
    const updatedCouple = { ...couple };

    if (updatedCouple.partner1.id === userId) {
      updatedCouple.partner1 = {
        ...updatedCouple.partner1,
        isDnd: !updatedCouple.partner1.isDnd,
      };
    } else if (updatedCouple.partner2.id === userId) {
      updatedCouple.partner2 = {
        ...updatedCouple.partner2,
        isDnd: !updatedCouple.partner2.isDnd,
      };
    }

    set({ couple: updatedCouple });
  },

  setPairingCode: (code: string) => {
    const { couple } = get();
    set({
      couple: { ...couple, pairingCode: code },
      isPaired: true,
    });
  },

  setOnlineStatus: (userId: string, isOnline: boolean) => {
    const { couple } = get();
    const updatedCouple = { ...couple };

    if (updatedCouple.partner1.id === userId) {
      updatedCouple.partner1 = { ...updatedCouple.partner1, isOnline };
    } else if (updatedCouple.partner2.id === userId) {
      updatedCouple.partner2 = { ...updatedCouple.partner2, isOnline };
    }

    set({ couple: updatedCouple });
  },

  getActiveUser: () => {
    const { couple, currentUserId } = get();
    return currentUserId === couple.partner1.id
      ? couple.partner1
      : couple.partner2;
  },

  getPartnerUser: () => {
    const { couple, currentUserId } = get();
    return currentUserId === couple.partner1.id
      ? couple.partner2
      : couple.partner1;
  },

  // Set active user online and register beforeunload listener
  initPresence: () => {
    if (typeof window === "undefined") return () => {};

    const { currentUserId, setOnlineStatus } = get();
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
