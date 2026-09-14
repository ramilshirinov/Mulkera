"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Logo from "@/components/Logo";
import { FiUser, FiMail, FiLock, FiPhone, FiBriefcase, FiPercent, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import az from "@/lib/i18n/az";// Fallback üçün birbaşa AZ lüğətini çağırırıq

export default function RegisterPage() {
  const { dict = az, supabase } = useApp();
  const router = useRouter();

  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    agencyName: "",
    commissionRate: "",
    legalStatus: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role,
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = data.user?.id;

      if (userId) {
        await supabase
          .from("users")
          .update({ phone: form.phone })
          .eq("id", userId);

        if (role === "realtor") {
          const { error: realtorError } = await supabase.from("realtor_profiles").insert({
            user_id: userId,
            agency_name: form.agencyName,
            commission_rate: Number(form.commissionRate) || 0,
            legal_status: form.legalStatus,
            contact_number: form.phone,
            approval_status: "pending",
          });
          if (realtorError) throw realtorError;
        }
      }

      setSuccess(true);
      // Əgər e-poçt təsdiqi gözlənilmirsə, birbaşa profilə yönləndiririk
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo className="h-14 w-auto" />
      </div>
      <div className="card-surface p-8 bg-white rounded-2xl shadow-card border border-navy/10">
        <h1 className="mb-6 text-center text-2xl font-bold font-heading text-navy">
          {dict.auth?.registerTitle || "Qeydiyyatdan Keç"}
        </h1>

        {/* Rol Seçimi */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1 border border-navy/10">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`rounded-full py-2.5 text-sm font-semibold transition-all ${
              role === "customer" ? "bg-navy text-white shadow-sm" : "text-navy/70 hover:text-navy"
            }`}
          >
            {dict.auth?.registerAsCustomer || "Müştəri"}
          </button>
          <button
            type="button"
            onClick={() => setRole("realtor")}
            className={`rounded-full py-2.5 text-sm font-semibold transition-all ${
              role === "realtor" ? "bg-navy text-white shadow-sm" : "text-navy/70 hover:text-navy"
            }`}
          >
            {dict.auth?.registerAsRealtor || "Rieltor"}
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            <FiAlertCircle /> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-600 border border-green-200">
            <FiCheckCircle /> Hesabınız uğurla yaradıldı, yönləndirilirsiniz...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
              {dict.auth?.fullName || "Ad Soyad"}
            </label>
            <div className="relative">
              <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input 
                required 
                value={form.fullName} 
                onChange={(e) => update("fullName", e.target.value)} 
                placeholder="Adınız Soyadınız"
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 pl-11 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
              {dict.auth?.email || "Elektron Poçt"}
            </label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input 
                type="email" 
                required 
                value={form.email} 
                onChange={(e) => update("email", e.target.value)} 
                placeholder="nümunə@mail.com"
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 pl-11 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
              {dict.auth?.password || "Şifrə"}
            </label>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input 
                type="password" 
                required 
                minLength={6} 
                value={form.password} 
                onChange={(e) => update("password", e.target.value)} 
                placeholder="******"
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 pl-11 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
              {dict.auth?.phone || "Əlaqə Nömrəsi"}
            </label>
            <div className="relative">
              <FiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input 
                required 
                value={form.phone} 
                onChange={(e) => update("phone", e.target.value)} 
                placeholder="+994 50 123 45 67" 
                className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 pl-11 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
              />
            </div>
          </div>

          {role === "realtor" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
                  {dict.auth?.agencyName || "Agentlik Adı"}
                </label>
                <div className="relative">
                  <FiBriefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
                  <input 
                    required 
                    value={form.agencyName} 
                    onChange={(e) => update("agencyName", e.target.value)} 
                    placeholder="Agentliyin adı"
                    className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 pl-11 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
                  {dict.auth?.commissionRate || "Komissiya dərəcəsi (%)"}
                </label>
                <div className="relative">
                  <FiPercent className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    required 
                    value={form.commissionRate} 
                    onChange={(e) => update("commissionRate", e.target.value)} 
                    placeholder="Məs: 2"
                    className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 pl-11 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
                  {dict.auth?.legalStatus || "Hüquqi Status / VÖEN"}
                </label>
                <input 
                  required 
                  value={form.legalStatus} 
                  onChange={(e) => update("legalStatus", e.target.value)} 
                  placeholder="VÖEN və ya hüquqi status" 
                  className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy placeholder:text-navy/40 focus:border-gold transition-all" 
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-copper shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? "Gözləyin..." : (dict.auth?.submitRegister || "Qeydiyyatdan Keç")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy/60 font-medium">
          {dict.auth?.haveAccount || "Artıq hesabınız var?"}{" "}
          <Link href="/login" className="font-semibold text-copper hover:underline">
            {dict.nav?.login || "Daxil olun"}
          </Link>
        </p>
      </div>
    </div>
  );
}