"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { localizedField } from "@/lib/listings";
import { FiMapPin, FiHome } from "react-icons/fi";

const PLACEHOLDER = "/images/placeholder-property.svg";

export default function ListingCard({ listing }) {
  const { locale, language } = useApp();
  const currentLocale = locale || language || "az";
  const [imgError, setImgError] = useState(false);

  // Şəklin təyini: listing_photos massivindən, köhnə image_url-dən və ya placeholder-dən istifadə edirik
  const photos = Array.isArray(listing.listing_photos) ? listing.listing_photos : [];
  const firstImage = photos.find((p) => p?.url && p.media_type !== "video");
  const rawPhoto = firstImage?.url || listing.image_url || "";
  
  // Əgər şəkil yoxdursa və ya xəta baş veribsə placeholder göstəriləcək
  const mainPhoto = imgError || !rawPhoto ? PLACEHOLDER : rawPhoto;

  // Çoxdilli başlıq, kateqoriya və rayon
  const title = localizedField(listing, "title", currentLocale);
  const categoryName = listing.categories 
    ? localizedField(listing.categories, "name", currentLocale) 
    : (listing.category || "Əmlak");
  const districtName = listing.districts 
    ? localizedField(listing.districts, "name", currentLocale) 
    : "";

  const isSale = listing.transaction_type === "sale";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card-surface bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group block transition hover:shadow-lg border border-navy/10 dark:border-slate-700 flex flex-col justify-between"
    >
      <div>
        {/* Şəkil və nişanlar */}
        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {mainPhoto === PLACEHOLDER && !rawPhoto ? (
            <div className="w-full h-full flex items-center justify-center text-navy/25 dark:text-slate-600">
              <FiHome size={32} />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mainPhoto}
              alt={title || "Əmlak"}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300"
              onError={() => setImgError(true)}
            />
          )}

          {/* VIP badge */}
          {listing.is_vip && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              VIP
            </span>
          )}

          {/* Əməliyyat növü (Satış / Kirayə) */}
          <span className="absolute top-3 left-3 bg-navy/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full">
            {isSale ? "Satış" : "Kirayə"}
          </span>
        </div>

        {/* Məlumat hissəsi */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-copper uppercase tracking-wider truncate">
              {categoryName}
            </span>
            <span className="text-xl font-extrabold font-heading text-navy dark:text-slate-100 whitespace-nowrap">
              {Number(listing.price || 0).toLocaleString()} {listing.currency || "AZN"}
            </span>
          </div>

          <h3 className="text-base font-bold text-navy dark:text-slate-100 truncate group-hover:text-copper transition">
            {title}
          </h3>

          <p className="text-xs text-navy/60 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <FiMapPin className="text-copper shrink-0" />
            <span className="truncate">{listing.address} {districtName ? `· ${districtName}` : ""}</span>
          </p>

          {/* Otaq və sahə məlumatları */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-navy/5 dark:border-slate-700 text-center text-xs text-navy/80 dark:text-slate-300">
            <div><span className="font-bold">{listing.room_count || 1}</span> otaq</div>
            <div><span className="font-bold">{listing.area_m2 || 0}</span> m²</div>
            <div><span className="font-bold">{listing.floor_number || 1}</span>/{listing.total_floors || 1} mərtəbə</div>
          </div>
        </div>
      </div>
    </Link>
  );
}