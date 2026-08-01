import { supabase } from "./client";
import { Song, ChatMessage, HydrationLog, SavedDoodle, UserProfile, Couple } from "@/types";

// Helper to check if real Supabase client is connected (non-dummy key)
export function isSupabaseConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://dumbo-couple-demo.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("dummy_key")
  );
}

// ==================== USER & COUPLE QUERIES ====================

export async function dbFetchUserAndCouple(userId: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userErr || !user) return null;

    if (!user.couple_id) return { user, couple: null };

    const { data: couple, error: coupleErr } = await supabase
      .from("couples")
      .select("*, partner1:users!couples_partner1_id_fkey(*), partner2:users!couples_partner2_id_fkey(*)")
      .eq("id", user.couple_id)
      .single();

    if (coupleErr) return { user, couple: null };
    return { user, couple };
  } catch (err) {
    console.warn("dbFetchUserAndCouple error:", err);
    return null;
  }
}

export async function dbCreateCouple(userId: string, pairingCode: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: couple, error: coupleErr } = await supabase
      .from("couples")
      .insert({ pairing_code: pairingCode })
      .select()
      .single();

    if (coupleErr || !couple) throw coupleErr;

    const { error: userErr } = await supabase
      .from("users")
      .update({ couple_id: couple.id })
      .eq("id", userId);

    if (userErr) throw userErr;
    return couple;
  } catch (err) {
    console.warn("dbCreateCouple error:", err);
    return null;
  }
}

export async function dbJoinCoupleWithCode(userId: string, pairingCode: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: couple, error: coupleErr } = await supabase
      .from("couples")
      .select("*")
      .eq("pairing_code", pairingCode)
      .single();

    if (coupleErr || !couple) return null;

    const { error: userErr } = await supabase
      .from("users")
      .update({ couple_id: couple.id })
      .eq("id", userId);

    if (userErr) throw userErr;
    return couple;
  } catch (err) {
    console.warn("dbJoinCoupleWithCode error:", err);
    return null;
  }
}

export async function dbUpdateUserDnd(userId: string, isDnd: boolean) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("users").update({ is_dnd: isDnd }).eq("id", userId);
  } catch (err) {
    console.warn("dbUpdateUserDnd error:", err);
  }
}

export async function dbUpdateUserOnline(userId: string, isOnline: boolean) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("users").update({ is_online: isOnline }).eq("id", userId);
  } catch (err) {
    console.warn("dbUpdateUserOnline error:", err);
  }
}

// ==================== MUSIC / SONGS QUERIES ====================

export async function dbFetchSongs(coupleId: string): Promise<Song[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("couple_id", coupleId)
      .order("queue_position", { ascending: true });

    if (error) return null;
    return data.map((s) => ({
      id: s.id,
      coupleId: s.couple_id,
      title: s.title,
      artist: s.artist || "Unknown Artist",
      storagePath: s.storage_path,
      coverArtUrl: s.cover_art_url,
      durationSeconds: s.duration_seconds || 180,
      addedBy: s.added_by,
      addedByName: s.added_by_name || "Partner",
      queuePosition: s.queue_position || 1,
      createdAt: s.created_at,
    }));
  } catch (err) {
    console.warn("dbFetchSongs error:", err);
    return null;
  }
}

export async function dbInsertSong(song: Omit<Song, "id" | "createdAt">) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("songs")
      .insert({
        couple_id: song.coupleId,
        title: song.title,
        artist: song.artist,
        storage_path: song.storagePath,
        cover_art_url: song.coverArtUrl,
        duration_seconds: song.durationSeconds,
        added_by: song.addedBy,
        added_by_name: song.addedByName,
        queue_position: song.queuePosition,
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.warn("dbInsertSong error:", err);
    return null;
  }
}

export async function dbDeleteSong(songId: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("songs").delete().eq("id", songId);
  } catch (err) {
    console.warn("dbDeleteSong error:", err);
  }
}

// ==================== CHAT MESSAGES QUERIES ====================

export async function dbFetchChatMessages(coupleId: string): Promise<ChatMessage[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: true });

    if (error) return null;
    return data.map((m) => ({
      id: m.id,
      coupleId: m.couple_id,
      senderId: m.sender_id,
      senderName: m.sender_name || "Partner",
      content: m.content || "",
      photoStoragePath: m.photo_storage_path,
      readAt: m.read_at,
      createdAt: m.created_at,
    }));
  } catch (err) {
    console.warn("dbFetchChatMessages error:", err);
    return null;
  }
}

export async function dbInsertChatMessage(msg: Omit<ChatMessage, "id" | "createdAt">) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        couple_id: msg.coupleId,
        sender_id: msg.senderId,
        sender_name: msg.senderName,
        content: msg.content,
        photo_storage_path: msg.photoStoragePath,
        read_at: msg.readAt,
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.warn("dbInsertChatMessage error:", err);
    return null;
  }
}

export async function dbMarkChatMessageAsRead(messageId: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  } catch (err) {
    console.warn("dbMarkChatMessageAsRead error:", err);
  }
}

// ==================== HYDRATION LOGS QUERIES ====================

export async function dbFetchHydrationLogs(coupleId: string): Promise<HydrationLog[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("hydration_logs")
      .select("*")
      .eq("couple_id", coupleId)
      .order("logged_at", { ascending: false });

    if (error) return null;
    return data.map((h) => ({
      id: h.id,
      coupleId: h.couple_id,
      userId: h.user_id,
      userName: h.user_name || "User",
      loggedAt: h.logged_at,
      amountMl: h.amount_ml,
    }));
  } catch (err) {
    console.warn("dbFetchHydrationLogs error:", err);
    return null;
  }
}

export async function dbInsertHydrationLog(log: Omit<HydrationLog, "id">) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("hydration_logs")
      .insert({
        couple_id: log.coupleId,
        user_id: log.userId,
        user_name: log.userName,
        logged_at: log.loggedAt,
        amount_ml: log.amountMl,
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.warn("dbInsertHydrationLog error:", err);
    return null;
  }
}

// ==================== SAVED DOODLES QUERIES ====================

export async function dbFetchSavedDoodles(coupleId: string): Promise<SavedDoodle[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("saved_doodles")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (error) return null;
    return data.map((d) => ({
      id: d.id,
      coupleId: d.couple_id,
      createdBy: d.created_by,
      createdByName: d.created_by_name || "Partner",
      title: d.title || "Untitled Doodle",
      storagePath: d.storage_path,
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.warn("dbFetchSavedDoodles error:", err);
    return null;
  }
}

export async function dbInsertSavedDoodle(doodle: Omit<SavedDoodle, "id">) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("saved_doodles")
      .insert({
        couple_id: doodle.coupleId,
        created_by: doodle.createdBy,
        created_by_name: doodle.createdByName,
        title: doodle.title,
        storage_path: doodle.storagePath,
        created_at: doodle.createdAt,
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.warn("dbInsertSavedDoodle error:", err);
    return null;
  }
}

export async function dbDeleteSavedDoodle(doodleId: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("saved_doodles").delete().eq("id", doodleId);
  } catch (err) {
    console.warn("dbDeleteSavedDoodle error:", err);
  }
}
