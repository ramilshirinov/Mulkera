"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { 
  FiMapPin, FiCalendar, FiDollarSign, FiHome, FiMaximize2, 
  FiShield, FiChevronLeft, FiChevronRight, FiX, FiPhone, 
  FiUser, FiCheckCircle, FiPlay, FiLayers, FiBriefcase 
} from "react-icons/fi";

export default function ListingDetailPage() {
  const { id } = useParams();
  const { supabase, locale } = useApp();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(null); // Lightbox üçün
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all"); // 'all', 'image', 'video'

  useEffect(() => {
    async function fetchListingDetail() {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("listings")
          .select(`
            *,
            categories (*),
            districts (*),
            profiles (*),
            listing_photos (*)
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          setListing(data);
        } else {
          setListing(null);
        }
      } catch (err) {
        console.error("Xəta baş verdi:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchListingDetail();
  }, [id, supabase]);

  if (loading) {
    return <div className="py-32 text-center text-navy/60 font-medium">Elan məlumatları yüklənir...</div>;
  }

  if (!listing) {
    return (
      <div className="py-32 text-center">
        <h2 className="text-2xl font-bold text-navy mb-2">Elan tapılmadı</h2>
        <p className="text-navy/60 text-sm">Axtardığınız elan silinib və ya mövcud deyil.</p>
      </div>
    );
  }

  // Media elementlərini toplayaq (listing_photos cədvəlindən və ya tək image_url-dən)
  const mediaItems = listing.listing_photos && listing.listing_photos.length > 0 
    ? listing.listing_photos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [
        ...(listing.image_url ? [{ id: 1, url: listing.image_url, media_type: "image" }] : []),
        ...(listing.video_url ? [{ id: 2, url: listing.video_url, media_type: "video" }] : [])
      ];

  const filteredMedia = mediaItems.filter(item => {
    if (mediaTypeFilter === "all") return true;
    return item.media_type === mediaTypeFilter;
  });

  const mainImage = mediaItems.find(m => m.media_type === "image")?.url || "/images/placeholder-property.svg";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      
      {/* Üst Başlıq və Qiymət Hissəsi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-copper/10 text-copper uppercase tracking-wider">
              {listing.categories?.name || listing.category || "Əmlak"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-navy/10 text-navy uppercase tracking-wider">
              {listing.transaction_type === "sale" ? "Satış" : listing.transaction_type === "daily_rent" ? "Günlük Kirayə" : "Uzunmüddətli Kirayə"}
            </span>
            {listing.mortgage_available && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                İpotekaya Yararlı
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-navy">
            {listing.title || "Daşınmaz Əmlak Elanı"}
          </h1>
          <p className="text-sm text-navy/60 flex items-center gap-1.5 mt-1.5">
            <FiMapPin className="text-copper shrink-0" /> 
            <span>{listing.address} {listing.districts?.name ? `· ${listing.districts.name}` : ""}</span>
          </p>
        </div>

        <div className="text-left md:text-right bg-white p-4 rounded-2xl border border-navy/10 shadow-sm">
          <div className="text-3xl font-extrabold text-navy font-heading">
            {Number(listing.price || 0).toLocaleString()} {listing.currency || "AZN"}
          </div>
          {listing.price_per_m2 && (
            <div className="text-xs text-navy/60 mt-0.5">
              {listing.price_per_m2} AZN / m²
            </div>
          )}
        </div>
      </div>

      {/* Şəkil və Video Qalereyası */}
      <div className="mb-10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Əsas Böyük Şəkil */}
          <div className="md:col-span-2 h-[420px] rounded-2xl overflow-hidden shadow-card border border-navy/10 relative cursor-pointer group bg-slate-100">
            <img 
              src={mainImage} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onClick={() => setActiveMediaIndex(0)}
            />
            <div className="absolute bottom-4 right-4 bg-navy/80 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 shadow-sm">
              <FiMaximize2 /> Tam ekran bax (Lightbox)
            </div>
          </div>

          {/* Yan Kiçik Şəkillər / Videolar */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 h-[420px]">
            {mediaItems.slice(1, 3).map((item, index) => (
              <div 
                key={item.id || index} 
                className="h-[202px] rounded-xl overflow-hidden shadow-sm border border-navy/10 relative cursor-pointer group bg-slate-100"
                onClick={() => setActiveMediaIndex(index + 1)}
              >
                {item.media_type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-navy/90 text-white">
                    <FiPlay className="text-3xl text-copper" />
                  </div>
                ) : (
                  <img 
                    src={item.url} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bütün Media Siyahısı (Şəkillər və Videolar) */}
        {mediaItems.length > 2 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {mediaItems.map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => setActiveMediaIndex(index)}
                className="shrink-0 w-24 h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-copper transition relative"
              >
                {item.media_type === "video" ? (
                  <div className="w-full h-full bg-navy flex items-center justify-center text-white">
                    <FiPlay className="text-copper" />
                  </div>
                ) : (
                  <img src={item.url} alt="Gallery thumb" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Əsas Məlumatlar və Əlaqə Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Tərəf - Detallar */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Əmlakın Xüsusiyyətləri Bloku */}
          <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-card">
            <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
              <FiHome className="text-copper" /> Əmlakın Parametrləri
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                <span className="text-navy/60 block text-xs">Ümumi Sahə</span>
                <span className="font-bold text-navy text-base">{listing.area_m2 || listing.area || "—"} m²</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                <span className="text-navy/60 block text-xs">Otaq sayı</span>
                <span className="font-bold text-navy text-base">{listing.room_count || listing.rooms || "—"} otaqlı</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                <span className="text-navy/60 block text-xs">Mərtəbə</span>
                <span className="font-bold text-navy text-base">{listing.floor_number || listing.floor || "—"} / {listing.total_floors || "—"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                <span className="text-navy/60 block text-xs">Təhvil Tarixi</span>
                <span className="font-bold text-navy text-base">{listing.delivery_date || "Hazır bina"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                <span className="text-navy/60 block text-xs">Elan tarixi</span>
                <span className="font-bold text-navy text-base">
                  {listing.created_at ? new Date(listing.created_at).toLocaleDateString("az-AZ") : "Bu yaxınlarda"}
                </span>
              </div>
            </div>

            {/* Yeni Parametrlər Bloku (Daxili Kredit, Bitmə Tarixi, Torpaq Sahəsi) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mt-4">
              {listing.internal_credit && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                  <span className="text-navy/60 block text-xs">Daxili Kredit</span>
                  <span className="font-bold text-emerald-600 text-base">Mövcuddur</span>
                </div>
              )}
              {listing.expiry_date && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                  <span className="text-navy/60 block text-xs">Elanın Bitmə Tarixi</span>
                  <span className="font-bold text-navy text-base">{new Date(listing.expiry_date).toLocaleDateString("az-AZ")}</span>
                </div>
              )}
              {listing.land_area && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                  <span className="text-navy/60 block text-xs">Torpaq / Həyət Sahəsi</span>
                  <span className="font-bold text-navy text-base">{listing.land_area} sot</span>
                </div>
              )}
            </div>
          </div>

          {/* Ətraflı Təsvir */}
          <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-card">
            <h3 className="text-lg font-bold text-navy mb-3">Ətraflı Məlumat</h3>
            <p className="text-navy/80 leading-relaxed whitespace-pre-line text-sm">
              {listing.description || "Bu elan üçün əlavə açıqlama qeyd olunmayıb."}
            </p>
          </div>

          {/* Xəritə Bloku */}
          <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-card">
            <h3 className="text-lg font-bold text-navy mb-3 flex items-center gap-2">
              <FiMapPin className="text-copper" /> Yerləşdiyi Ünvan və Xəritə
            </h3>
            <p className="text-sm text-navy/70 mb-4">{listing.address}</p>
            <div className="w-full h-72 rounded-xl overflow-hidden bg-slate-100 border border-navy/10 flex items-center justify-center relative">
              <iframe
                title="Property Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.address || "Sumqayıt, Azerbaijan")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>
          </div>

        </div>

        {/* Sağ Tərəf - Agent / Elan Sahibi */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-card sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-navy">Elan Sahibi</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-navy/10 flex items-center justify-center font-bold text-navy text-lg overflow-hidden border border-navy/10">
                {listing.profiles?.avatar_url ? (
                  <img src={listing.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{listing.profiles?.full_name?.[0] || "R"}</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-navy flex items-center gap-1">
                  {listing.profiles?.full_name || "RF Master Agent"} <FiCheckCircle className="text-emerald-600 text-sm" />
                </h4>
                <p className="text-xs text-navy/60 mt-0.5">
                  {listing.profiles?.agency_name || "RF Master Sales Agency"}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {listing.profiles?.phone ? (
                <a 
                  href={`tel:${listing.profiles.phone}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-3 px-4 text-sm font-semibold transition shadow-sm"
                >
                  <FiPhone /> Zəng Et: {listing.profiles.phone}
                </a>
              ) : (
                <div className="text-center text-xs text-navy/50 py-2">Telefon nömrəsi qeyd olunmayıb</div>
              )}
            </div>

            <div className="border-t border-navy/10 pt-4 text-xs text-navy/60 space-y-1.5">
              <div className="flex justify-between">
                <span>Elan ID:</span>
                <span className="font-mono font-bold text-navy">#{listing.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Baxış sayı:</span>
                <span className="font-bold text-navy">{listing.views_count || 1} dəfə</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox / Tam Ekran Media Modalı */}
      {activeMediaIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button 
            onClick={() => setActiveMediaIndex(null)}
            className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition z-50"
          >
            <FiX size={26} />
          </button>
          
          <button 
            onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))}
            className="absolute left-6 text-white bg-white/10 p-3.5 rounded-full hover:bg-white/20 transition z-50"
          >
            <FiChevronLeft size={28} />
          </button>

          <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
            {mediaItems[activeMediaIndex]?.media_type === "video" ? (
              <video 
                src={mediaItems[activeMediaIndex].url} 
                controls 
                autoPlay 
                className="max-h-[85vh] max-w-[85vw] rounded-xl"
              />
            ) : (
              <img 
                src={mediaItems[activeMediaIndex]?.url || mainImage} 
                alt="Fullscreen view" 
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>

          <button 
            onClick={() => setActiveMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))}
            className="absolute right-6 text-white bg-white/10 p-3.5 rounded-full hover:bg-white/20 transition z-50"
          >
            <FiChevronRight size={28} />
          </button>

          <div className="absolute bottom-6 text-white/70 text-xs font-mono">
            {activeMediaIndex + 1} / {mediaItems.length}
          </div>
        </div>
      )}

    </div>
  );
}