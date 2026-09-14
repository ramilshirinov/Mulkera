export const REALTOR_SELECT = `
  id, user_id, agency_name, commission_rate, legal_status, contact_number,
  bio, approval_status, is_top_seller, average_rating, review_count,
  total_sales, created_at,
  users:user_id ( id, full_name, avatar_url, email )
`;

export async function fetchApprovedRealtors(supabase, { sort = "rating" } = {}) {
  let query = supabase
    .from("realtor_profiles")
    .select(REALTOR_SELECT)
    .eq("approval_status", "approved");

  if (sort === "rating") {
    query = query.order("average_rating", { ascending: false }).order("review_count", { ascending: false });
  } else if (sort === "sales") {
    query = query.order("total_sales", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchRealtorById(supabase, id) {
  const { data, error } = await supabase
    .from("realtor_profiles")
    .select(REALTOR_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRealtorListings(supabase, userId) {
  const { data, error } = await supabase
    .from("listings")
    .select("id, listing_number, title_az, price, currency, status, view_count, created_at, listing_photos(url, sort_order)")
    .eq("owner_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRealtorReviews(supabase, realtorId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, reviewer_id, users:reviewer_id(full_name, avatar_url)")
    .eq("realtor_id", realtorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function submitReview(supabase, { listingId, realtorId, reviewerId, rating, comment }) {
  const { error } = await supabase.from("reviews").upsert(
    {
      listing_id: listingId || null,
      realtor_id: realtorId,
      reviewer_id: reviewerId,
      rating,
      comment,
    },
    { onConflict: "reviewer_id,listing_id" }
  );
  if (error) throw error;
}

export async function fetchPendingRealtors(supabase) {
  const { data, error } = await supabase
    .from("realtor_profiles")
    .select(REALTOR_SELECT)
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateRealtorApproval(supabase, realtorId, status, adminId, rejectionReason) {
  const { error } = await supabase
    .from("realtor_profiles")
    .update({
      approval_status: status,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason || null,
    })
    .eq("id", realtorId);
  if (error) throw error;
}