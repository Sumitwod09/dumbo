import { supabase } from "./client";
import { isSupabaseConfigured } from "./queries";

export async function uploadPhoto(file: File, coupleId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${coupleId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn("uploadPhoto error:", err);
    return null;
  }
}

export async function uploadAudio(file: File, coupleId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const ext = file.name.split(".").pop() || "mp3";
    const path = `${coupleId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("audio").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn("uploadAudio error:", err);
    return null;
  }
}

export async function uploadDoodle(dataUrl: string, coupleId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const path = `${coupleId}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("doodles")
      .upload(path, blob, { contentType: "image/png", upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("doodles").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn("uploadDoodle error:", err);
    return null;
  }
}
