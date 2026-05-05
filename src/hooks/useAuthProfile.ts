import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  points: number;
  created_at: string;
}

interface AuthProfileState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthed: boolean;
  loading: boolean;
}

export function useAuthProfile(): AuthProfileState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // VIKTIG: Sett opp listener FØR getSession for å unngå race conditions.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setProfile(null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Profil-lookup når sesjonen endres. Defer DB-kall for å unngå deadlock med auth-listener.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, points, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("profile load failed", error);
        return;
      }
      setProfile(data as Profile | null);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [session?.user?.id]);

  return {
    user: session?.user ?? null,
    session,
    profile,
    isAuthed: !!session,
    loading,
  };
}
