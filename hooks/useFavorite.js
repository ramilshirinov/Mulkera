"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";

/**
 * Bir elanın sevimlilər statusunu izləyir və dəyişdirir.
 * Supabase-də aşağıdakı kimi bir "favorites" cədvəli olduğunu güman edir:
 *
 *   create table favorites (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid references auth.users(id) on delete cascade,
 *     listing_id bigint references listings(id) on delete cascade,
 *     created_at timestamptz default now(),
 *     unique (user_id, listing_id)
 *   );
 *
 * Qeyd: RLS aktivdirsə, istifadəçinin öz sətirlərini oxuyub yazması üçün
 * "user_id = auth.uid()" şərtli policy-lər əlavə olunmalıdır.
 */
export function useFavorite(listingId) {
  const { supabase, user } = useApp();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkFavorite() {
      if (!user || !listingId) {
        if (active) {
          setIsFavorited(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      if (active) {
        if (error) {
          console.error("Sevimlilər yoxlanılarkən xəta:", error);
        }
        setIsFavorited(!!data);
        setLoading(false);
      }
    }

    checkFavorite();
    return () => {
      active = false;
    };
  }, [user, listingId, supabase]);

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      // Çağıran tərəf bunu görüb login-ə yönləndirməlidir
      return { requiresAuth: true };
    }
    if (!listingId || toggling) return {};

    const previous = isFavorited;
    setToggling(true);
    setIsFavorited(!previous); // optimistic UI

    try {
      if (previous) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, listing_id: listingId });
        if (error) throw error;
      }
      return { success: true };
    } catch (err) {
      console.error("Sevimlilərə əlavə/silmə xətası:", err);
      setIsFavorited(previous); // xəta olarsa geri qaytar
      return { error: err };
    } finally {
      setToggling(false);
    }
  }, [user, listingId, isFavorited, toggling, supabase]);

  return { isFavorited, loading, toggling, toggleFavorite };
}