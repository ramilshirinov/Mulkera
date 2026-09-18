"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { localizedField } from "@/lib/listings";
import { FiMapPin, FiHome } from "react-icons/fi";

const PLACEHOLDER = "/images/placeholder-property.svg";

export default function ListingCard({ listing }) {
  const { locale } = useApp();
  const [imgError, setImgError] = useState(false);

  // Şəklin təyini: listing_photos massivindən əsas şəkli tapırıq, yoxdursa köhnə image_url-ə və ya placeholder-ə baxırıq
  const rawPhoto =
    listing.listing_photos?.find((p) => p.media_type === "image")?.url ||
    listing.image_url ||
    PLACEHOLDER;

  // Boş sətir ("") də uyğunsuz sayılmalıdır, əks halda Image komponenti xəta verir
  const mainPhoto = imgError || !rawPhoto ? PLACEHOLDER : rawPhoto;

  // Çoxdilli başlıq və kateqoriya
  const title = localizedField(listing, "title", locale);
  const categoryName = listing.categories ? localizedField(listing.categories, "name", locale) : (listing.category || "Əmlak");
  const districtName = listing.districts ? localizedField(listing.districts, "name", locale) : "";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card-surface bg-white rounded-2xl overflow-hidden group block transition hover:shadow-lg border border-navy/10 flex flex-col justify-between"
    >
      <div>
        {/* Şəkil və nişanlar */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {mainPhoto === PLACEHOLDER && !rawPhoto ? (
            <div className="w-full h-full flex items-center justify-center text-navy/25">
              <FiHome size={32} />
            </div>
          ) : (
            <Image
              src={mainPhoto}
              alt={title || "Əmlak"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition duration-300"
              onError={() => setImgError(true)}
              // Əgər next.config.js-də bu domen üçün remotePatterns tənzimlənməyibsə,
              // şəkil heç vaxt yüklənməyəcək. Aşağıdakı sətri müvəqqəti test üçün
              // aça bilərsiniz (Next.js-in optimallaşdırmasını keçərək birbaşa yükləyir):
              // unoptimized
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
            {listing.transaction_type === "sale" ? "Satış" : "Kirayə"}
          </span>
        </div>

        {/* Məlumat hissəsi */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-copper uppercase tracking-wider">
              {categoryName}
            </span>
            <span className="text-xl font-extrabold font-heading text-navy">
              {Number(listing.price)?.toLocaleString()} {listing.currency || "AZN"}
            </span>
          </div>

          <h3 className="text-base font-bold text-navy truncate group-hover:text-copper transition">
            {title}
          </h3>

          <p className="text-xs text-navy/60 flex items-center gap-1.5 truncate">
            <FiMapPin className="text-copper shrink-0" />
            <span className="truncate">{listing.address} {districtName ? `· ${districtName}` : ""}</span>
          </p>

          {/* Otaq və sahə məlumatları */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-navy/5 text-center text-xs text-navy/80">
            <div><span className="font-bold">{listing.room_count || 1}</span> otaq</div>
            <div><span className="font-bold">{listing.area_m2 || 0}</span> m²</div>
            <div><span className="font-bold">{listing.floor_number || 1}</span>/{listing.total_floors || 1} mərtəbə</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
