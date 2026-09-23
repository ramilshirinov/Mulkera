// Supabase və Backend üzərindən Canlı Yayım (live_streams) və Reytinq (realtor_stats) servisi

/**
 * Canlı yayımların siyahısını gətirir.
 * @param {object} supabase - Supabase Client
 * @param {string} status - 'active' | 'scheduled' | 'ended' | 'all'
 */
export async function fetchLiveStreams(supabase, status = "active") {
  try {
    if (supabase && typeof supabase.from === "function") {
      let query = supabase.from("live_streams").select("*");
      if (status !== "all") {
        query = query.eq("status", status);
      }
      query = query.order("viewers_count", { ascending: false });
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    }

    const res = await fetch(`/api/live?status=${status}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchLiveStreams error:", err);
    return [];
  }
}

/**
 * Yeni canlı yayım və ya PK Arenası otağı açır.
 */
export async function startLiveStream(supabase, { title, description, isPk = false, hostId, listingId = null }) {
  try {
    const payload = {
      title,
      description,
      is_pk: isPk,
      host_id: hostId,
      listing_id: listingId,
      status: "active",
      viewers_count: 1,
      started_at: new Date().toISOString(),
    };

    if (supabase && typeof supabase.from === "function") {
      try {
        const { data, error } = await supabase
          .from("live_streams")
          .insert([payload])
          .select()
          .single();
        if (!error && data) return data;
      } catch (sbErr) {
        console.warn("Supabase direct insert fallback:", sbErr.message);
      }
    }

    const res = await fetch("/api/live/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, isPk, hostId, listingId }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Canlı yayım başladıla bilmədi");
    }
    return json.data;
  } catch (err) {
    console.error("startLiveStream error:", err);
    throw err;
  }
}

/**
 * Canlı yayıma PK hədiyyəsi və ya xal göndərir.
 */
export async function sendLiveGift(supabase, { streamId, side = "left", giftName = "Tac", points = 50, senderName = "Qonaq" }) {
  try {
    const res = await fetch("/api/live/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamId, side, giftName, points, senderName }),
    });
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("sendLiveGift error:", err);
    throw err;
  }
}

/**
 * Rieltorların aylıq reytinq və statistika cədvəlini gətirir.
 */
export async function fetchRealtorStats(supabase, { limit = 20 } = {}) {
  try {
    if (supabase && typeof supabase.from === "function") {
      const { data, error } = await supabase
        .from("realtor_stats")
        .select("*, profiles(*)")
        .order("score", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }
    }

    const res = await fetch(`/api/realtors/rankings?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchRealtorStats error:", err);
    return [];
  }
}
