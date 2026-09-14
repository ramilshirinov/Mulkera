"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { FiHeart, FiMapPin, FiHome, FiEye, FiTrash2 } from "react-icons/fi";

export default function FavoritesPage() {
  const { user, supabase } = useApp();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      // Əgər favorites cədvəli varsa, oradan çəkirik
      const { data, error } = await supabase
        .from("favorites")
        .select("id, listing_id, listings(*)")
        .eq("user_id", user.id);

      if (!error && data) {
        // Formatlaşdırma
        const formatted = data.map(item => item.listings).filter(Boolean);
        setFavorites(formatted);
      }
      setLoading(false);
    }

    fetchFavorites();
  }, [user, supabase]);

  const removeFavorite = async (listingId) => {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (!error) {
      setFavorites(favorites.filter(item => item.id !== listingId));
    } else {
      alert("Silinərkən xəta baş verdi.");
    }
  };

  if (loading) {
    return <div className="py-32 text-center text-navy font-medium">Favoritlər yüklənir...</div>;
  }

  if (!user) {
    return (
      <div className="py-32 text-center max-w-md mx-auto px-4">
        <FiHeart className="mx-auto text-5xl text-copper mb-4" />
        <h2 className="text-2xl font-bold text-navy mb-2">Hesabsınız</h2>
        <p className="text-navy/70 text-sm mb-6">Favoritlərinizi görmək üçün sistemə daxil olun.</p>
        <Link href="/login" className="inline-block px-6 py-3 bg-navy text-white rounded-xl font-bold text-sm hover:bg-copper transition">
          Daxil Ol
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-copper/10 text-copper uppercase tracking-wider">
          Saxlanılanlar
        </span>
        <h1 className="text-3xl font-extrabold font-heading text-navy mt-2">Seçilmiş Elanlarım</h1>
        <p className="text-navy/70 text-sm mt-1">Bəyəndiyiniz və yadda saxladığınız daşınmaz əmlak elanları.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-navy/10 shadow-card">
          <FiHeart className="mx-auto text-4xl text-navy/30 mb-3" />
          <p className="text-navy/70 text-base mb-4">Hələ heç bir elan yadda saxlamamısınız.</p>
          <Link href="/listings" className="inline-block px-6 py-3 bg-navy text-white rounded-xl font-bold text-sm hover:bg-copper transition">
            Elanlara Bax
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((listing) => (
            <div key={listing.id} className="card-surface bg-white rounded-2xl shadow-card border border-navy/10 overflow-hidden flex flex-col justify-between relative">
              <button 
                onClick={() => removeFavorite(listing.id)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-rose-600 hover:bg-rose-50 transition shadow-sm"
                title="Favoritlərdən sil"
              >
                <FiTrash2 className="text-sm" />
              </button>

              <div>
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy/40">
                      <FiHome className="text-4xl" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-navy/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                    {listing.transaction_type === "sale" ? "Satış" : "Kirayə"}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-copper uppercase tracking-wider">{listing.property_type || "Əmlak"}</span>
                    <span className="text-xl font-extrabold font-heading text-navy">
                      {listing.price?.toLocaleString()} {listing.currency || "AZN"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-navy line-clamp-1">{listing.title}</h3>

                  <p className="text-xs text-navy/60 flex items-center gap-1.5">
                    <FiMapPin className="text-copper shrink-0" />
                    <span className="truncate">{listing.location}</span>
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  href={`/listings/${listing.id}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-2.5 px-4 text-xs font-semibold transition shadow-sm"
                >
                  <FiEye /> Ətraflı Bax
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}