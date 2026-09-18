"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FiMapPin, FiHome, FiEye, FiDollarSign, FiCrosshair, FiList } from "react-icons/fi";

// Leaflet xəritəsini SSR (Server-Side Rendering) xətası verməməsi üçün dinamik import edirik
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });
// NOT: bu paket layihəyə əlavə edilməlidir -> npm install react-leaflet-cluster
const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster"), { ssr: false });

// Xəritə üzərində "flyTo" əməliyyatını idarə edən köməkçi komponent.
// react-leaflet-in useMap hook-u yalnız MapContainer-in içində işlədiyi üçün
// ayrıca komponent kimi çıxarılıb.
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

export default function MapSearchPage() {
  const { supabase } = useApp();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");

  // Qiymət aralığı filtri
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Split view: siyahı + xəritə
  const [showListPanel, setShowListPanel] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);

  // Ətrafımı tap
  const [userPosition, setUserPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Leaflet ikon problemini aradan qaldırmaq üçün default ikon tənzimləməsi
  useEffect(() => {
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (!error && data) {
        setListings(data);
      }
      setLoading(false);
    }

    fetchListings();
  }, [supabase]);

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

  // Əmlak növünə və qiymətə görə filterləmə
  let filteredListings = listings.filter((item) => {
    if (selectedType !== "all" && item.property_type !== selectedType) return false;
    if (minPrice && item.price < Number(minPrice)) return false;
    if (maxPrice && item.price > Number(maxPrice)) return false;
    return true;
  });

  // Mövqeyə görə məsafə hesabla və lazım olduqda sırala
  if (userPosition) {
    filteredListings = filteredListings.map((item) => ({
      ...item,
      _distanceKm: getDistanceKm(userPosition.lat, userPosition.lng, item.latitude, item.longitude),
    }));

    if (sortByDistance) {
      filteredListings = [...filteredListings].sort((a, b) => a._distanceKm - b._distanceKm);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Üst Filter Paneli */}
      <div className="bg-white border-b border-navy/10 px-4 py-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 z-10 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-navy flex items-center gap-2">
            <FiMapPin className="text-copper" /> Xəritə Üzrə Axtarış
          </h1>
          <p className="text-xs text-navy/60">Əmlakları birbaşa xəritə üzərindən kəşf edin</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedType === "all" ? "bg-navy text-white shadow-sm" : "bg-slate-100 text-navy hover:bg-slate-200"
              }`}
            >
              Bütün Elanlar
            </button>
            <button
              onClick={() => setSelectedType("apartment")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedType === "apartment" ? "bg-navy text-white shadow-sm" : "bg-slate-100 text-navy hover:bg-slate-200"
              }`}
            >
              Mənzillər
            </button>
            <button
              onClick={() => setSelectedType("villa")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedType === "villa" ? "bg-navy text-white shadow-sm" : "bg-slate-100 text-navy hover:bg-slate-200"
              }`}
            >
              Villalar
            </button>
            <button
              onClick={() => setSelectedType("commercial")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedType === "commercial" ? "bg-navy text-white shadow-sm" : "bg-slate-100 text-navy hover:bg-slate-200"
              }`}
            >
              Obyektlər
            </button>
          </div>

          {/* Qiymət Aralığı Filtri */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-navy/15 rounded-xl px-2 py-1.5">
            <FiDollarSign className="text-navy/40 text-sm shrink-0" />
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-16 bg-transparent text-xs outline-none text-navy"
            />
            <span className="text-navy/30 text-xs">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-16 bg-transparent text-xs outline-none text-navy"
            />
          </div>

          <button
            onClick={handleFindMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-navy hover:bg-slate-200 transition shrink-0"
          >
            <FiCrosshair /> {locating ? "Axtarılır..." : "Ətrafımı Tap"}
          </button>

          <button
            onClick={() => setShowListPanel((prev) => !prev)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              showListPanel ? "bg-navy text-white shadow-sm" : "bg-slate-100 text-navy hover:bg-slate-200"
            }`}
          >
            <FiList /> Siyahı
          </button>
        </div>
      </div>

      {/* Əsas Sahə: Siyahı (opsional) + Xəritə */}
      <div className="flex-1 w-full relative z-0 flex overflow-hidden">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />

        {/* Split View Siyahısı */}
        {showListPanel && (
          <div className="hidden md:flex flex-col w-80 shrink-0 border-r border-navy/10 bg-white overflow-y-auto">
            {sortByDistance && (
              <div className="px-4 py-2 text-[11px] text-copper font-semibold bg-copper/5 border-b border-navy/10">
                Məsafəyə görə sıralanıb
              </div>
            )}
            {loading ? (
              <p className="text-sm text-navy/60 p-4 text-center">Yüklənir...</p>
            ) : filteredListings.length === 0 ? (
              <p className="text-sm text-navy/60 p-4 text-center">Filtrə uyğun elan tapılmadı.</p>
            ) : (
              filteredListings.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFlyTarget({ lat: item.latitude, lng: item.longitude })}
                  className="flex items-center gap-3 p-3 border-b border-navy/5 hover:bg-slate-50 transition text-left"
                >
                  <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-navy/30">
                        <FiHome />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{item.title}</p>
                    <p className="text-[11px] text-navy/60 mt-0.5">
                      {item.price?.toLocaleString()} {item.currency || "AZN"}
                    </p>
                    {item._distanceKm !== undefined && (
                      <p className="text-[10px] text-copper font-medium mt-0.5">
                        {item._distanceKm.toFixed(1)} km məsafədə
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Xəritə Konteyneri */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-navy font-medium z-20">
              Xəritə və elanlar yüklənir...
            </div>
          ) : (
            <MapContainer
              center={[40.4093, 49.8671]} // Bakı / Sumqayıt mərkəzli koordinat
              zoom={10}
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
                {filteredListings.map((listing) => (
                  <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
                    <Popup>
                      <div className="w-56 p-1">
                        {listing.image_url && (
                          <div className="h-32 w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-[10px] font-semibold bg-copper/10 text-copper px-2 py-0.5 rounded uppercase">
                          {listing.property_type || "Əmlak"}
                        </span>
                        <h4 className="font-bold text-sm text-navy mt-1 line-clamp-1">{listing.title}</h4>
                        <p className="text-xs font-extrabold text-navy mt-1">
                          {listing.price?.toLocaleString()} {listing.currency || "AZN"}
                        </p>
                        {listing._distanceKm !== undefined && (
                          <p className="text-[11px] text-copper font-medium mt-1">
                            {listing._distanceKm.toFixed(1)} km məsafədə
                          </p>
                        )}
                        <Link
                          href={`/listings/${listing.id}`}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-navy text-white hover:bg-copper py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          <FiEye /> Ətraflı Bax
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}