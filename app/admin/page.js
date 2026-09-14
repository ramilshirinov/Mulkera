"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { FiShield, FiUsers, FiHome, FiCheckCircle, FiXCircle, FiAward } from "react-icons/fi";

export default function AdminPage() {
  const { user, supabase, loadingAuth } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, listings: 0 });
  const [pendingRealtors, setPendingRealtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (loadingAuth) return;
      if (!user || user.user_metadata?.role !== "admin") {
        router.push("/");
        return;
      }

      // Statistika və gözləyən rieltorların çəkilməsi
      const [usersCount, listingsCount, realtorsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*").eq("role", "realtor").eq("is_approved", false),
      ]);

      setStats({
        users: usersCount.count || 0,
        listings: listingsCount.count || 0,
      });

      if (realtorsRes.data) setPendingRealtors(realtorsRes.data);
      setLoading(false);
    }

    checkAdmin();
  }, [user, loadingAuth, router, supabase]);

  // Rieltoru təsdiq etmək
  const handleApprove = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("id", id);

    if (!error) {
      setPendingRealtors(pendingRealtors.filter((r) => r.id !== id));
    } else {
      alert("Xəta baş verdi: " + error.message);
    }
  };

  // Rieltor müraciətini rədd etmək (və ya statusu dəyişmək)
  const handleReject = async (id) => {
    if (!confirm("Bu rieltor müraciətini rədd etmək istədiyinizə əminsiniz?")) return;
    
    // İstəyə görə rolunu yenidən 'customer' edə bilərik və ya silə bilərik
    const { error } = await supabase
      .from("profiles")
      .update({ role: "customer", is_approved: false })
      .eq("id", id);

    if (!error) {
      setPendingRealtors(pendingRealtors.filter((r) => r.id !== id));
    } else {
      alert("Xəta baş verdi: " + error.message);
    }
  };

  if (loadingAuth || loading) {
    return <div className="py-32 text-center text-navy font-medium">Yüklənir...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold font-heading text-navy">
        <FiShield className="text-copper" /> Admin Panel
      </h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-10">
        <div className="card-surface p-6 bg-white rounded-2xl shadow-card border border-navy/10 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-navy/10 text-navy text-2xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-sm text-navy/60 font-medium">Ümumi İstifadəçilər</p>
            <h3 className="text-2xl font-bold text-navy">{stats.users}</h3>
          </div>
        </div>

        <div className="card-surface p-6 bg-white rounded-2xl shadow-card border border-navy/10 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-copper/10 text-copper text-2xl">
            <FiHome />
          </div>
          <div>
            <p className="text-sm text-navy/60 font-medium">Ümumi Elanlar</p>
            <h3 className="text-2xl font-bold text-navy">{stats.listings}</h3>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold font-heading text-navy">Təsdiq Gözləyən Rieltorlar</h2>
      <div className="card-surface bg-white rounded-2xl shadow-card border border-navy/10 overflow-hidden">
        {pendingRealtors.length === 0 ? (
          <div className="p-8 text-center text-navy/50 text-sm font-medium">Təsdiq gözləyən rieltor yoxdur.</div>
        ) : (
          <div className="divide-y divide-navy/10">
            {pendingRealtors.map((realtor) => (
              <div key={realtor.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <h4 className="font-bold text-navy text-base">{realtor.full_name || "Adsız istifadəçi"}</h4>
                  <p className="text-sm text-navy/60 mt-0.5">{realtor.email}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    Rieltor müraciəti
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(realtor.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-semibold text-sm hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    title="Təsdiq et"
                  >
                    <FiCheckCircle size={18} /> Təsdiq Et
                  </button>
                  <button
                    onClick={() => handleReject(realtor.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="Rədd et"
                  >
                    <FiXCircle size={18} /> Rədd Et
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}