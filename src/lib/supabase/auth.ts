import { supabase } from "./client";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export async function signUp(email: string, pass: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    // Insert initial profile record in users table
    const { error: profileError } = await supabase.from("users").upsert({
      id: data.user.id,
      display_name: displayName,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`,
      is_dnd: false,
    });
    if (profileError) console.warn("Failed to create profile record:", profileError.message);
  }

  return data;
}

export async function signIn(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
