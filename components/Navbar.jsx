"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { languages } from "@/lib/i18n";
import { FiHeart, FiUser, FiShield, FiPlusCircle, FiGlobe, FiMapPin } from "react-icons/fi";

export default function Navbar() {
  const { user, language, setLanguage, dict } = useApp();
  const [isOpenLang, setIsOpenLang] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white text-navy border-b border-navy/10 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo və Mətnlər */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 shrink-0 flex items-center justify-center">
            <img 
              src="/images/logo-icon.png" 
              alt="MÜLKERA Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-xl font-bold tracking-wider font-heading leading-none flex items-center">
              <span className="text-navy">MÜLK</span>
              <span className="text-copper">ERA</span>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-navy/80 uppercase mt-0.5">
              ƏMLAK SATIŞI AGENTLİYİ
            </span>
            <span className="text-[10px] text-navy/60 font-medium tracking-tight">
              Sizin eranız, sizin mülkünüz.
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 font-medium">
          <Link href="/listings" className="text-navy hover:text-copper transition">
            {dict.nav?.listings || "Elanlar"}
          </Link>
          
          {/* Xəritə Axtarışı Keçidi */}
          <Link href="/map" className="flex items-center gap-1.5 text-navy hover:text-copper transition">
            <FiMapPin className="text-copper" /> Xəritə Axtarışı
          </Link>

          <Link href="/favorites" className="flex items-center gap-1.5 text-navy hover:text-copper transition">
            <FiHeart className="text-copper" /> {dict.nav?.favorites || "Favoritlər"}
          </Link>

          {user && (
            <Link href="/profile" className="text-navy hover:text-copper transition font-semibold">
              Profil
            </Link>
          )}

          {user?.user_metadata?.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-1.5 text-copper font-semibold hover:text-gold-600 transition">
              <FiShield /> {dict.nav?.admin || "Admin"}
            </Link>
          )}
        </nav>

        {/* Right Actions & Language Switcher */}
        <div className="flex items-center gap-4">
          
          {/* Dil Seçici Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsOpenLang(!isOpenLang)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy text-sm font-semibold transition"
            >
              <FiGlobe className="text-copper" />
              <span>{language.toUpperCase()}</span>
            </button>

            {isOpenLang && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpenLang(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition ${
                      language === lang.code 
                        ? "bg-navy text-white font-semibold" 
                        : "text-navy hover:bg-slate-50"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/listings/add" className="hidden sm:flex items-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-2.5 px-4 text-sm font-semibold transition shadow-sm">
            <FiPlusCircle /> {dict.nav?.addListing || "Elan Yerləşdir"}
          </Link>

          {user ? (
            <Link href="/profile" className="flex items-center gap-2 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-navy transition" title="Profil">
              <FiUser className="text-copper text-lg" />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-navy hover:text-copper transition">
                {dict.nav?.login || "Daxil ol"}
              </Link>
              <Link href="/register" className="rounded-xl bg-gold-400 hover:bg-gold-500 text-navy py-2 px-4 text-sm font-semibold transition shadow-sm">
                {dict.nav?.register || "Qeydiyyat"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}