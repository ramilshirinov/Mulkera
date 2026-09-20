"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { localizedField } from "@/lib/listings";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  FiFilter, 
  FiX, 
  FiMapPin, 
  FiHome, 
  FiEye, 
  FiDollarSign, 
  FiCrosshair, 
  FiList 
} from "react-icons/fi";

// Leaflet xəritəsini SSR xətası verməməsi üçün dinamik import edirik
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });
const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster"), { ssr: false });

const BAKU_CENTER = [40.4093, 49.8671];
const DAILY_VALUES = ["daily", "daily_rent", "short_term_rent"];
const PLACEHOLDER = "/images/placeholder-property.svg";

const TX_FILTERS = [
  { id: "all", label: "Hamısı", match: () => true },
  { id: "sale", label: "Satlıq", match: (t) => t === "sale" },
  {
    id: "rent",
    label: "Kirayə",
    match: (t) => !!t && t !== "sale" && !DAILY_VALUES.includes(t),
  },
  { id: "daily", label: "Günlük", match: (t) => DAILY_VALUES.includes(t) },
];

const CURRENCY_SYMBOL = { AZN: "₼", USD: "$", EUR: "€" };

function toCoord(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function shortPrice(value, currency) {
  const n = Number(value);
  const symbol = CURRENCY_SYMBOL[currency || "AZN"] || currency || "₼";
  if (!Number.isFinite(n) || n <= 0) return `— ${symbol}`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M ${symbol}`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K ${symbol}`;
  return `${n} ${symbol}`;
}

function markerColor(listing) {
  if (listing.is_vip) return "bg-amber-500";
  if (listing.transaction_type === "sale") return "bg-navy";
  return "bg-copper";
}

// İki koordinat arasındakı məsafəni km ilə hesablayan funksiya (Haversine formulu)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Xəritə üzərində "flyTo" əməliyyatını idarə edən komponent
function MapFlyController({ target }) {
  const [MapHook, setMapHook] = useState(null);

  useEffect(() => {
    import("react-leaflet").then((mod) => setMapHook(() => mod.useMap));
  }, []);

  if (!MapHook) return null;
  return <FlyToHandler useMap={MapHook} target={target} />;
}

function FlyToHandler({ useMap, target }) {
  const map = useMap();

  useEffect(() => {
    if (target && map) {
      map.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
    }
  }, [target, map]);

  return null;
}

export default function MapPage() {
  const { supabase, locale, language } = useApp();
  const currentLocale = locale || language || "az";
  const router = useRouter();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leafletModules, setLeafletModules] = useState(null);

  // Filtrlər
  const [txFilter, setTxFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Panel və Interaksiya
  const [panelOpen, setPanelOpen] = useState(true);
  const [showListPanel, setShowListPanel] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);

  // Ətrafımı tap
  const [userPosition, setUserPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Leaflet modulunu və ikonları yükləyirik
  useEffect(() => {
    import("leaflet").then((L) => {
      setLeafletModules(L);
    });
  }, []);

  // Elanların yüklənməsi
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("listings")
        .select("*, listing_photos(url, media_type), categories(*), districts(*)");

      if (cancelled) return;
      if (err) {
        console.error("Xəritə elanları yüklənmədi:", err.message);
        setError("Elanları yükləmək mümkün olmadı.");
      } else {
        setError("");
      }
      setListings(data || []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Koordinatı olan elanların emalı
  const mapped = useMemo(
    () =>
      listings
        .map((l) => ({
          ...l,
          _lat: toCoord(l.latitude ?? l.lat),
          _lng: toCoord(l.longitude ?? l.lng ?? l.lon),
        }))
        .filter((l) => l._lat !== null && l._lng !== null),
    [listings]
  );

  // Kateqoriya çipləri
  const categoryChips = useMemo(() => {
    const seen = new Map();
    mapped.forEach((l) => {
      if (l.category_id && l.categories && !seen.has(l.category_id)) {
        seen.set(l.category_id, localizedField(l.categories, "name", currentLocale));
      }
    });
    return Array.from(seen, ([id, name]) => ({ id: String(id), name }));
  }, [mapped, currentLocale]);

  // Filtrləmə məntiqi
  let filtered = useMemo(() => {
    const tx = TX_FILTERS.find((f) => f.id === txFilter) || TX_FILTERS[0];
    return mapped.filter((l) => {
      if (!tx.match(l.transaction_type)) return false;
      if (categoryFilter !== "all" && String(l.category_id) !== categoryFilter) return false;
      if (minPrice && Number(l.price) < Number(minPrice)) return false;
      if (maxPrice && Number(l.price) > Number(maxPrice)) return false;
      return true;
    });
  }, [mapped, txFilter, categoryFilter, minPrice, maxPrice]);

  // Məsafəyə görə hesablama və sıralama
  if (userPosition) {
    filtered = filtered.map((item) => ({
      ...item,
      _distanceKm: getDistanceKm(userPosition.lat, userPosition.lng, item._lat, item._lng),
    }));

    if (sortByDistance) {
      filtered = [...filtered].sort((a, b) => (a._distanceKm || 0) - (b._distanceKm || 0));
    }
  }

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzeriniz mövqe müəyyənləşdirməni dəstəkləmir.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPosition(coords);
        setFlyTarget(coords);
        setSortByDistance(true);
        setLocating(false);
      },
      () => {
        alert("Mövqeyinizi müəyyənləşdirmək mümkün olmadı. Brauzer icazələrini yoxlayın.");
        setLocating(false);
      }
    );
  };

  const chipBase = "px-3.5 py-1.5 rounded-full text-xs font-semibold transition border";
  const chipOn = "bg-navy text-white border-navy dark:bg-copper dark:border-copper";
  const chipOff =
    "bg-white dark:bg-slate-800 text-navy dark:text-slate-200 border-navy/15 dark:border-slate-600 hover:border-copper hover:text-copper";

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full relative isolate">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Üst Filter / İdarəetmə Paneli */}
      <div className="bg-white dark:bg-slate-900 border-b border-navy/10 dark:border-slate-800 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4 z-[1001] shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold font-heading text-navy dark:text-slate-100 flex items-center gap-2">
            <FiMapPin className="text-copper" /> Xəritə Üzrə Axtarış
          </h1>
          <button
            type="button"
            onClick={() => setPanelOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-navy dark:text-slate-200 hover:bg-slate-200 transition"
          >
            <FiFilter className="text-copper" /> {panelOpen ? "Filtrləri Gizlə" : "Filtrləri Göstər"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Qiymət aralığı */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <FiDollarSign className="text-navy/40 dark:text-slate-400 text-sm shrink-0" />
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-16 bg-transparent text-xs outline-none text-navy dark:text-slate-200"
            />
            <span className="text-navy/30 dark:text-slate-500 text-xs">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-16 bg-transparent text-xs outline-none text-navy dark:text-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={handleFindMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-navy dark:text-slate-200 hover:bg-slate-200 transition shrink-0 cursor-pointer"
          >
            <FiCrosshair /> {locating ? "Axtarılır..." : "Ətrafımı Tap"}
          </button>

          <button
            type="button"
            onClick={() => setShowListPanel((prev) => !prev)}
            className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
              showListPanel ? "bg-navy text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-navy dark:text-slate-200 hover:bg-slate-200"
            }`}
          >
            <FiList /> Siyahı
          </button>
        </div>
      </div>

      {/* Əsas Sahə: Siyahı Paneli + Xəritə */}
      <div className="flex-1 w-full relative z-0 flex overflow-hidden">
        
        {/* Sol Tərəfdən Açılan Sürətli Filtr Paneli */}
        {panelOpen && (
          <div className="absolute left-3 top-3 z-[1000] w-[340px] max-w-[calc(100%-1.5rem)] space-y-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur border border-navy/10 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-navy dark:text-slate-100">
                <FiFilter className="text-copper" /> Sürətli filtr
              </span>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Bağla"
                className="rounded-full p-1 text-navy/60 dark:text-slate-400 hover:text-copper cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            {/* Əməliyyat növü çipləri */}
            <div className="flex flex-wrap gap-2">
              {TX_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTxFilter(f.id)}
                  className={`${chipBase} ${txFilter === f.id ? chipOn : chipOff} cursor-pointer`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Kateqoriya çipləri */}
            {categoryChips.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-navy/10 dark:border-slate-700 pt-3">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`${chipBase} ${categoryFilter === "all" ? chipOn : chipOff} cursor-pointer`}
                >
                  Bütün növlər
                </button>
                {categoryChips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryFilter(c.id)}
                    className={`${chipBase} ${categoryFilter === c.id ? chipOn : chipOff} cursor-pointer`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs font-medium text-navy/60 dark:text-slate-400 pt-1">
              {loading
                ? "Yüklənir..."
                : error
                ? error
                : `Xəritədə ${filtered.length} elan göstərilir`}
            </p>
          </div>
        )}

        {/* Split View Siyahısı (Sol Tərəf) */}
        {showListPanel && (
          <div className="hidden md:flex flex-col w-80 shrink-0 border-r border-navy/10 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto z-10">
            {sortByDistance && (
              <div className="px-4 py-2 text-[11px] text-copper font-semibold bg-copper/5 border-b border-navy/10 dark:border-slate-800">
                Məsafəyə görə sıralanıb
              </div>
            )}
            {loading ? (
              <p className="text-sm text-navy/60 p-4 text-center">Yüklənir...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-navy/60 p-4 text-center">Filtrə uyğun elan tapılmadı.</p>
            ) : (
              filtered.map((item) => {
                const photo =
                  item.listing_photos?.find((p) => p?.url && p.media_type !== "video")?.url ||
                  item.image_url ||
                  PLACEHOLDER;

                return (
                  <button
                    key={item.id}
                    onClick={() => setFlyTarget({ lat: item._lat, lng: item._lng })}
                    className="flex items-center gap-3 p-3 border-b border-navy/5 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left w-full cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-navy dark:text-slate-200 truncate">
                        {localizedField(item, "title", currentLocale) || item.title}
                      </p>
                      <p className="text-[11px] text-navy/60 dark:text-slate-400 mt-0.5 font-bold">
                        {Number(item.price || 0).toLocaleString()} {item.currency || "AZN"}
                      </p>
                      {item._distanceKm !== undefined && (
                        <p className="text-[10px] text-copper font-medium mt-0.5">
                          {item._distanceKm.toFixed(1)} km məsafədə
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Xəritə Konteyneri */}
        <div className="flex-1 relative z-0">
          {loading || !leafletModules ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-navy dark:text-slate-200 font-medium z-20">
              Xəritə və elanlar yüklənir...
            </div>
          ) : (
            <MapContainer
              center={BAKU_CENTER}
              zoom={11}
              scrollWheelZoom={true}
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyController target={flyTarget} />

              {userPosition && (
                <>
                  <Marker position={[userPosition.lat, userPosition.lng]}>
                    <Popup>Sizin mövqeyiniz</Popup>
                  </Marker>
                  <Circle
                    center={[userPosition.lat, userPosition.lng]}
                    radius={300}
                    pathOptions={{ color: "#B87333", fillOpacity: 0.1 }}
                  />
                </>
              )}

              <MarkerClusterGroup chunkedLoading>
                {filtered.map((item) => {
                  const photo =
                    item.listing_photos?.find((p) => p?.url && p.media_type !== "video")?.url ||
                    item.image_url ||
                    PLACEHOLDER;

                  // 1-ci kodun xüsusi qiymət etiketi (divIcon) dizaynı
                  const customDivIcon = leafletModules.divIcon({
                    className: "mulkera-marker",
                    html: `<div class="flex h-7 w-full items-center justify-center rounded-full border-2 border-white ${markerColor(
                      item
                    )} text-xs font-extrabold text-white shadow-lg px-2">${shortPrice(
                      item.price,
                      item.currency
                    )}</div>`,
                    iconSize: [82, 28],
                    iconAnchor: [41, 14],
                    popupAnchor: [0, -14],
                  });

                  return (
                    <Marker 
                      key={item.id} 
                      position={[item._lat, item._lng]} 
                      icon={customDivIcon}
                    >
                      <Popup>
                        <div className="w-52 p-1">
                          <div className="h-28 w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="font-extrabold text-sm text-navy mb-0.5">
                            {Number(item.price || 0).toLocaleString()} {item.currency || "AZN"}
                          </div>
                          <div className="font-semibold text-xs text-navy mb-1 line-clamp-1">
                            {localizedField(item, "title", currentLocale) || item.title}
                          </div>
                          <div className="text-[11px] text-navy/70 mb-2">
                            {item.room_count || 1} otaq · {item.area_m2 || 0} m²
                          </div>
                          {item._distanceKm !== undefined && (
                            <p className="text-[10px] text-copper font-medium mb-2">
                              {item._distanceKm.toFixed(1)} km məsafədə
                            </p>
                          )}
                          <Link
                            href={`/listings/${item.id}`}
                            className="w-full flex items-center justify-center gap-1.5 bg-navy text-white hover:bg-copper py-1.5 rounded-lg text-xs font-semibold transition text-center"
                          >
                            <FiEye /> Ətraflı bax
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}