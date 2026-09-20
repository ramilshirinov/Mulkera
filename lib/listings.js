// Shared query helpers used by both server components and client components.
// Every function accepts a Supabase client instance so it works with either
// the browser client or the server client.

export const LISTING_SELECT = `
  id, listing_number, owner_id, owner_type, title_az, title_ru, title_en,
  description_az, description_ru, description_en, category_id, district_id,
  transaction_type, price, currency, room_count, area_m2, yard_sot,
  floor_number, total_floors, address, latitude, longitude, documents,
  phone_number, is_vip, vip_expires_at, status, view_count, favorite_count,
  created_at, updated_at,
  categories:category_id ( id, name_az, name_ru, name_en, slug ),
  districts:district_id ( id, name_az, name_ru, name_en, slug ),
  listing_photos ( id, url, media_type, sort_order ),
  users:owner_id ( id, full_name, phone, avatar_url, role )
`;

export async function fetchListings(supabase, filters = {}) {
  let query = supabase
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "active");

  if (filters.districtId) query = query.eq("district_id", filters.districtId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.transactionType) query = query.eq("transaction_type", filters.transactionType);
  if (filters.rooms) query = query.eq("room_count", filters.rooms);
  if (filters.priceMin) query = query.gte("price", filters.priceMin);
  if (filters.priceMax) query = query.lte("price", filters.priceMax);
  if (filters.areaMin) query = query.gte("area_m2", filters.areaMin);
  if (filters.areaMax) query = query.lte("area_m2", filters.areaMax);
  if (filters.vipOnly) query = query.eq("is_vip", true);
  if (filters.keyword) {
    query = query.or(
      `title_az.ilike.%${filters.keyword}%,title_ru.ilike.%${filters.keyword}%,title_en.ilike.%${filters.keyword}%,address.ilike.%${filters.keyword}%`
    );
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "views":
      query = query.order("view_count", { ascending: false });
      break;
    default:
      query = query.order("is_vip", { ascending: false }).order("created_at", { ascending: false });
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 12;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function fetchListingById(supabase, id) {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        categories (*),
        districts (*),
        listing_photos (*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.warn("fetchListingById join query failed, falling back to simple query:", error.message);
      const { data: simpleData, error: simpleError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (simpleError) throw simpleError;
      return simpleData;
    }
    return data;
  } catch (err) {
    console.error("fetchListingById error:", err);
    // Son cəhd: sadə select
    try {
      const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      return data || null;
    } catch {
      return null;
    }
  }
}

export async function incrementListingView(supabase, listingId) {
  await supabase.rpc("increment_listing_view", { p_listing_id: listingId });
}

export async function fetchCategories(supabase) {
  const { data, error } = await supabase.from("categories").select("*").order("id");
  if (error) throw error;
  return data || [];
}

export async function fetchDistricts(supabase) {
  const { data, error } = await supabase.from("districts").select("*").order("name_az");
  if (error) throw error;
  return data || [];
}

const MANDATORY_LISTING_FIELDS = [
  "title_az",
  "description_az",
  "category_id",
  "district_id",
  "transaction_type",
  "price",
  "area_m2",
  "address",
  "phone_number",
];

export function validateListingPayload(payload, photoCount) {
  const errors = {};

  MANDATORY_LISTING_FIELDS.forEach((field) => {
    const value = payload[field];
    if (value === undefined || value === null || value === "") {
      errors[field] = "required";
    }
  });

  if (!photoCount || photoCount < 1) {
    errors.photos = "at_least_one_image_required";
  }

  if (payload.price !== undefined && Number(payload.price) <= 0) {
    errors.price = "must_be_positive";
  }

  if (payload.area_m2 !== undefined && Number(payload.area_m2) <= 0) {
    errors.area_m2 = "must_be_positive";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export async function createListing(supabase, { payload, photoUrls, videoUrls = [] }) {
  const { valid, errors } = validateListingPayload(payload, photoUrls?.length);
  if (!valid) {
    const err = new Error("Validation failed");
    err.fieldErrors = errors;
    throw err;
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert(payload)
    .select()
    .single();

  if (listingError) throw listingError;

  const mediaRows = [
    ...photoUrls.map((url, i) => ({
      listing_id: listing.id,
      url,
      media_type: "image",
      sort_order: i,
    })),
    ...videoUrls.map((url, i) => ({
      listing_id: listing.id,
      url,
      media_type: "video",
      sort_order: photoUrls.length + i,
    })),
  ];

  if (mediaRows.length > 0) {
    const { error: photoError } = await supabase.from("listing_photos").insert(mediaRows);
    if (photoError) throw photoError;
  }

  return listing;
}

// --- ƏLAVƏ OLUNAN FUNKSİYALAR (Build xətasını düzəltmək üçün) ---

export async function updateListing(supabase, id, payload) {
  const { data, error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function replaceListingMedia(supabase, listingId, { photoUrls = [], videoUrls = [] }) {
  // Köhnə şəkil və videoları silirik
  const { error: deleteError } = await supabase
    .from("listing_photos")
    .delete()
    .eq("listing_id", listingId);

  if (deleteError) throw deleteError;

  // Yeni media fayllarını hazırlayırıq
  const mediaRows = [
    ...photoUrls.map((url, i) => ({
      listing_id: listingId,
      url,
      media_type: "image",
      sort_order: i,
    })),
    ...videoUrls.map((url, i) => ({
      listing_id: listingId,
      url,
      media_type: "video",
      sort_order: photoUrls.length + i,
    })),
  ];

  if (mediaRows.length > 0) {
    const { error: insertError } = await supabase.from("listing_photos").insert(mediaRows);
    if (insertError) throw insertError;
  }
}
// ------------------------------------------------------------------

export async function toggleFavorite(supabase, userId, listingId, isFavorited) {
  if (isFavorited) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, listing_id: listingId });
  if (error) throw error;
  return true;
}

export async function reportListing(supabase, { listingId, reporterId, reason, details }) {
  const { error } = await supabase
    .from("listing_reports")
    .insert({ listing_id: listingId, reporter_id: reporterId, reason, details });
  if (error) throw error;
}

export function localizedField(row, field, locale) {
  return row?.[`${field}_${locale}`] || row?.[`${field}_az`] || "";
}