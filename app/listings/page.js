"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { fetchCategories, fetchDistricts, localizedField } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import {
  FiSearch,
  FiFilter,
  FiMapPin,
  FiRotateCcw,
  FiSliders,
  FiGrid,
  FiChevronDown,
} from "react-icons/fi";

function ListingsContent() {
  const { supabase, locale, language, dict: rawDict } = useApp();
  const dict = rawDict || {};
  const currentLocale = locale || language || "az";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filtrlər
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [txType, setTxType] = useState(searchParams.get("type") || "all");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "all");
  const [selectedDistrict, setSelectedDistrict] = useState(
    searchParams.get("district") || "all"
  );
  const [rooms, setRooms] = useState(searchParams.get("rooms") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sortBy, setSortBy] = useState("newest");

  // Kateqoriya və Rayonların yüklənməsi
  useEffect(() => {
    if (!supabase) return;
    fetchCategories(supabase)
      .then((data) => {
        if (data && data.length > 0) setCategories(data);
        else setCategories(PROPERTY_CATEGORIES);
      })
      .catch(() => setCategories(PROPERTY_CATEGORIES));

    fetchDistricts(supabase)
      .then((data) => setDistricts(data || []))
      .catch(() => {});
  }, [supabase]);

  // Elanların Supabase-dən yüklənməsi
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    const loadListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("listings")
          .select("*, listing_photos(url, media_type), categories(*), districts(*)");

        if (txType !== "all") {
          if (txType === "rent") {
            query = query.neq("transaction_type", "sale");
          } else {
            query = query.eq("transaction_type", txType);
          }
        }

        if (sortBy === "price_asc") {
          query = query.order("price", { ascending: true });
        } else if (sortBy === "price_desc") {
          query = query.order("price", { ascending: false });
        } else {
          query = query.order("is_vip", { ascending: false }).order("created_at", { ascending: false });
        }

        const { data, error } = await query;
        if (cancelled) return;
        if (error) {
          console.error("Elanlar yüklənmədi:", error.message);
        } else {
          setListings(data || []);
        }
      } catch (err) {
        console.error("Xəta baş verdi:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [supabase, txType, sortBy]);

  // Client-side axtarış və detallı filtrləmə
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // Mətn axtarışı (başlıq və ya ünvan)
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const title = (localizedField(l, "title", currentLocale) || l.title || "").toLowerCase();
        const address = (l.address || "").toLowerCase();
        const desc = (localizedField(l, "description", currentLocale) || l.description || "").toLowerCase();
        if (!title.includes(term) && !address.includes(term) && !desc.includes(term)) {
          return false;
        }
      }

      // Kateqoriya filtri
      if (selectedCategory !== "all") {
        const catMatch =
          String(l.category_id) === selectedCategory ||
          l.categories?.slug === selectedCategory ||
          String(l.property_type).toLowerCase() === selectedCategory.toLowerCase();
        if (!catMatch) return false;
      }

      // Şəhər / Rayon
      if (selectedDistrict !== "all") {
        const distMatch =
          String(l.district_id) === selectedDistrict ||
          String(l.districts?.id) === selectedDistrict ||
          String(l.district_name || "").toLowerCase().includes(selectedDistrict.toLowerCase());
        if (!distMatch) return false;
      }

      // Otaq sayı
      if (rooms !== "all") {
        const rc = Number(l.room_count || l.rooms || 0);
        if (rooms === "4+" ? rc < 4 : rc !== Number(rooms)) {
          return false;
        }
      }

      // Qiymət aralığı
      if (minPrice && Number(l.price) < Number(minPrice)) return false;
      if (maxPrice && Number(l.price) > Number(maxPrice)) return false;

      return true;
    });
  }, [listings, search, selectedCategory, selectedDistrict, rooms, minPrice, maxPrice, currentLocale]);

  const handleReset = () => {
    setSearch("");
    setTxType("all");
    setSelectedCategory("all");
    setSelectedDistrict("all");
    setRooms("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-navy dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Səhifə Başlığı və Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy/10 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-navy dark:text-white">
              Bütün Elanlar
            </h1>
            <p className="text-sm text-navy/60 dark:text-slate-400 mt-1 font-medium">
              Bakı və bölgələrdə aktual daşınmaz əmlak elanları kataloqu
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-navy/15 dark:border-slate-700 text-sm font-semibold text-navy dark:text-slate-200 shadow-sm"
            >
              <FiFilter className="text-copper" /> {showFilters ? "Filtrləri gizlə" : "Filtrlər"}
            </button>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-navy/15 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold">
              <span className="text-navy/50 dark:text-slate-400">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-none text-navy dark:text-slate-100 font-bold cursor-pointer"
              >
                <option value="newest" className="bg-white dark:bg-slate-900">Ən yeni elanlar</option>
                <option value="price_asc" className="bg-white dark:bg-slate-900">Qiymət: Ucuzdan bahaya</option>
                <option value="price_desc" className="bg-white dark:bg-slate-900">Qiymət: Bahadan ucuza</option>
              </select>
            </div>
          </div>
        </div>

        {/* Əsas Filtr Paneli */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-navy/10 dark:border-slate-800 space-y-4 ${
            showFilters ? "block" : "hidden md:block"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Axtarış sahəsi */}
            <div className="relative">
              <label className="block text-xs font-bold text-navy/70 dark:text-slate-300 mb-1.5">
                Axtarış
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700">
                <FiSearch className="text-copper shrink-0" />
                <input
                  type="text"
                  placeholder="Başlıq, ünvan və ya açar söz..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            {/* Əməliyyat növü */}
            <div>
              <label className="block text-xs font-bold text-navy/70 dark:text-slate-300 mb-1.5">
                Əməliyyat Növü
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700 text-xs text-navy dark:text-slate-100 outline-none font-semibold cursor-pointer"
              >
                <option value="all">Hamısı (Satış və Kirayə)</option>
                <option value="sale">Satış</option>
                <option value="rent">Kirayə</option>
                <option value="daily">Günlük</option>
              </select>
            </div>

            {/* Əmlak növü */}
            <div>
              <label className="block text-xs font-bold text-navy/70 dark:text-slate-300 mb-1.5">
                Əmlak Növü
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700 text-xs text-navy dark:text-slate-100 outline-none font-semibold cursor-pointer"
              >
                <option value="all">Bütün Əmlak Növləri</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {localizedField(c, "name", currentLocale) || c.name || c.name_az}
                  </option>
                ))}
              </select>
            </div>

            {/* Rayon / Bölgə */}
            <div>
              <label className="block text-xs font-bold text-navy/70 dark:text-slate-300 mb-1.5">
                Rayon / Ərazi
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700 text-xs text-navy dark:text-slate-100 outline-none font-semibold cursor-pointer"
              >
                <option value="all">Bütün Rayonlar</option>
                {districts.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {localizedField(d, "name", currentLocale) || d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-navy/5 dark:border-slate-800">
            {/* Otaq sayı */}
            <div>
              <label className="block text-xs font-bold text-navy/70 dark:text-slate-300 mb-1.5">
                Otaq Sayı
              </label>
              <div className="flex gap-1.5">
                {["all", "1", "2", "3", "4+"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRooms(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center border transition ${
                      rooms === r
                        ? "bg-navy text-white border-navy dark:bg-copper dark:border-copper"
                        : "bg-slate-50 dark:bg-slate-800 text-navy dark:text-slate-200 border-navy/10 dark:border-slate-700 hover:border-copper"
                    }`}
                  >
                    {r === "all" ? "Hər" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Qiymət aralığı */}
            <div>
              <label className="block text-xs font-bold text-navy/70 dark:text-slate-300 mb-1.5">
                Qiymət Aralığı (AZN)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700 text-xs text-navy dark:text-slate-100 outline-none"
                />
                <span className="text-navy/30 dark:text-slate-500 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-navy/15 dark:border-slate-700 text-xs text-navy dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Əməliyyat və Sıfırlama */}
            <div className="flex items-end justify-between sm:justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-navy/15 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-navy dark:text-slate-200 hover:border-copper hover:text-copper transition cursor-pointer"
              >
                <FiRotateCcw /> Sıfırla
              </button>
              <span className="text-xs font-bold text-navy/80 dark:text-slate-300">
                Tapıldı: <strong className="text-copper">{filteredListings.length}</strong> elan
              </span>
            </div>
          </div>
        </div>

        {/* Elanlar Qriqi */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-navy/60 dark:text-slate-400">
              Elanlar yüklənir...
            </p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-navy/10 dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
            <FiSearch className="text-4xl text-copper/60 mx-auto" />
            <h3 className="text-lg font-bold text-navy dark:text-white">
              Axtarışınıza uyğun elan tapılmadı
            </h3>
            <p className="text-xs text-navy/60 dark:text-slate-400">
              Filtrləri dəyişərək və ya sıfırlayaraq yenidən cəhd edə bilərsiniz.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-navy text-white hover:bg-copper text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <FiRotateCcw /> Bütün Filtrləri Sıfırla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
          <div className="w-10 h-10 border-4 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
