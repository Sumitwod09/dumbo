// Local Storage & IndexedDB persistence engine for offline-first capabilities

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
};

/**
 * Save data to local storage with fallback
 */
export function setLocalItem<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to local storage:`, err);
  }
}

/**
 * Get data from local storage
 */
export function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Failed to read ${key} from local storage:`, err);
    return defaultValue;
  }
}

// Chat Messages Persistence
export function saveLocalMessages(messages: any[]): void {
  setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, messages);
}

export function getLocalMessages(): any[] {
  return getLocalItem(STORAGE_KEYS.CHAT_MESSAGES, []);
}

// Couple Data Persistence
export function saveLocalCouple(couple: any): void {
  setLocalItem(STORAGE_KEYS.COUPLE_DATA, couple);
}

export function getLocalCouple(): any | null {
  return getLocalItem(STORAGE_KEYS.COUPLE_DATA, null);
}

// Hydration Logs Persistence
export function saveLocalHydrationLogs(logs: any[]): void {
  setLocalItem(STORAGE_KEYS.HYDRATION_LOGS, logs);
}

export function getLocalHydrationLogs(): any[] {
  return getLocalItem(STORAGE_KEYS.HYDRATION_LOGS, []);
}

// Doodles Persistence
export function saveLocalDoodles(doodles: any[]): void {
  setLocalItem(STORAGE_KEYS.DOODLES, doodles);
}

export function getLocalDoodles(): any[] {
  return getLocalItem(STORAGE_KEYS.DOODLES, []);
}

// Pending Actions Queue (for Offline Sync)
export function getPendingQueue(): PendingAction[] {
  return getLocalItem<PendingAction[]>(STORAGE_KEYS.PENDING_QUEUE, []);
}

export function enqueuePendingAction(action: Omit<PendingAction, "id" | "createdAt">): PendingAction {
  const queue = getPendingQueue();
  const newAction: PendingAction = {
    ...action,
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const updatedQueue = [...queue, newAction];
  setLocalItem(STORAGE_KEYS.PENDING_QUEUE, updatedQueue);
  return newAction;
}

export function removePendingAction(actionId: string): void {
  const queue = getPendingQueue();
  const updatedQueue = queue.filter((item) => item.id !== actionId);
  setLocalItem(STORAGE_KEYS.PENDING_QUEUE, updatedQueue);
}

export function clearPendingQueue(): void {
  setLocalItem(STORAGE_KEYS.PENDING_QUEUE, []);
}
