"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { fetchCategories, fetchDistricts, createListing, localizedField } from "@/lib/listings";
import MediaUploader from "@/components/MediaUploader";
import { FiCheckCircle, FiPlusCircle } from "react-icons/fi";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse rounded-xl bg-slate-100 flex items-center justify-center text-navy/60">Xəritə yüklənir...</div>,
});

const DOCUMENT_OPTIONS = ["Çıxarış", "Kupça", "Texniki pasport", "Notarial müqavilə", "Digər"];

const azerbaijanRegions = [
  { name: "Bakı", districts: ["Binəqədi", "Nəsimi", "Nizami", "Nərimanov", "Səbail", "Sabunçu", "Suraxanı", "Xətai", "Xəzər", "Pirallahı", "Yasamal", "Qaradağ", "Digər"] },
  { name: "Sumqayıt", districts: ["1-ci mkr", "2-ci mkr", "3-cü mkr", "4-cü mkr", "5-ci mkr", "6-cı mkr", "7-ci mkr", "8-ci mkr", "9-cu mkr", "Stansiya Sumqayıt", "Corat", "Hacı Zeynalabdin", "Novxanı bağları", "İnşaatçılar", "Digər"] },
  { name: "Abşeron", districts: ["Xırdalan", "Masazır", "Saray", "Ceyranbatan", "Güzdək", "Hökməli", "Məmmədli", "Mehdiabad", "Novxanı", "Pirəkəşkül", "Digər"] },
  { name: "Gəncə", districts: ["Kəpəz rayonu", "Nizami rayonu", "Digər"] },
  { name: "Şirvan", districts: ["Şirvan şəhər mərkəzi", "Hacıqəfil", "Digər"] },
  { name: "Lənkəran", districts: ["Lənkəran şəhər mərkəzi", "Girdəh", "Kirov", "Liman", "Digər"] },
  { name: "Mingəçevir", districts: ["Mingəçevir şəhər mərkəzi", "Ağcəbədi yolu istiqaməti", "Digər"] },
  { name: "Naftalan", districts: ["Naftalan mərkəz", "Digər"] },
  { name: "Şəki", districts: ["Şəki şəhər mərkəzi", "Oxut", "Kiçik Dəhnə", "Böyük Dəhnə", "Digər"] },
  { name: "Quba", districts: ["Quba şəhər mərkəzi", "Qırmızı qəsəbə", "Nügədi", "Aşağı Tülkədar", "Digər"] },
  { name: "Qusar", districts: ["Qusar şəhər mərkəzi", "Həzrə", "Aşağı Ləgər", "Digər"] },
  { name: "Xaçmaz", districts: ["Xaçmaz şəhər mərkəzi", "Xudat", "Nabran", "Müxbirlər", "Digər"] },
  { name: "Qəbələ", districts: ["Qəbələ şəhər mərkəzi", "Vəndam", "Bum", "Nic", "Digər"] },
  { name: "İsmayıllı", districts: ["İsmayıllı şəhər mərkəzi", "Lahıc", "İvanovka", "Qoşakənd", "Digər"] },
  { name: "Şamaxı", districts: ["Şamaxı şəhər mərkəzi", "Mədrəsə", "Çuxuryurd", "Digər"] },
  { name: "Ağdam", districts: ["Ağdam şəhər mərkəzi", "Quzanlı", "Bənövşələr", "Digər"] },
  { name: "Füzuli", districts: ["Füzuli şəhər mərkəzi", "Horadiz", "Aşağı Əbdürrəhmanlı", "Digər"] },
  { name: "Zəngilan", districts: ["Zəngilan şəhər mərkəzi", "Ağbənd", "Mincivan", "Digər"] },
  { name: "Cəbrayil", districts: ["Cəbrayil şəhər mərkəzi", "Mehdixeyli", "Digər"] },
  { name: "Qubadlı", districts: ["Qubadlı şəhər mərkəzi", "Digər"] },
  { name: "Laçın", districts: ["Laçın şəhər mərkəzi", "Güləbird", "Zabux", "Digər"] },
  { name: "Kəlbəcər", districts: ["Kəlbəcər şəhər mərkəzi", "İstisu", "Digər"] },
  { name: "Şuşa", districts: ["Şuşa şəhər mərkəzi", "Turşsu", "Digər"] },
  { name: "Xocavənd", districts: ["Xocavənd şəhər mərkəzi", "Hadrut", "Digər"] },
  { name: "Xocalı", districts: ["Xocalı şəhər mərkəzi", "Əsgəran", "Digər"] },
  { name: "Digər", districts: ["Digər bölgələr"] }
];

const emptyForm = {
  title_az: "",
  description_az: "",
  category_id: "",
  selected_city: "Bakı",
  district_name: "",
  district_id: "",
  transaction_type: "sale",
  price: "",
  currency: "AZN",
  room_count: "",
  area_m2: "",
  yard_sot: "",
  floor_number: "",
  total_floors: "",
  address: "",
  latitude: 40.4093,
  longitude: 49.8671,
  phone_number: "",
  documents: [],
};

