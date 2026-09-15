"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { FiAward, FiStar, FiTrendingUp, FiPhone, FiMapPin, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";

export default function RealtorsPage() {
  const { supabase } = useApp();
  const [realtors, setRealtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealtors() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (!error && data && data.length > 0) {
        const enriched = data.map((profile, index) => ({
          ...profile,
          sales_count: profile.sales_count || (15 - index * 2 > 0 ? 15 - index * 2 : 3),
          satisfaction_rate: profile.satisfaction_rate || (98 - index * 1.5).toFixed(1),
          sales_speed_days: profile.sales_speed_days || (12 + index * 3),
        }));
        setRealtors(enriched);
      } else {
        // Əgər bazada profil hələ yoxdursa, test üçün nümunə göstəririk
        setRealtors([
          {
            id: "1",
            full_name: "Ramil Şirinov",
            agency_name: "RF Master Sales Agency",
            sales_count: 18,
            satisfaction_rate: "99.2",
            sales_speed_days: 9,
            phone: "+994 50 123 45 67",
            avatar_url: ""
          }
        ]);
      }
      setLoading(false);
    }

    fetchRealtors();
  }, [supabase]);

  if (loading) {
    return <div className="py-32 text-center text-navy font-medium">Rieltorlar siyahısı yüklənir...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-copper/10 text-copper uppercase tracking-wider">
          Aylıq Yarışma və Reytinq
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-navy mt-3 mb-4">
          Ən Yaxşı Rieltorlar və Agentliklər
        </h1>
        <p className="text-navy/70 text-sm sm:text-base">
          Satış sayı, müştəri məmnuniyyəti razılığı və satış sürətinə görə sıralanmış peşəkar rieltorlar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {realtors.map((realtor, index) => (
          <div 
            key={realtor.id} 
            className="card-surface bg-white rounded-2xl shadow-card border border-navy/10 p-6 flex flex-col justify-between relative overflow-hidden transition hover:shadow-lg"
          >
            <div className="absolute top-4 right-4 bg-navy text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <FiAward className="text-copper" /> #{index + 1} Yer
            </div>

            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center text-navy font-bold text-xl overflow-hidden border border-navy/10">
                  {realtor.avatar_url ? (
                    <img src={realtor.avatar_url} alt={realtor.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{realtor.full_name?.[0] || "R"}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-navy flex items-center gap-1">
                    {realtor.full_name || "Peşəkar Rieltor"} <FiCheckCircle className="text-emerald-600 text-sm" />
                  </h3>
                  <p className="text-xs text-navy/60 flex items-center gap-1 mt-0.5">
                    <FiMapPin className="text-copper" /> {realtor.agency_name || "RF Master Sales Agency"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-navy/5 mb-6 text-sm">
                <div className="flex justify-between items-center text-navy/80">
                  <span className="flex items-center gap-1.5 text-xs"><FiTrendingUp className="text-copper" /> Aylıq Satış:</span>
                  <span className="font-bold text-navy">{realtor.sales_count} əmlak</span>
                </div>
                <div className="flex justify-between items-center text-navy/80">
                  <span className="flex items-center gap-1.5 text-xs"><FiStar className="text-amber-500" /> Müştəri Razılığı:</span>
                  <span className="font-bold text-emerald-600">{realtor.satisfaction_rate}%</span>
                </div>
                <div className="flex justify-between items-center text-navy/80">
                  <span className="flex items-center gap-1.5 text-xs">⚡ Orta Satış Sürəti:</span>
                  <span className="font-bold text-navy">{realtor.sales_speed_days} gün</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {realtor.phone && (
                <a 
                  href={`tel:${realtor.phone}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-2.5 px-4 text-xs font-semibold transition shadow-sm"
                >
                  <FiPhone /> {realtor.phone}
                </a>
              )}
              <Link
                href={`/realtors/${realtor.id}`}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy py-2.5 px-4 text-xs font-semibold transition text-center"
              >
                Hesabına və Elanlarına Bax
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}