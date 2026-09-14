"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from "react-icons/fi";

export default function LoginPage() {
  const { supabase } = useApp();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data?.user) {
        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Daxil edilən e-poçt və ya şifrə yanlışdır. Zəhmət olmasa yenidən yoxlayın.");
      } else {
        setError(`Giriş xətası: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card border border-navy/10 p-8 sm:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold font-heading text-navy">Xoş Gəldiniz</h1>
          <p className="text-navy/60 text-sm mt-1">Hesabınıza daxil olun</p>
        </div>

        {/* Xəta Mesajı */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-sm">
            <FiAlertCircle className="text-lg shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
              Elektron poçt
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy/40">
                <FiMail />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-navy/10 rounded-2xl text-navy text-sm focus:outline-none focus:border-copper transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider">
                Şifrə
              </label>
              <Link href="/forgot-password" class="text-xs font-semibold text-copper hover:underline">
                Şifrəni unutmusunuz?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy/40">
                <FiLock />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-navy/10 rounded-2xl text-navy text-sm focus:outline-none focus:border-copper transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-navy/50 hover:text-navy transition"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-navy text-white hover:bg-copper rounded-2xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Yüklənir..." : "Daxil ol"}</span>
            {!loading && <FiArrowRight />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-sm text-navy/60">
          Hesabınız yoxdur?{" "}
          <Link href="/register" className="text-copper font-semibold hover:underline">
            Qeydiyyatdan keçin
          </Link>
        </div>

      </div>
    </div>
  );
}