export default function AddListingPage() {
  const { user, profile, supabase, loadingAuth, locale } = useApp();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentDistricts = azerbaijanRegions.find((c) => c.name === form.selected_city)?.districts || [];

  useEffect(() => {
    fetchCategories(supabase).then(setCategories).catch(() => {});
    fetchDistricts(supabase).then(setDbDistricts).catch(() => {});
  }, [supabase]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/login?redirect=/listings/add");
    }
  }, [loadingAuth, user, router]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDocument = (doc) => {
    setForm((f) => ({
      ...f,
      documents: f.documents.includes(doc)
        ? f.documents.filter((d) => d !== doc)
        : [...f.documents, doc],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const fieldErrors = {};
    if (!form.title_az) fieldErrors.title_az = true;
    if (!form.description_az) fieldErrors.description_az = true;
    if (!form.category_id) fieldErrors.category_id = true;
    if (!form.selected_city) fieldErrors.selected_city = true;
    if (!form.price || Number(form.price) <= 0) fieldErrors.price = true;
    if (!form.area_m2 || Number(form.area_m2) <= 0) fieldErrors.area_m2 = true;
    if (!form.address) fieldErrors.address = true;
    if (!form.phone_number) fieldErrors.phone_number = true;
    if (imageFiles.length === 0) fieldErrors.images = true;

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = `${form.selected_city}${form.district_name ? ", " + form.district_name : ""}, ${form.address}`;

      const payload = {
        owner_id: user.id,
        owner_type: profile?.role === "realtor" ? "agency" : "owner",
        title_az: form.title_az,
        title_ru: null,
        title_en: null,
        description_az: form.description_az,
        description_ru: null,
        description_en: null,
        category_id: form.category_id === "other" ? null : Number(form.category_id),
        district_id: form.district_id ? Number(form.district_id) : (dbDistricts[0]?.id || null),
        transaction_type: form.transaction_type,
        price: Number(form.price),
        currency: form.currency,
        room_count: form.room_count ? Number(form.room_count) : null,
        area_m2: Number(form.area_m2),
        yard_sot: form.yard_sot ? Number(form.yard_sot) : null,
        floor_number: form.floor_number ? Number(form.floor_number) : null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        address: fullAddress,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        documents: form.documents,
        phone_number: form.phone_number,
        status: "active",
      };

      await createListing(supabase, {
        payload,
        photoUrls: imageFiles.map((f) => f.url || f),
        videoUrls: videoFiles.map((f) => f.url || f),
      });

      setSuccess(true);
      setTimeout(() => router.push("/listings"), 1500);
    } catch (err) {
      console.error(err);
      if (err.fieldErrors) setErrors(err.fieldErrors);
      alert("Xəta baş verdi: " + (err.message || "Naməlum xəta"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth || !user) {
    return <div className="py-32 text-center text-navy/60">Yüklənir...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold font-heading text-navy">
        <FiPlusCircle className="text-copper" /> Yeni Elan Yerləşdir
      </h1>
      <p className="mb-8 text-sm text-navy/65">Zəhmət olmasa tələb olunan sahələri doldurun.</p>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 border border-emerald-200">
          <FiCheckCircle className="text-lg" /> Elan uğurla əlavə olundu! Səhifə yönləndirilir...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="card-surface p-6 sm:p-8 bg-white rounded-2xl shadow-card border border-navy/10 space-y-6">
          <h2 className="text-lg font-bold text-navy border-b pb-3">Əsas Məlumatlar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Elanın Başlığı *</label>
              <input
                value={form.title_az}
                onChange={(e) => update("title_az", e.target.value)}
                placeholder="Məs: Sumqayıtda 3 otaqlı mənzil"
                className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition ${
                  errors.title_az ? "border-red-400 bg-red-50/30" : "border-navy/15"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Ətraflı Məlumat *</label>
              <textarea
                rows={4}
                value={form.description_az}
                onChange={(e) => update("description_az", e.target.value)}
                placeholder="Əmlak haqqında ətraflı məlumat..."
                className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition resize-none ${
                  errors.description_az ? "border-red-400 bg-red-50/30" : "border-navy/15"
                }`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Kateqoriya *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => update("category_id", e.target.value)}
                  className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition ${
                    errors.category_id ? "border-red-400 bg-red-50/30" : "border-navy/15"
                  }`}
                >
                  <option value="">— Kateqoriya seçin —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{localizedField(c, "name", locale || "az")}</option>
                  ))}
                  <option value="other">Digər</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Əməliyyat Növü *</label>
                <select
                  value={form.transaction_type}
                  onChange={(e) => update("transaction_type", e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
                >
                  <option value="sale">Satış</option>
                  <option value="long_term_rent">Uzunmüddətli kirayə</option>
                  <option value="daily_rent">Günlük kirayə</option>
                  <option value="other">Digər</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="card-surface p-6 sm:p-8 bg-white rounded-2xl shadow-card border border-navy/10 space-y-4">
          <h2 className="text-lg font-bold text-navy border-b pb-3">Şəkil və Videolar</h2>
          <div className="space-y-5">
            <MediaUploader
              files={imageFiles}
              setFiles={setImageFiles}
              accept="image/*"
              type="image"
              label="Şəkil Faylları Seç (Ən azı 1 ədəd) *"
            />
            {errors.images && <p className="text-xs text-red-500 font-medium">⚠️ Zəhmət olmasa, ən azı bir şəkil əlavə edin.</p>}

            <MediaUploader
              files={videoFiles}
              setFiles={setVideoFiles}
              accept="video/*"
              type="video"
              label="Video Faylı Seç (Könüllü)"
            />
          </div>
        </section>

        <section className="card-surface p-6 sm:p-8 bg-white rounded-2xl shadow-card border border-navy/10 space-y-4">
          <h2 className="text-lg font-bold text-navy border-b pb-3">Məkan və Ünvan</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Şəhər / Rayon *</label>
                <select
                  value={form.selected_city}
                  onChange={(e) => {
                    update("selected_city", e.target.value);
                    update("district_name", "");
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
                >
                  {azerbaijanRegions.map((reg) => (
                    <option key={reg.name} value={reg.name}>{reg.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Qəsəbə / Ərazi</label>
                <select
                  value={form.district_name}
                  onChange={(e) => update("district_name", e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
                >
                  <option value="">— Qəsəbə seçin —</option>
                  {currentDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Dəqiq Ünvan / Küçə *</label>
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Məs: Sülh küçəsi, bina 42"
                className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition ${
                  errors.address ? "border-red-400 bg-red-50/30" : "border-navy/15"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Xəritədə Dəqiq Yer Seçin</label>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => {
                  if (typeof lat === "object" && lat !== null) {
                    update("latitude", lat.lat);
                    update("longitude", lat.lng);
                  } else {
                    update("latitude", lat);
                    update("longitude", lng);
                  }
                }}
              />
            </div>
          </div>
        </section>

        <section className="card-surface p-6 sm:p-8 bg-white rounded-2xl shadow-card border border-navy/10 space-y-4">
          <h2 className="text-lg font-bold text-navy border-b pb-3">Əmlakın Parametrləri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Qiymət *</label>
              <input
                type="number"
                min="0"
                max="999999999"
                placeholder="150000"
                value={form.price}
                onChange={(e) => {
                  if (e.target.value.length <= 10) update("price", e.target.value);
                }}
                className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition ${
                  errors.price ? "border-red-400 bg-red-50/30" : "border-navy/15"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Valyuta</label>
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
              >
                <option value="AZN">AZN (₼)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Sahə (m²) *</label>
              <input
                type="number"
                min="0"
                max="999999"
                placeholder="85"
                value={form.area_m2}
                onChange={(e) => {
                  if (e.target.value.length <= 7) update("area_m2", e.target.value);
                }}
                className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition ${
                  errors.area_m2 ? "border-red-400 bg-red-50/30" : "border-navy/15"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Otaq sayı</label>
              <input 
                type="number" 
                min="0" 
                max="99" 
                placeholder="3" 
                value={form.room_count} 
                onChange={(e) => {
                  if (e.target.value.length <= 2) update("room_count", e.target.value);
                }} 
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Həyət sahəsi (sot)</label>
              <input 
                type="number" 
                min="0" 
                max="9999" 
                placeholder="2" 
                value={form.yard_sot} 
                onChange={(e) => {
                  if (e.target.value.length <= 4) update("yard_sot", e.target.value);
                }} 
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Mərtəbə</label>
              <input 
                type="number" 
                min="0" 
                max="999" 
                placeholder="2" 
                value={form.floor_number} 
                onChange={(e) => {
                  if (e.target.value.length <= 3) update("floor_number", e.target.value);
                }} 
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Binanın ümumi mərtəbəsi</label>
              <input 
                type="number" 
                min="0" 
                max="999" 
                placeholder="16" 
                value={form.total_floors} 
                onChange={(e) => {
                  if (e.target.value.length <= 3) update("total_floors", e.target.value);
                }} 
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition" 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-navy mb-2">Əlaqə Nömrəsi *</label>
              <input
                type="text"
                value={form.phone_number}
                onChange={(e) => update("phone_number", e.target.value)}
                placeholder="+994 50 123 45 67"
                className={`w-full rounded-xl bg-slate-50 border px-4 py-3 text-sm outline-none text-navy focus:border-copper transition ${
                  errors.phone_number ? "border-red-400 bg-red-50/30" : "border-navy/15"
                }`}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-navy mb-2">Sənədlər</label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_OPTIONS.map((doc) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() => toggleDocument(doc)}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                    form.documents.includes(doc)
                      ? "border-copper bg-copper/10 text-copper"
                      : "border-navy/15 text-navy/60 hover:border-copper/50"
                  }`}
                >
                  {doc}
                </button>
              ))}
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-navy text-white hover:bg-copper py-4 px-4 text-base font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Yerləşdirilir..." : "Elanı Təsdiq Et və Paylaş"}
        </button>
      </form>
    </div>
  );
}