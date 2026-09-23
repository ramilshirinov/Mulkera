// Shared query helpers for listings communicating directly with our Next.js backend API

export const LISTING_SELECT = `*`;

export async function fetchListings(supabase, filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.keyword || filters.search) params.set("search", filters.keyword || filters.search);
    if (filters.transactionType && filters.transactionType !== "all") params.set("type", filters.transactionType);
    if (filters.categoryId && filters.categoryId !== "all") params.set("category", filters.categoryId);
    if (filters.districtId && filters.districtId !== "all") params.set("district", filters.districtId);
    if (filters.city && filters.city !== "all") params.set("city", filters.city);
    if (filters.rooms && filters.rooms !== "all") params.set("rooms", filters.rooms);
    if (filters.priceMin) params.set("min_price", filters.priceMin);
    if (filters.priceMax) params.set("max_price", filters.priceMax);
    if (filters.areaMin) params.set("min_area", filters.areaMin);
    if (filters.areaMax) params.set("max_area", filters.areaMax);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.ownerId) params.set("owner_id", filters.ownerId);
    if (filters.vipOnly) params.set("vip_only", "true");
    if (filters.mortgageOnly) params.set("mortgage", "true");

    const res = await fetch(`/api/listings?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Elanlar gətirilə bilmədi");
    const json = await res.json();
    return { data: json.data || [], count: json.count || (json.data || []).length };
  } catch (err) {
    console.error("fetchListings error:", err);
    return { data: [], count: 0 };
  }
}

export async function fetchListingById(supabase, id) {
  try {
    const res = await fetch(`/api/listings/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("fetchListingById error:", err);
    return null;
  }
}

export async function incrementListingView(supabase, listingId) {
  try {
    await fetch(`/api/listings/${listingId}/view`, { method: "POST" });
  } catch (err) {
    // pass
  }
}

export async function fetchCategories(supabase) {
  try {
    const res = await fetch("/api/categories", { cache: "no-store" });
    if (!res.ok) throw new Error("Kateqoriyalar gətirilə bilmədi");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchCategories error:", err);
    return [];
  }
}

export async function fetchDistricts(supabase) {
  try {
    const res = await fetch("/api/districts", { cache: "no-store" });
    if (!res.ok) throw new Error("Rayonlar gətirilə bilmədi");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchDistricts error:", err);
    return [];
  }
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

export async function createListing(supabase, { payload, photoUrls = [], videoUrls = [] }) {
  const { valid, errors } = validateListingPayload(payload, photoUrls?.length);
  if (!valid) {
    const err = new Error("Validation failed");
    err.fieldErrors = errors;
    throw err;
  }

  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, photoUrls, videoUrls }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Elan yaradılarkən xəta baş verdi");
  }

  return json.data;
}

export async function updateListing(supabase, id, payload) {
  const res = await fetch(`/api/listings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Elan yenilənmədi");
  }

  return json.data;
}

export async function replaceListingMedia(supabase, listingId, { photoUrls = [], videoUrls = [] }) {
  const res = await fetch(`/api/listings/${listingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoUrls, videoUrls }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Şəkillər yenilənmədi");
  }

  return json.data;
}

export async function toggleFavorite(supabase, userId, listingId, isFavorited) {
  const res = await fetch(`/api/listings/${listingId}/favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const json = await res.json();
  return json.favorited;
}

export async function reportListing(supabase, { listingId, reporterId, reason, details }) {
  const res = await fetch(`/api/listings/${listingId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reporterId, reason, details }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Şikayət göndərilmədi");
  }
}

export function localizedField(row, field, locale) {
  return row?.[`${field}_${locale}`] || row?.[`${field}_az`] || "";
}
