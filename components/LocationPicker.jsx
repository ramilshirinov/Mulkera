"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { FiCheckCircle, FiMapPin, FiRotateCcw } from "react-icons/fi";

const BAKU_CENTER = [40.4093, 49.8671];

function normalize(v) {
  if (!v) return null;
  const lat = Number(v.lat ?? v.latitude);
  const lng = Number(v.lng ?? v.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function pinHtml(confirmed) {
  const color = confirmed ? "#16a34a" : "#f59e0b";
  return `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);transform:rotate(-45deg);"></div>`;
}

/**
 * value    → təsdiqlənmiş koordinat ({ lat, lng } və ya null)
 * onChange → YALNIZ "təsdiq et" düyməsi basılanda çağırılır ({ lat, lng }), sıfırlananda null
 */
export default function LocationPicker({ value = null, onChange, height = 380 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [pending, setPending] = useState(() => normalize(value));

  const confirmed = normalize(value);
  const isConfirmed =
    !!confirmed &&
    !!pending &&
    confirmed.lat === pending.lat &&
    confirmed.lng === pending.lng;
  const isDirty = !!pending && !isConfirmed;

  // Xarici dəyər dəyişəndə (redaktə rejimi) seçimi sinxronlaşdırırıq
  const valueLat = confirmed?.lat;
  const valueLng = confirmed?.lng;
  useEffect(() => {
    if (valueLat === undefined || valueLng === undefined) return;
    setPending({ lat: valueLat, lng: valueLng });
    if (mapRef.current) mapRef.current.setView([valueLat, valueLng], 15);
  }, [valueLat, valueLng, mapReady]);

  // Xəritəni bir dəfə qururuq
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await import("leaflet");
      const L = mod.default || mod;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = normalize(value);
      const map = L.map(containerRef.current).setView(
        start ? [start.lat, start.lng] : BAKU_CENTER,
        start ? 15 : 11
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Klik → gözləyən seçim (hələ təsdiqlənmir)
      map.on("click", (e) => {
        setPending({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker: gözləyən (sarı) / təsdiqlənmiş (yaşıl)
  useEffect(() => {
    if (!mapReady) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!pending) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const icon = L.divIcon({
      className: "mulkera-marker",
      html: pinHtml(isConfirmed),
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });

    if (!markerRef.current) {
      const marker = L.marker([pending.lat, pending.lng], { icon, draggable: true });
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setPending({ lat: p.lat, lng: p.lng });
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([pending.lat, pending.lng]);
      markerRef.current.setIcon(icon);
    }
  }, [mapReady, pending, isConfirmed]);

  const handleConfirm = () => {
    if (!pending) return;
    onChange?.({ lat: pending.lat, lng: pending.lng });
  };

  const handleReset = () => {
    setPending(null);
    onChange?.(null);
  };

  return (
    <div className="space-y-3">
      {/* Vəziyyət paneli */}
      {!pending && (
        <div className="flex items-center gap-2 rounded-xl border border-navy/10 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-navy/70 dark:text-slate-300">
          <FiMapPin className="text-copper" />
          Əmlakın yerini seçmək üçün xəritədə klikləyin.
        </div>
      )}
      {isDirty && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <FiMapPin />
          Yer seçildi, lakin hələ təsdiqlənməyib. Aşağıdakı düyməyə basın.
        </div>
      )}
      {isConfirmed && (
        <div className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-800 px-4 py-3 text-sm font-semibold text-green-800 dark:text-green-300">
          <FiCheckCircle />
          Yer təsdiqləndi ({confirmed.lat.toFixed(5)}, {confirmed.lng.toFixed(5)})
        </div>
      )}

      {/* Xəritə */}
      <div
        className="relative isolate w-full overflow-hidden rounded-xl border border-navy/10 dark:border-slate-700"
        style={{ height }}
      >
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Düymələr */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!pending || isConfirmed}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-copper disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiCheckCircle />
          {isConfirmed ? "Yer təsdiqlənib" : "Bu yeri təsdiq et / Seçimi yadda saxla"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!pending && !confirmed}
          className="flex items-center justify-center gap-2 rounded-xl border border-navy/15 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-navy dark:text-slate-100 transition hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRotateCcw /> Sıfırla
        </button>
      </div>
    </div>
  );
}