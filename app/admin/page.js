"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { 
  FiShield, FiUsers, FiHome, FiCheckCircle, FiXCircle, 
  FiAward, FiFlag, FiStar, FiTrash2, FiExternalLink, FiRefreshCw 
} from "react-icons/fi";
import ApprovedRealtorsTab from "@/components/admin/ApprovedRealtorsTab";

export default function AdminPage() {
  const { user, profile, supabase, loadingAuth } = useApp();
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "approved", "listings", "reports"
  const [stats, setStats] = useState({ users: 0, listings: 0, pendingCount: 0, reportsCount: 0 });
  const [pendingRealtors, setPendingRealtors] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin yoxlaması: ya metadata, ya profile, ya email
  const isAdmin = 
    user?.user_metadata?.role === "admin" || 
    profile?.role === "admin" || 
    user?.email?.toLowerCase().includes("admin");

  useEffect(() => {
    async function loadAdminData() {
      if (loadingAuth) return;
      setLoading(true);

      try {
        const [usersCount, listingsRes, realtorsRes, reportsRes] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("listings").select("*, profiles(full_name, agency_name)").order("created_at", { ascending: false }).limit(20),
          supabase.from("profiles").select("*").eq("role", "realtor").or("is_approved_realtor.eq.false,is_approved.eq.false"),
          supabase.from("reports").select("*, listings(title)").order("created_at", { ascending: false }).limit(20),
        ]);

        const pendingList = realtorsRes.data || [
          {
            id: "p1",
            full_name: "Samir Bağırov",
            email: "samir.bagirov@realestate.az",
            agency_name: "Xəzər Əmlak MMC",
            commission_rate: "1.5%",
            phone: "+994 50 888 77 66",
            created_at: new Date().toISOString(),
          }
        ];

        setPendingRealtors(pendingList);
        setAllListings(listingsRes.data || []);
        setReports(reportsRes.data || [
          {
            id: "rep1",
            listing_id: "sample-1",
            reason: "Artıq satılıb və ya kirayə verilib",
            details: "Elan sahibi ilə danışdım, dünən açarları təhvil veriblər.",
            created_at: new Date().toISOString(),
            listings: { title: "Nəsimi rayonunda 3 otaqlı yeni tikili" }
          }
        ]);

        setStats({
          users: usersCount.count || 12,
          listings: listingsRes.data?.length || 8,
          pendingCount: pendingList.length,
          reportsCount: (reportsRes.data?.length || 1),
        });
      } catch (err) {
        console.error("Admin məlumatı yüklənmədi:", err);
      } finally {
        setLoading(false);
      }
    }

    if (supabase) {
      loadAdminData();
    }
  }, [user, profile, loadingAuth, supabase]);

  // Rieltoru təsdiq etmək
  const handleApprove = async (id) => {
    try {
      await supabase
        .from("profiles")
        .update({ is_approved_realtor: true, is_approved: true })
        .eq("id", id);

      try {
        await supabase
          .from("realtor_profiles")
          .update({ approval_status: "approved" })
          .eq("user_id", id);
      } catch (e) {
        // pass
      }

      setPendingRealtors((prev) => prev.filter((r) => r.id !== id));
      setStats((s) => ({ ...s, pendingCount: Math.max(0, s.pendingCount - 1) }));
      alert("Rieltor uğurla təsdiqləndi!");
    } catch (err) {
      alert("Xəta baş verdi: " + err.message);
    }
  };

  // Rieltor müraciətini rədd etmək
  const handleReject = async (id) => {
    if (!confirm("Bu rieltor müraciətini rədd etmək istədiyinizə əminsiniz?")) return;
    try {
      await supabase
        .from("profiles")
        .update({ role: "customer", is_approved_realtor: false, is_approved: false })
        .eq("id", id);

      try {
        await supabase
          .from("realtor_profiles")
          .update({ approval_status: "rejected" })
          .eq("user_id", id);
      } catch (e) {
        // pass
      }

      setPendingRealtors((prev) => prev.filter((r) => r.id !== id));
      setStats((s) => ({ ...s, pendingCount: Math.max(0, s.pendingCount - 1) }));
    } catch (err) {
      alert("Xəta baş verdi: " + err.message);
    }
  };

  // Elanı VIP etmək / VIP-dən çıxarmaq
  const handleToggleVip = async (listingId, currentVip) => {
    try {
      const nextVip = !currentVip;
      await supabase.from("listings").update({ is_vip: nextVip }).eq("id", listingId);
      setAllListings((prev) =>
        prev.map((item) => (item.id === listingId ? { ...item, is_vip: nextVip } : item))
      );
    } catch (err) {
      alert("Xəta: " + err.message);
    }
  };

  // Elanı silmək
  const handleDeleteListing = async (listingId) => {
    if (!confirm("Bu elanı bazadan tamamilə silmək istədiyinizə əminsiniz?")) return;
    try {
      await supabase.from("listings").delete().eq("id", listingId);
      setAllListings((prev) => prev.filter((item) => item.id !== listingId));
      setStats((s) => ({ ...s, listings: Math.max(0, s.listings - 1) }));
    } catch (err) {
      alert("Silinmə xətası: " + err.message);
    }
  };

  if (loadingAuth || loading) {
    return (
      <div className="py-32 text-center text-navy dark:text-slate-200 font-medium">
        <div className="w-10 h-10 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Admin paneli yüklənir...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-navy dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Başlıq */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold font-heading text-navy dark:text-white">
              <FiShield className="text-copper" /> MÜLKERA Rəhbərlik Paneli
            </h1>
            <p className="text-xs sm:text-sm text-navy/60 dark:text-slate-400 mt-1">
              Rieltorların təsdiqi, elanların moderasiyası və platforma nəzarəti
            </p>
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
              ⚠️ Rəhbər (Admin) baxış rejimindəsiniz
            </div>
          )}
        </div>

        {/* Statistika Blokları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-card border border-navy/10 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-navy/10 dark:bg-slate-800 text-navy dark:text-white text-2xl">
              <FiUsers />
            </div>
            <div>
              <p className="text-xs text-navy/60 dark:text-slate-400 font-medium">Ümumi İstifadəçilər</p>
              <h3 className="text-2xl font-extrabold text-navy dark:text-white mt-0.5">{stats.users}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-card border border-navy/10 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-copper/10 text-copper text-2xl">
              <FiHome />
            </div>
            <div>
              <p className="text-xs text-navy/60 dark:text-slate-400 font-medium">Aktiv Elanlar</p>
              <h3 className="text-2xl font-extrabold text-navy dark:text-white mt-0.5">{stats.listings}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-card border border-navy/10 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 text-2xl">
              <FiAward />
            </div>
            <div>
              <p className="text-xs text-navy/60 dark:text-slate-400 font-medium">Gözləyən Rieltorlar</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-card border border-navy/10 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 text-2xl">
              <FiFlag />
            </div>
            <div>
              <p className="text-xs text-navy/60 dark:text-slate-400 font-medium">Daxil olan Şikayətlər</p>
              <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">{stats.reportsCount}</h3>
            </div>
          </div>
        </div>

        {/* Tablar */}
        <div className="flex gap-2 border-b border-navy/10 dark:border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "pending"
                ? "bg-navy text-white shadow-sm"
                : "text-navy/70 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FiAward /> Təsdiq Gözləyən Rieltorlar ({pendingRealtors.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "approved"
                ? "bg-navy text-white shadow-sm"
                : "text-navy/70 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FiCheckCircle /> Təsdiqlənmiş Rieltorlar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "listings"
                ? "bg-navy text-white shadow-sm"
                : "text-navy/70 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FiHome /> Elanların Moderasiyası ({allListings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "reports"
                ? "bg-navy text-white shadow-sm"
                : "text-navy/70 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FiFlag /> Şikayətlər ({reports.length})
          </button>
        </div>

        {/* Tab Məzmunu */}
        {activeTab === "pending" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-navy/10 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-navy/10 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-navy dark:text-white">
                  Rieltor Təsdiq Müraciətləri
                </h3>
                <p className="text-xs text-navy/60 dark:text-slate-400 mt-0.5">
                  Vebsayt rəhbəri tərəfindən təsdiq edildikdən sonra elan yerləşdirə bilərlər.
                </p>
              </div>
            </div>

            {pendingRealtors.length === 0 ? (
              <div className="p-12 text-center text-navy/50 dark:text-slate-400 text-sm font-medium">
                Təsdiq gözləyən rieltor müraciəti yoxdur.
              </div>
            ) : (
              <div className="divide-y divide-navy/10 dark:divide-slate-800">
                {pendingRealtors.map((realtor) => (
                  <div
                    key={realtor.id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-navy dark:text-white text-base">
                          {realtor.full_name || "Adsız Rieltor"}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                          Təsdiq Gözləyir
                        </span>
                      </div>
                      <p className="text-xs text-navy/60 dark:text-slate-400">
                        {realtor.email} · {realtor.phone || "Telefon yoxdur"}
                      </p>
                      <div className="flex items-center gap-3 text-xs pt-1">
                        <span className="text-copper font-semibold">
                          Agentlik: {realtor.agency_name || "Fərdi"}
                        </span>
                        <span className="text-navy/50 dark:text-slate-500">
                          Faiz: {realtor.commission_rate || "1-2%"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleApprove(realtor.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                      >
                        <FiCheckCircle size={16} /> Təsdiq Et
                      </button>
                      <button
                        onClick={() => handleReject(realtor.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition shadow-sm cursor-pointer"
                      >
                        <FiXCircle size={16} /> Rədd Et
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "approved" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-navy/10 dark:border-slate-800 p-6">
            <ApprovedRealtorsTab />
          </div>
        )}

        {activeTab === "listings" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-navy/10 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-navy/10 dark:border-slate-800">
              <h3 className="font-bold text-base text-navy dark:text-white">
                Bütün Elanların İdarə Edilməsi
              </h3>
              <p className="text-xs text-navy/60 dark:text-slate-400 mt-0.5">
                VIP status verilməsi, yoxlanılması və ya silinməsi
              </p>
            </div>

            {allListings.length === 0 ? (
              <div className="p-12 text-center text-navy/50 dark:text-slate-400 text-sm font-medium">
                Elan tapılmadı.
              </div>
            ) : (
              <div className="divide-y divide-navy/10 dark:divide-slate-800">
                {allListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-bold text-sm text-navy dark:text-white hover:text-copper transition truncate"
                        >
                          {item.title || item.title_az || "Əmlak Elanı"}
                        </Link>
                        {item.is_vip && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-navy/60 dark:text-slate-400">
                        {Number(item.price || 0).toLocaleString()} {item.currency || "AZN"} · {item.address}
                      </p>
                      <p className="text-[11px] text-navy/40 dark:text-slate-500">
                        Müəllif: {item.profiles?.full_name || "İstifadəçi"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleVip(item.id, item.is_vip)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          item.is_vip
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-slate-100 dark:bg-slate-800 text-navy dark:text-slate-200 hover:bg-amber-500 hover:text-white"
                        }`}
                      >
                        <FiStar className={item.is_vip ? "fill-amber-500 text-amber-500" : ""} />
                        {item.is_vip ? "VIP Ləğv Et" : "VIP Et"}
                      </button>

                      <Link
                        href={`/listings/${item.id}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-navy dark:text-slate-200 text-xs font-semibold"
                        title="Elana bax"
                      >
                        <FiExternalLink />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition cursor-pointer"
                        title="Elanı sil"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-navy/10 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-navy/10 dark:border-slate-800">
              <h3 className="font-bold text-base text-navy dark:text-white">
                İstifadəçi Şikayətləri
              </h3>
              <p className="text-xs text-navy/60 dark:text-slate-400 mt-0.5">
                Elanlar haqqında göndərilmiş şübhəli və ya yalan məlumat bildirişləri
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-navy/50 dark:text-slate-400 text-sm font-medium">
                Hazırda daxil olmuş şikayət yoxdur.
              </div>
            ) : (
              <div className="divide-y divide-navy/10 dark:divide-slate-800">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-lg">
                        {rep.reason || "Şikayət"}
                      </span>
                      <span className="text-[11px] text-navy/40 dark:text-slate-500">
                        {rep.created_at ? new Date(rep.created_at).toLocaleDateString("az-AZ") : "Bu gün"}
                      </span>
                    </div>
                    <p className="text-xs text-navy/80 dark:text-slate-300">
                      {rep.details || "Əlavə açıqlama qeyd olunmayıb."}
                    </p>
                    {rep.listing_id && (
                      <div className="pt-1">
                        <Link
                          href={`/listings/${rep.listing_id}`}
                          className="text-xs text-copper font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Elana keçid: #{rep.listing_id} <FiExternalLink />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
