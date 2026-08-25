// In-app Supabase keep-alive utility
// Sends a lightweight ping on app startup to reset the inactivity timer
import { supabase } from "./client";

/**
 * Ping Supabase with a lightweight query to prevent free-tier project pausing.
 * Supabase pauses free projects after 7 days of inactivity.
 * This runs silently on app startup — no user impact.
 */
export async function pingSupabaseKeepAlive(): Promise<void> {
  try {
    // A simple select query is enough to count as "activity"
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      console.warn("[KeepAlive] Supabase ping failed:", error.message);
    } else {
      console.log("[KeepAlive] ✅ Supabase ping successful — project is active");
    }
  } catch (err) {
    console.warn("[KeepAlive] Supabase ping error:", err);
  }
}
