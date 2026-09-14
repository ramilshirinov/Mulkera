"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FiMapPin, FiHome, FiEye, FiDollarSign } from "react-icons/fi";

// Leaflet xəritəsini SSR (Server-Side Rendering) xətası verməməsi üçün dinamik import edirik
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function MapSearchPage() {
  const { supabase } = useApp();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");

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

  // Əmlak növünə görə filterləmə
  const filteredListings = listings.filter((item) => {
    if (selectedType === "all") return true;
    return item.property_type === selectedType;
  });

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
      </div>

      {/* Xəritə Konteyneri */}
      <div className="flex-1 w-full relative z-0">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />

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
          </MapContainer>
        )}
      </div>
    </div>
  );
}