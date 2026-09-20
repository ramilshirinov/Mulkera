"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { useFavorite } from "@/hooks/useFavorite";
import ListingCard from "@/components/ListingCard";
import { localizedField } from "@/lib/listings";
import { 
  FiMapPin, FiCalendar, FiDollarSign, FiHome, FiMaximize2, 
  FiShield, FiChevronLeft, FiChevronRight, FiX, FiPhone, 
  FiUser, FiCheckCircle, FiPlay, FiLayers, FiBriefcase, FiHeart 
} from "react-icons/fi";

const PLACEHOLDER = "/images/placeholder-property.svg";

// Faylın uzantısına görə MIME tipi (.mov faylları H.264 olduqda mp4 kimi oxunur)
function getMime(url = "") {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".ogg") || clean.endsWith(".ogv")) return "video/ogg";
  return "video/mp4";
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { supabase, locale, user } = useApp();
  const [listing, setListing] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(null);

  // Şəkil qalereyası üçün əlavə state-lər (ListingMedia funksionallığı)
  const [activeImageTab, setActiveImageTab] = useState(0);
  const [failed, setFailed] = useState({});

  const { isFavorited, toggling, toggleFavorite } = useFavorite(id);

  useEffect(() => {
    async function fetchListingDetail() {
      if (!id) return;
      setLoading(true);
      setFetchError(null);
      try {
        // Əsas elan məlumatları (profiles olmadan, xəta verməməsi üçün)
        const { data, error } = await supabase
          .from("listings")
          .select(`
            *,
            listing_photos (*),
            categories (*),
            districts (*)
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Elan sorğusunda xəta mesajı:", error.message);
          console.error("Xəta kodu:", error.code);
          setFetchError(error);
          setListing(null);
        } else {
          let listingData = data;

          // Əgər elanın user_id-si varsa, profil məlumatını ayrıca çəkək
          if (listingData && listingData.user_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", listingData.user_id)
              .maybeSingle();
            
            listingData.profiles = profileData || null;
          }

          setListing(listingData);

          if (listingData) {
            // Oxşar elanların çəkilməsi
            let query = supabase
              .from("listings")
              .select("*, listing_photos(*), categories(*), districts(*)")
              .neq("id", id);

            if (listingData.category_id) {
              query = query.eq("category_id", listingData.category_id);
            }

            const { data: related } = await query.limit(3);
            setRelatedListings(related || []);
          }
        }
      } catch (err) {
        console.error("Gözlənilməz xəta baş verdi:", err);
        setFetchError(err);
        setListing(null);
      } finally {
        setLoading(false);
      }
    }

    fetchListingDetail();
  }, [id, supabase]);

  const handleFavoriteClick = async () => {
    const result = await toggleFavorite();
    if (result?.requiresAuth) {
      router.push(`/login?redirect=/listings/${id}`);
    }
  };

  if (loading) {
    return <div className="py-32 text-center text-navy/60 font-medium">Elan məlumatları yüklənir...</div>;
  }

  if (!listing) {
    return (
      <div className="py-32 text-center px-4">
        <h2 className="text-2xl font-bold text-navy mb-2">
          {fetchError ? "Elanı yükləmək mümkün olmadı" : "Elan tapılmadı"}
        </h2>
        <p className="text-navy/60 text-sm mb-6">
          {fetchError
            ? "Məlumat bazasından məlumat alınarkən xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin."
            : "Axtardığınız elan silinib və ya mövcud deyil."}
        </p>
        <Link href="/listings" className="px-6 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-copper transition inline-block">
          Elanlara qayıt
        </Link>
      </div>
    );
  }

  const rawPhotos = listing.listing_photos || [];
  const sortedPhotos = rawPhotos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const mediaItems = sortedPhotos.length > 0
    ? sortedPhotos
    : [
        ...(listing.image_url ? [{ id: 1, url: listing.image_url, media_type: "image" }] : []),
        ...(listing.video_url ? [{ id: 2, url: listing.video_url, media_type: "video" }] : [])
      ];

  const items = Array.isArray(mediaItems) ? mediaItems.filter((m) => m?.url) : [];
  const images = items.filter((m) => m.media_type !== "video");
  const videos = items.filter((m) => m.media_type === "video");

  const currentImage = images[activeImageTab];
  const currentSrc = !currentImage || failed[currentImage.url] ? PLACEHOLDER : currentImage.url;

  const categoryTitle = listing.categories ? localizedField(listing.categories, "name", locale) : (listing.category || "Əmlak");
  const districtTitle = listing.districts ? localizedField(listing.districts, "name", locale) : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      
      {/* Üst Başlıq və Qiymət */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-copper/10 text-copper uppercase tracking-wider">
              {categoryTitle}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-navy/10 text-navy uppercase tracking-wider">
              {listing.transaction_type === "sale" ? "Satış" : listing.transaction_type === "daily_rent" ? "Günlük Kirayə" : listing.transaction_type === "other" ? "Digər" : "Uzunmüddətli Kirayə"}
            </span>
            {listing.mortgage_available && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                İpotekaya Yararlı
              </span>
            )}
          </div>
          <div className="flex items-start gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-navy">
              {localizedField(listing, "title", locale) || listing.title || "Daşınmaz Əmlak Elanı"}
            </h1>
            <button
              onClick={handleFavoriteClick}
              disabled={toggling}
              aria-pressed={isFavorited}
              aria-label={isFavorited ? "Sevimlilərdən çıxar" : "Sevimlilərə əlavə et"}
              className={`shrink-0 mt-1 w-10 h-10 rounded-full border flex items-center justify-center transition cursor-pointer ${
                isFavorited
                  ? "bg-copper/10 border-copper text-copper"
                  : "bg-white border-navy/10 text-navy/40 hover:text-copper hover:border-copper"
              } ${toggling ? "opacity-60 cursor-wait" : ""}`}
            >
              <FiHeart className={isFavorited ? "fill-current" : ""} />
            </button>
          </div>
          <p className="text-sm text-navy/60 flex items-center gap-1.5 mt-1.5">
            <FiMapPin className="text-copper shrink-0" /> 
            <span>{listing.address} {districtTitle ? `· ${districtTitle}` : ""}</span>
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

      {/* Media / Qalereya Bloku */}
      <div className="mb-10 space-y-6">
        {/* Şəkil qalereyası */}
        {images.length > 0 && (
          <div className="space-y-3">
            <div 
              className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-card border border-navy/10 cursor-pointer group"
              onClick={() => {
                // Əgər həmin şəkil tapılıbsa, lightbox-da indeksini tapmaq üçün
                const globalIndex = mediaItems.findIndex(m => m.url === currentImage?.url);
                setActiveMediaIndex(globalIndex !== -1 ? globalIndex : 0);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSrc}
                alt={listing.title}
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300"
                onError={() =>
                  currentImage && setFailed((f) => ({ ...f, [currentImage.url]: true }))
                }
              />
              <div className="absolute bottom-4 right-4 bg-navy/80 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 shadow-sm pointer-events-none">
                <FiMaximize2 /> Tam ekran bax
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setActiveImageTab(i)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                      i === activeImageTab
                        ? "border-copper"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={failed[img.url] ? PLACEHOLDER : img.url}
                      alt={`${listing.title} ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Videolar */}
        {videos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold font-heading text-navy dark:text-slate-100">
              Video
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {videos.map((v) => (
                <video
                  key={v.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full aspect-video rounded-xl object-cover bg-black shadow-card border border-navy/10"
                >
                  <source src={v.url} type={getMime(v.url)} />
                  Brauzeriniz video teqini dəstəkləmir.
                </video>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detallar və Əlaqə */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
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
              {listing.yard_sot && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                  <span className="text-navy/60 block text-xs">Həyət sahəsi</span>
                  <span className="font-bold text-navy text-base">{listing.yard_sot} sot</span>
                </div>
              )}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-navy/5">
                <span className="text-navy/60 block text-xs">Elan tarixi</span>
                <span className="font-bold text-navy text-base">
                  {listing.created_at ? new Date(listing.created_at).toLocaleDateString("az-AZ") : "Bu yaxınlarda"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-card">
            <h3 className="text-lg font-bold text-navy mb-3">Ətraflı Məlumat</h3>
            <p className="text-navy/80 leading-relaxed whitespace-pre-line text-sm">
              {localizedField(listing, "description", locale) || listing.description_az || listing.description || "Bu elan üçün əlavə açıqlama qeyd olunmayıb."}
            </p>
          </div>

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
              {listing.phone_number || listing.profiles?.phone ? (
                <a 
                  href={`tel:${listing.phone_number || listing.profiles?.phone}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-3 px-4 text-sm font-semibold transition shadow-sm"
                >
                  <FiPhone /> Zəng Et: {listing.phone_number || listing.profiles?.phone}
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

      {/* Oxşar Elanlar */}
      {relatedListings.length > 0 && (
        <div className="mt-16 pt-10 border-t border-navy/10">
          <h3 className="text-2xl font-bold font-heading text-navy mb-6">Oxşar Elanlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modalı */}
      {activeMediaIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button 
            onClick={() => setActiveMediaIndex(null)}
            className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition z-50 cursor-pointer"
          >
            <FiX size={26} />
          </button>
          
          <button 
            onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))}
            className="absolute left-6 text-white bg-white/10 p-3.5 rounded-full hover:bg-white/20 transition z-50 cursor-pointer"
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
                src={mediaItems[activeMediaIndex]?.url || currentSrc} 
                alt="Fullscreen view" 
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>

          <button 
            onClick={() => setActiveMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))}
            className="absolute right-6 text-white bg-white/10 p-3.5 rounded-full hover:bg-white/20 transition z-50 cursor-pointer"
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