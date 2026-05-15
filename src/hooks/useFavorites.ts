import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProfile } from "@/hooks/useAuthProfile";

interface UseFavoritesResult {
  favorites: string[]; // venue slugs
  isLoading: boolean;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => Promise<boolean>; // true if now favorite
}

export function useFavorites(): UseFavoritesResult {
  const { user, isAuthed } = useAuthProfile();
  const userId = user?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user-favorites", userId ?? "guest"],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_favorites" as never)
        .select("venue_id, venues(slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Array<{ venues: { slug: string } | null }>)
        .map((r) => r.venues?.slug)
        .filter((s): s is string => !!s);
    },
  });

  const favorites = userId ? (query.data ?? []) : [];

  const mutation = useMutation({
    mutationFn: async (slug: string): Promise<boolean> => {
      if (!userId) throw new Error("not_authed");
      // Look up venue uuid by slug
      const { data: venueRow, error: vErr } = await supabase
        .from("venues")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (vErr) throw vErr;
      if (!venueRow) throw new Error("venue_not_found");
      const venueId = venueRow.id;

      const isFav = favorites.includes(slug);
      if (isFav) {
        const { error } = await supabase
          .from("user_favorites" as never)
          .delete()
          .eq("user_id", userId)
          .eq("venue_id", venueId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from("user_favorites" as never)
          .insert({ user_id: userId, venue_id: venueId } as never);
        if (error) throw error;
        return true;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-favorites", userId] });
    },
    onError: (e: Error) => {
      console.error("toggle favorite failed", e);
      toast.error("Kunne ikke oppdatere favoritt");
    },
  });

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);
  const toggleFavorite = useCallback(
    async (slug: string) => {
      if (!isAuthed) return false;
      try {
        return await mutation.mutateAsync(slug);
      } catch {
        return favorites.includes(slug);
      }
    },
    [isAuthed, mutation, favorites],
  );

  return {
    favorites,
    isLoading: !!userId && query.isLoading,
    isFavorite,
    toggleFavorite,
  };
}
