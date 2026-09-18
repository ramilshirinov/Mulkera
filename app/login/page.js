"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { FiMail, FiLock, FiArrowRight, FiCheckCircle } from "react-icons/fi";

export default function LoginPage() {
  const { supabase } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/listings";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Zəhmət olmasa bütün sahələri doldurun.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg("Uğurla daxil olundu! İstiqamətləndirilirsiniz...");
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Giriş xətası:", err.message);
      if (err.message.includes("Invalid login credentials")) {
        setErrorMsg("Email və ya şifrə yanlışdır.");
      } else {
        setErrorMsg(err.message || "Giriş zamanı xəta baş verdi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-navy/10 shadow-card">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-navy">Xoş Gəlmisiniz</h1>
          <p className="text-sm text-navy/60 mt-1">Davam etmək üçün hesabınıza daxil olun</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium text-center flex items-center justify-center gap-2">
            <FiCheckCircle className="text-lg" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-2">
              Email Ünvanı
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-navy/40">
                <FiMail />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-navy/15 rounded-xl text-sm text-navy outline-none focus:border-copper transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
                Şifrə
              </label>
              {/* Buradakı classclassName olaraq düzəldildi */}
              <Link href="/forgot-password" className="text-xs font-semibold text-copper hover:underline">
                Şifrəni unutmusunuz?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-navy/40">
                <FiLock />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-navy/15 rounded-xl text-sm text-navy outline-none focus:border-copper transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 bg-navy hover:bg-copper text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Daxil olunur..." : "Daxil Ol"} <FiArrowRight />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-navy/60">
          Hesabınız yoxdur?{" "}
          <Link href="/register" className="font-bold text-copper hover:underline">
            Qeydiyyatdan keçin
          </Link>
        </div>

      </div>
    </div>
  );
}