"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { FiSearch, FiMapPin } from "react-icons/fi";

export default function HomePage() {
  const { supabase, dict } = useApp();
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchListings = async () => {
      let query = supabase.from("listings").select("*").limit(6);
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }
      const { data } = await query;
      if (data) setListings(data);
    };
    fetchListings();
  }, [supabase, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-navy">
      {/* Hero Section */}
      <section className="relative bg-white text-navy py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden border-b border-navy/10 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Slogan */}
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-copper text-xs font-semibold tracking-wide uppercase border border-gold/30 shadow-sm">
            {dict.brand} — {dict.slogan}
          </span>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold font-heading tracking-tight text-navy">
            {dict.home?.heroTitle || "Arzuladığınız Mülkü MÜLKERA ilə Tapın"}
          </h1>
          
          <p className="text-base sm:text-lg text-navy/70 max-w-2xl mx-auto font-medium">
            {dict.home?.heroSubtitle || "Bakıda və bölgələrdə elit mənzillər, villalar və kommersiya obyektləri."}
          </p>

          {/* Search Box */}
          <div className="p-3 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 bg-white rounded-2xl shadow-card border border-navy/10">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-navy/10 text-navy">
              <FiMapPin className="text-copper flex-shrink-0 text-lg" />
              <input
                type="text"
                placeholder={dict.home?.searchPlaceholder || "Şəhər və ya ünvan daxil edin..."}
                className="w-full bg-transparent text-sm outline-none text-navy placeholder:text-navy/40 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link
              href={`/listings?search=${searchQuery}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-copper shadow-sm"
            >
              <FiSearch /> {dict.home?.searchButton || "Axtar"}
            </Link>
          </div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { id: "all", label: dict.home?.categories || "Bütün Elanlar" },
            { id: "new-building", label: dict.categories?.["new-building"] || "Novostroyka" },
            { id: "old-building", label: dict.categories?.["old-building"] || "Eski fond" },
            { id: "house-cottage", label: dict.categories?.["house-cottage"] || "Ev/Daça" },
            { id: "office", label: dict.categories?.office || "Ofis" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-navy text-white shadow-card"
                  : "bg-white text-navy border border-navy/15 hover:border-gold hover:text-copper"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-navy">
            {dict.home?.featured || "Seçilmiş Elanlar"}
          </h2>
          <Link href="/listings" className="text-copper font-semibold text-sm hover:underline">
            {dict.home?.viewAll || "Hamısına bax"} &rarr;
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="card-surface p-12 text-center text-navy/55 bg-white rounded-2xl border border-navy/10 shadow-sm font-medium">
            {dict.home?.noListings || "Hələ ki bu kateqoriyada aktiv elan yoxdur."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}