"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { FiSearch, FiMapPin, FiHome, FiPlus, FiEye, FiRotateCcw } from "react-icons/fi";
import { fetchCategories, fetchDistricts, fetchListings, localizedField } from "@/lib/listings";

const TRANSACTION_LABELS = {
  sale: "Satış",
  long_term_rent: "Kirayə",
  daily_rent: "Günlük kirayə",
};

const PAGE_SIZE = 24;

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-navy/40">Yüklənir...</div>}>
      <ListingsPageContent />
    </Suspense>
  );
}

function ListingsPageContent() {
  const { supabase, locale } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("keyword") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [transactionType, setTransactionType] = useState(searchParams.get("transaction") || "all");
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "all");
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get("district") || "all");
  const [priceMin, setPriceMin] = useState(searchParams.get("minPrice") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("maxPrice") || "");
  const [roomsFilter, setRoomsFilter] = useState(searchParams.get("rooms") || "all");

  const azerbaijanRegions = [
    { name: "Bakı", districts: ["Binəqədi", "Nəsimi", "Nizami", "Nərimanov", "Səbail", "Sabunçu", "Suraxanı", "Xətai", "Xəzər", "Pirallahı", "Yasamal", "Qaradağ"] },
    { name: "Sumqayıt", districts: ["1-ci mkr", "2-ci mkr", "3-cü mkr", "4-cü mkr", "5-ci mkr", "6-cı mkr", "7-ci mkr", "8-ci mkr", "9-cu mkr", "Stansiya Sumqayıt", "Corat", "Hacı Zeynalabdin", "Novxanı bağları", "İnşaatçılar"] },
    { name: "Abşeron", districts: ["Xırdalan", "Masazır", "Saray", "Ceyranbatan", "Güzdək", "Hökməli", "Məmmədli", "Mehdiabad", "Novxanı", "Pirəkəşkül"] },
    { name: "Gəncə", districts: ["Kəpəz rayonu", "Nizami rayonu"] },
    { name: "Şirvan", districts: ["Şirvan şəhər mərkəzi", "Hacıqəfil"] },
    { name: "Lənkəran", districts: ["Lənkəran şəhər mərkəzi", "Girdəh", "Kirov", "Liman"] },
    { name: "Mingəçevir", districts: ["Mingəçevir şəhər mərkəzi", "Ağcəbədi yolu istiqaməti"] },
    { name: "Şəki", districts: ["Şəki şəhər mərkəzi", "Oxut", "Kiçik Dəhnə", "Böyük Dəhnə"] },
    { name: "Quba", districts: ["Quba şəhər mərkəzi", "Qırmızı qəsəbə", "Nügədi", "Aşağı Tülkədar"] },
    { name: "Qusar", districts: ["Qusar şəhər mərkəzi", "Həzrə", "Aşağı Ləgər"] },
    { name: "Xaçmaz", districts: ["Xaçmaz şəhər mərkəzi", "Xudat", "Nabran", "Müxbirlər"] },
    { name: "Qəbələ", districts: ["Qəbələ şəhər mərkəzi", "Vəndam", "Bum", "Nic"] },
    { name: "İsmayıllı", districts: ["İsmayıllı şəhər mərkəzi", "Lahıc", "İvanovka", "Qoşakənd"] },
    { name: "Şamaxı", districts: ["Şamaxı şəhər mərkəzi", "Mədrəsə", "Çuxuryurd"] },
    { name: "Ağdam", districts: ["Ağdam şəhər mərkəzi", "Quzanlı", "Bənövşələr"] },
    { name: "Füzuli", districts: ["Füzuli şəhər mərkəzi", "Horadiz", "Aşağı Əbdürrəhmanlı"] },
    { name: "Zəngilan", districts: ["Zəngilan şəhər mərkəzi", "Ağbənd", "Mincivan"] },
    { name: "Cəbrayil", districts: ["Cəbrayil şəhər mərkəzi", "Mehdixeyli"] },
    { name: "Qubadlı", districts: ["Qubadlı şəhər mərkəzi"] },
    { name: "Laçın", districts: ["Laçın şəhər mərkəzi", "Güləbird", "Zabux"] },
    { name: "Kəlbəcər", districts: ["Kəlbəcər şəhər mərkəzi", "İstisu"] },
    { name: "Şuşa", districts: ["Şuşa şəhər mərkəzi", "Turşsu"] },
    { name: "Xocavənd", districts: ["Xocavənd şəhər mərkəzi", "Hadrut"] },
    { name: "Xocalı", districts: ["Xocalı şəhər mərkəzi", "Əsgəran"] }
  ];

  const currentDistricts = azerbaijanRegions.find((c) => c.name === cityFilter)?.districts || [];

  useEffect(() => {
    async function loadFilters() {
      try {
        const [catsData, distsData] = await Promise.all([
          fetchCategories(supabase),
          fetchDistricts(supabase),
        ]);
        setCategories(catsData || []);
        setDistricts(distsData || []);
      } catch (err) {
        console.error("Filterləri yükləyərkən xəta:", err);
      }
    }
    loadFilters();
  }, [supabase]);

  const loadListingsData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
        transactionType: transactionType !== "all" ? transactionType : undefined,
        districtId: selectedDistrict !== "all" && !isNaN(selectedDistrict) ? Number(selectedDistrict) : undefined,
        keyword: searchQuery || undefined,
        page: page,
        pageSize: PAGE_SIZE,
      };

      const { data, count: totalCount } = await fetchListings(supabase, filters);
      setListings(Array.isArray(data) ? data : []);
      setCount(totalCount || (data ? data.length : 0));
    } catch (err) {
      console.error("Elanları yükləyərkən xəta:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCategory, transactionType, selectedDistrict, searchQuery, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadListingsData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadListingsData]);

  const filteredListings = listings.filter((item) => {
    const price = item.price || 0;
    const matchesMinPrice = priceMin === "" || price >= Number(priceMin);
    const matchesMaxPrice = priceMax === "" || price <= Number(priceMax);

    const roomsCount = item.rooms || item.room_count || 0;
    const matchesRooms =
      roomsFilter === "all" ||
      (roomsFilter === "5+" ? roomsCount >= 5 : roomsCount === Number(roomsFilter));

    const matchesCity =
      cityFilter === "all" ||
      item.address?.toLowerCase().includes(cityFilter.toLowerCase()) ||
      item.city?.toLowerCase().includes(cityFilter.toLowerCase());

    const matchesDistrictName =
      selectedDistrict === "all" ||
      item.address?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
      (item.districts && localizedField(item.districts, "name", locale).toLowerCase().includes(selectedDistrict.toLowerCase()));

    return matchesMinPrice && matchesMaxPrice && matchesRooms && matchesCity && matchesDistrictName;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setTransactionType("all");
    setCityFilter("all");
    setSelectedDistrict("all");
    setPriceMin("");
    setPriceMax("");
    setRoomsFilter("all");
    setPage(1);
    router.push("/listings");
  };

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-navy">Daşınmaz Əmlak Elanları</h1>
          <p className="mt-1 text-sm text-navy/70">Azərbaycanın bütün bölgələrində arzuladığınız əmlakı tapın.</p>
        </div>
        <Link
          href="/listings/add"
          className="flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-copper"
        >
          <FiPlus /> Yeni Elan Yerləşdir
        </Link>
      </div>

      {/* Filter Paneli */}
      <div className="card-surface mb-8 space-y-4 rounded-2xl border border-navy/10 bg-white p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative flex items-center">
            <FiSearch className="absolute left-4 text-navy/40" />
            <input
              type="text"
              placeholder="Elan başlığı, ünvan və ya açar söz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-navy/15 bg-slate-50 py-3 pl-11 pr-4 text-sm text-navy outline-none transition focus:border-copper"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-navy/15 bg-slate-50 px-4 py-3 text-sm text-navy outline-none transition focus:border-copper"
          >
            <option value="all">Bütün Əmlak Növləri</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {localizedField(cat, "name", locale)}
              </option>
            ))}
          </select>

          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="w-full rounded-xl border border-navy/15 bg-slate-50 px-4 py-3 text-sm text-navy outline-none transition focus:border-copper"
          >
            <option value="all">Bütün Əməliyyatlar</option>
            <option value="sale">Satış</option>
            <option value="long_term_rent">Uzunmüddətli kirayə</option>
            <option value="daily_rent">Günlük kirayə</option>
          </select>
        </div>

        {/* Şəhər və Rayon / Qəsəbə Seçimi */}
        <div className="grid grid-cols-1 gap-4 border-t border-navy/10 pt-4 md:grid-cols-2">
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setSelectedDistrict("all");
            }}
            className="w-full rounded-xl border border-navy/15 bg-slate-50 px-4 py-3 text-sm text-navy outline-none transition focus:border-copper"
          >
            <option value="all">Bütün Şəhər və Rayonlar (Ümumi)</option>
            {azerbaijanRegions.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={cityFilter === "all"}
            className="w-full rounded-xl border border-navy/15 bg-slate-50 px-4 py-3 text-sm text-navy outline-none transition focus:border-copper disabled:opacity-50"
          >
            <option value="all">Bütün Qəsəbələr / Ərazilər</option>
            {currentDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Qiymət və Otaq Sayı */}
        <div className="grid grid-cols-1 items-center gap-4 border-t border-navy/10 pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min. AZN"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full rounded-xl border border-navy/15 bg-slate-50 px-3 py-2.5 text-sm text-navy outline-none transition focus:border-copper"
            />
            <span className="text-navy/40">-</span>
            <input
              type="number"
              placeholder="Maks. AZN"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full rounded-xl border border-navy/15 bg-slate-50 px-3 py-2.5 text-sm text-navy outline-none transition focus:border-copper"
            />
          </div>

          <select
            value={roomsFilter}
            onChange={(e) => setRoomsFilter(e.target.value)}
            className="w-full rounded-xl border border-navy/15 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-copper"
          >
            <option value="all">Otaq sayı (Fərq etməz)</option>
            <option value="1">1 otaqlı</option>
            <option value="2">2 otaqlı</option>
            <option value="3">3 otaqlı</option>
            <option value="4">4 otaqlı</option>
            <option value="5">5+ otaqlı</option>
          </select>

          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
            >
              <FiRotateCcw /> Filterləri Təmizlə
            </button>
          </div>
        </div>
      </div>

      {/* Siyahı */}
      {loading ? (
        <div className="py-24 text-center text-navy/40">Elanlar yüklənir...</div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-navy/10 bg-white py-20 text-center shadow-card">
          <p className="mb-2 text-base text-navy/70">Axtarış meyarlarınıza uyğun heç bir elan tapılmadı.</p>
          <button onClick={resetFilters} className="cursor-pointer text-sm font-semibold text-copper underline">
            Filter parametrlərini sıfırlayın
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => {
            const sortedPhotos = (listing.listing_photos || [])
              .filter((p) => p.media_type === "image")
              .sort((a, b) => a.sort_order - b.sort_order);
            const mainPhoto = sortedPhotos[0]?.url || listing.image_url;
            const title = localizedField(listing, "title", locale);
            const districtName = listing.districts ? localizedField(listing.districts, "name", locale) : "";
            const categoryName = listing.categories ? localizedField(listing.categories, "name", locale) : "Əmlak";

            return (
              <div key={listing.id} className="card-surface flex flex-col justify-between overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card transition hover:shadow-lg">
                <div>
                  <Link href={`/listings/${listing.id}`} className="relative block h-48 overflow-hidden bg-slate-100">
                    {mainPhoto ? (
                      <img src={mainPhoto} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-navy/40">
                        <FiHome className="text-4xl" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-navy/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {TRANSACTION_LABELS[listing.transaction_type] || listing.transaction_type}
                    </span>
                  </Link>

                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-copper">{categoryName}</span>
                      <span className="font-heading text-xl font-extrabold text-navy">
                        {Number(listing.price || 0).toLocaleString()} {listing.currency || "AZN"}
                      </span>
                    </div>

                    <Link href={`/listings/${listing.id}`}>
                      <h3 className="line-clamp-1 text-base font-bold text-navy hover:text-copper">{title}</h3>
                    </Link>

                    <p className="flex items-center gap-1.5 text-xs text-navy/60">
                      <FiMapPin className="shrink-0 text-copper" />
                      <span className="truncate">{listing.address} {districtName ? `· ${districtName}` : ""}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 border-b border-t border-navy/5 py-2 text-center text-xs text-navy/80">
                      <div><span className="font-bold">{listing.room_count || listing.rooms || "-"}</span> otaq</div>
                      <div><span className="font-bold">{listing.area_m2 || 0}</span> m²</div>
                      <div><span className="font-bold">{listing.floor_number || "-"}</span>/{listing.total_floors || "-"} mərtəbə</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-copper"
                  >
                    <FiEye /> Ətraflı Bax
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}