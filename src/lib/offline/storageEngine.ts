// Offline storage engine using AsyncStorage for React Native
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PendingAction {
  id: string;
  type: "SEND_MESSAGE" | "SEND_PHOTO" | "MARK_READ" | "LOG_HYDRATION" | "SAVE_DOODLE" | "PAIR_COUPLE";
  payload: any;
  createdAt: string;
}

const STORAGE_KEYS = {
  CHAT_MESSAGES: "dumbo_offline_chat_messages",
  COUPLE_DATA: "dumbo_offline_couple_data",
  HYDRATION_LOGS: "dumbo_offline_hydration_logs",
  DOODLES: "dumbo_offline_doodles",
  PENDING_QUEUE: "dumbo_offline_pending_queue",
  PARTNER_REQUESTS: "dumbo_offline_partner_requests",
};

// In-memory cache for synchronous reads (hydrated on app start)
const memoryCache: Record<string, any> = {};

/**
 * Initialize the in-memory cache from AsyncStorage
 * Call this on app startup
 */
export async function hydrateStorageCache(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      if (value) {
        try {
          memoryCache[key] = JSON.parse(value);
        } catch {
          memoryCache[key] = null;
        }
      }
    });
  } catch (err) {
    console.error("Failed to hydrate storage cache:", err);
  }
}

/**
 * Save data to AsyncStorage with in-memory cache
 */
export async function setLocalItem<T>(key: string, data: T): Promise<void> {
  memoryCache[key] = data;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
  }
}

/**
 * Get data from in-memory cache (synchronous)
 */
export function getLocalItem<T>(key: string, defaultValue: T): T {
  const cached = memoryCache[key];
  return cached !== undefined && cached !== null ? cached : defaultValue;
}

// Chat Messages Persistence
export async function saveLocalMessages(messages: any[]): Promise<void> {
  await setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, messages);
}

export function getLocalMessages(): any[] {
  return getLocalItem(STORAGE_KEYS.CHAT_MESSAGES, []);
}

// Couple Data Persistence
export async function saveLocalCouple(couple: any): Promise<void> {
  await setLocalItem(STORAGE_KEYS.COUPLE_DATA, couple);
}

export function getLocalCouple(): any | null {
  return getLocalItem(STORAGE_KEYS.COUPLE_DATA, null);
}

// Hydration Logs Persistence
export async function saveLocalHydrationLogs(logs: any[]): Promise<void> {
  await setLocalItem(STORAGE_KEYS.HYDRATION_LOGS, logs);
}

export function getLocalHydrationLogs(): any[] {
  return getLocalItem(STORAGE_KEYS.HYDRATION_LOGS, []);
}

// Doodles Persistence
export async function saveLocalDoodles(doodles: any[]): Promise<void> {
  await setLocalItem(STORAGE_KEYS.DOODLES, doodles);
}

export function getLocalDoodles(): any[] {
  return getLocalItem(STORAGE_KEYS.DOODLES, []);
}

// Pending Actions Queue (for Offline Sync)
export function getPendingQueue(): PendingAction[] {
  return getLocalItem<PendingAction[]>(STORAGE_KEYS.PENDING_QUEUE, []);
}

export async function enqueuePendingAction(action: Omit<PendingAction, "id" | "createdAt">): Promise<PendingAction> {
  const queue = getPendingQueue();
  const newAction: PendingAction = {
    ...action,
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const updatedQueue = [...queue, newAction];
  await setLocalItem(STORAGE_KEYS.PENDING_QUEUE, updatedQueue);
  return newAction;
}

export async function removePendingAction(actionId: string): Promise<void> {
  const queue = getPendingQueue();
  const updatedQueue = queue.filter((item) => item.id !== actionId);
  await setLocalItem(STORAGE_KEYS.PENDING_QUEUE, updatedQueue);
}

export async function clearPendingQueue(): Promise<void> {
  await setLocalItem(STORAGE_KEYS.PENDING_QUEUE, []);
}

// Partner Requests Persistence
export async function saveLocalRequests(requests: any[]): Promise<void> {
  await setLocalItem(STORAGE_KEYS.PARTNER_REQUESTS, requests);
}

export function getLocalRequests(): any[] {
  return getLocalItem(STORAGE_KEYS.PARTNER_REQUESTS, []);
}
