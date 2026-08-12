// Automatic Sync Engine: Monitors network connectivity & flushes offline action queue

import { supabase } from "@/lib/supabase/client";
import {
  getPendingQueue,
  removePendingAction,
  PendingAction,
} from "./storageEngine";

export type SyncState = "online" | "offline" | "syncing";

interface SyncStatus {
  state: SyncState;
  pendingCount: number;
}

type SyncStatusListener = (status: SyncStatus) => void;

class SyncEngine {
  private state: SyncState = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";
  private listeners: Set<SyncStatusListener> = new Set();
  private isProcessing = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.state = navigator.onLine ? "online" : "offline";
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  public getStatus(): SyncStatus {
    const queue = getPendingQueue();
    return {
      state: this.state,
      pendingCount: queue.length,
    };
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private handleOnline = () => {
    this.state = "online";
    this.notify();
    this.flushQueue();
  };

  private handleOffline = () => {
    this.state = "offline";
    this.notify();
  };

  /**
   * Iterate through pending offline actions and execute them against Supabase
   */
  public async flushQueue(): Promise<void> {
    if (this.isProcessing || typeof navigator === "undefined" || !navigator.onLine) {
      return;
    }

    const queue = getPendingQueue();
    if (queue.length === 0) {
      this.state = "online";
      this.notify();
      return;
    }

    this.isProcessing = true;
    this.state = "syncing";
    this.notify();

    for (const action of queue) {
      try {
        const success = await this.executeAction(action);
        if (success) {
          removePendingAction(action.id);
        } else {
          console.warn(`Action ${action.id} failed, will retry later.`);
          break; // Stop flushing if an action fails to maintain order
        }
      } catch (err) {
        console.error(`Error flushing action ${action.id}:`, err);
        break;
      }
    }

    this.isProcessing = false;
    const remainingQueue = getPendingQueue();
    this.state = remainingQueue.length === 0 ? "online" : "offline";
    this.notify();
  }

  private async executeAction(action: PendingAction): Promise<boolean> {
    const { type, payload } = action;

    switch (type) {
      case "SEND_MESSAGE": {
        const { coupleId, senderId, senderName, content } = payload;
        const { error } = await supabase.from("chat_messages").insert({
          couple_id: coupleId,
          sender_id: senderId,
          sender_name: senderName,
          content,
        });
        return !error;
      }

      case "SEND_PHOTO": {
        const { coupleId, senderId, senderName, content, photoStoragePath } = payload;
        const { error } = await supabase.from("chat_messages").insert({
          couple_id: coupleId,
          sender_id: senderId,
          sender_name: senderName,
          content: content || "",
          photo_storage_path: photoStoragePath,
        });
        return !error;
      }

      case "MARK_READ": {
        const { messageId, readAt } = payload;
        const { error } = await supabase
          .from("chat_messages")
          .update({ read_at: readAt })
          .eq("id", messageId);
        return !error;
      }

      case "LOG_HYDRATION": {
        const { coupleId, userId, userName, amountMl, loggedAt } = payload;
        const { error } = await supabase.from("hydration_logs").insert({
          couple_id: coupleId,
          user_id: userId,
          user_name: userName,
          amount_ml: amountMl,
          logged_at: loggedAt,
        });
        return !error;
      }

      case "SAVE_DOODLE": {
        const { coupleId, createdBy, createdByName, title, storagePath } = payload;
        const { error } = await supabase.from("saved_doodles").insert({
          couple_id: coupleId,
          created_by: createdBy,
          created_by_name: createdByName,
          title,
          storage_path: storagePath,
        });
        return !error;
      }

      case "PAIR_COUPLE": {
        const { userId, coupleId } = payload;
        const { error } = await supabase
          .from("users")
          .update({ couple_id: coupleId })
          .eq("id", userId);
        return !error;
      }

      default:
        return true;
    }
  }
}

export const syncEngine = new SyncEngine();
