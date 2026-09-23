"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiUser,
  FiSave,
  FiLogOut,
  FiTrash2,
  FiLock,
  FiHome,
  FiEdit2,
  FiEye,
  FiFacebook,
  FiInstagram,
  FiMessageCircle,
  FiBell,
  FiBarChart2,
} from "react-icons/fi";

export default function ProfilePage() {
  const { user, profile, supabase, logout, updateProfile } = useApp();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    agency_name: "MÜLKERA Real Estate",
    facebook_url: "",
    instagram_url: "",
    whatsapp: "",
    email_notifications: true,
    sms_notifications: false,
  });

  // Şifrə dəyişmə state-ləri
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Öz elanlarım state-ləri
  const [myListings, setMyListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Profil məlumatlarını təyin edirik
    setForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || "",
      phone: profile?.phone || user?.phone || "",
      avatar_url: profile?.avatar_url || "",
      agency_name: profile?.agency_name || "MÜLKERA Real Estate",
      facebook_url: profile?.facebook_url || "",
      instagram_url: profile?.instagram_url || "",
      whatsapp: profile?.whatsapp || "",
      email_notifications: profile?.email_notifications ?? true,
      sms_notifications: profile?.sms_notifications ?? false,
    });
    setLoading(false);

    async function fetchMyListings() {
      setListingsLoading(true);
      try {
        const res = await fetch(`/api/listings?owner_id=${user.id}`);
        const json = await res.json();
        setMyListings(json.data || []);
      } catch (err) {
        console.error("Elanlarım yüklənmədi:", err);
      } finally {
        setListingsLoading(false);
      }
    }

    fetchMyListings();
  }, [user, profile, router]);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setForm((prev) => ({ ...prev, avatar_url: json.url }));
        alert("Profil şəkli yükləndi!");
      }
    } catch (error) {
      alert("Şəkil yüklənərkən xəta: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile({
        full_name: form.full_name,
        phone: form.phone,
        avatar_url: form.avatar_url,
        agency_name: form.agency_name,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        whatsapp: form.whatsapp,
        email_notifications: form.email_notifications,
        sms_notifications: form.sms_notifications,
      });
      alert("Profil uğurla yeniləndi!");
    } catch (err) {
      alert("Yenilənmə xətası: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Yeni şifrələr bir-biri ilə uyğun gəlmir!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("Şifrə ən azı 6 simvoldan ibarət olmalıdır!");
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });
    setUpdatingPassword(false);

    if (error) {
      alert("Şifrə yenilənərkən xəta: " + error.message);
    } else {
      alert("Şifrəniz uğurla dəyişdirildi!");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Hesabınızı silmək istədiyinizə əminsinizmi? Bu əməliyyat geri qaytarılmır!")) {
      await logout();
      router.push("/");
      alert("Hesabınızdan çıxış edildi.");
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm("Bu elanı silmək istədiyinizə əminsiniz?")) return;

    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Silinmədi");
      setMyListings((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Elan silinərkən xəta: " + err.message);
    }
  };

  // Statistika hesablamaları
  const totalListings = myListings.length;
  const totalViews = myListings.reduce((sum, item) => sum + (item.views || 0), 0);
  const activeListings = myListings.filter((item) => item.status !== "sold" && item.status !== "inactive").length;

  if (loading) {
    return <div className="py-32 text-center text-navy font-medium">Profil yüklənir...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold font-heading text-navy flex items-center gap-2">
        <FiUser className="text-copper" /> Profil Məlumatları
      </h1>

      {/* Statistika Kartları */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-surface bg-white rounded-2xl shadow-card border border-navy/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-navy">{totalListings}</p>
          <p className="text-[11px] text-navy/60 font-medium mt-1">Ümumi Elan</p>
        </div>
        <div className="card-surface bg-white rounded-2xl shadow-card border border-navy/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-navy">{activeListings}</p>
          <p className="text-[11px] text-navy/60 font-medium mt-1">Aktiv Elan</p>
        </div>
        <div className="card-surface bg-white rounded-2xl shadow-card border border-navy/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-navy">{totalViews}</p>
          <p className="text-[11px] text-navy/60 font-medium mt-1">Ümumi Baxış</p>
        </div>
      </div>

      {/* Əsas Profil Formu */}
      <form onSubmit={handleSave} className="card-surface p-6 sm:p-8 bg-white rounded-2xl shadow-card border border-navy/10 space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-navy/10">
          <div className="w-20 h-20 rounded-full bg-navy/10 overflow-hidden flex items-center justify-center border border-navy/20 shrink-0">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="text-3xl text-navy/40" />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Profil Şəklini Dəyiş</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="text-xs text-navy file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white hover:file:bg-copper file:cursor-pointer"
            />
            {uploading && <p className="text-xs text-copper mt-1">Şəkil yüklənir...</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Ad Soyad</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Əlaqə Nömrəsi</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+994 50 123 45 67"
            className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Agentlik / Şirkət Adı</label>
          <input
            type="text"
            value={form.agency_name}
            onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
          />
        </div>

        {/* Sosial / Əlaqə Linkləri */}
        <div className="pt-2 border-t border-navy/10 space-y-4">
          <p className="text-sm font-semibold text-navy">Sosial Media və Əlaqə Linkləri</p>

          <div className="relative">
            <FiFacebook className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              value={form.facebook_url}
              onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
              placeholder="Facebook profil linki"
              className="w-full rounded-xl bg-slate-50 border border-navy/15 pl-10 pr-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
            />
          </div>

          <div className="relative">
            <FiInstagram className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              value={form.instagram_url}
              onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
              placeholder="Instagram profil linki"
              className="w-full rounded-xl bg-slate-50 border border-navy/15 pl-10 pr-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
            />
          </div>

          <div className="relative">
            <FiMessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="WhatsApp nömrəsi"
              className="w-full rounded-xl bg-slate-50 border border-navy/15 pl-10 pr-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
            />
          </div>
        </div>

        {/* Bildiriş Tənzimləmələri */}
        <div className="pt-2 border-t border-navy/10 space-y-4">
          <p className="text-sm font-semibold text-navy flex items-center gap-2">
            <FiBell className="text-copper" /> Bildiriş Tənzimləmələri
          </p>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-navy">Email bildirişləri</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, email_notifications: !form.email_notifications })}
              className={`w-11 h-6 rounded-full transition relative shrink-0 ${
                form.email_notifications ? "bg-copper" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.email_notifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-navy">SMS bildirişləri</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, sms_notifications: !form.sms_notifications })}
              className={`w-11 h-6 rounded-full transition relative shrink-0 ${
                form.sms_notifications ? "bg-copper" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.sms_notifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-3.5 px-4 text-sm font-bold transition shadow-sm"
        >
          <FiSave /> {saving ? "Yadda saxlanılır..." : "Dəyişiklikləri Yadda Saxla"}
        </button>
      </form>

      {/* Öz Elanlarım Paneli */}
      <div className="card-surface p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-navy/10 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-navy/10 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold font-heading text-navy dark:text-slate-100 flex items-center gap-2">
            <FiHome className="text-copper" /> Mənim Elanlarım ({myListings.length})
          </h2>
          <Link
            href="/listings/add"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-copper hover:underline"
          >
            + Yeni Elan
          </Link>
        </div>

        {listingsLoading ? (
          <p className="text-sm text-navy/60 dark:text-slate-400 py-4 text-center">Elanlar yüklənir...</p>
        ) : myListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-navy/60 dark:text-slate-400 mb-4">Hələ heç bir elanınız yoxdur.</p>
            <Link
              href="/listings/add"
              className="inline-flex items-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-2.5 px-5 text-xs font-bold transition"
            >
              İlk Elanınızı Yerləşdirin
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map((item) => {
              const photoUrl = 
                item.listing_photos?.find(p => (typeof p === "string" ? p : p?.url) && p?.media_type !== "video")?.url ||
                item.image_url ||
                item.cover_image ||
                item.photos?.[0] ||
                "/images/placeholder-property.svg";

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-navy/10 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-3 hover:border-copper/40 transition"
                >
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                    <img 
                      src={photoUrl} 
                      alt={item.title || "Elan"} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.currentTarget.src = "/images/placeholder-property.svg"; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/listings/${item.id}`}
                      className="text-sm font-semibold text-navy dark:text-slate-100 hover:text-copper transition truncate block"
                    >
                      {item.title_az || item.title || "Elan #" + item.id}
                    </Link>
                    <p className="text-xs font-bold text-copper mt-0.5">
                      {Number(item.price || 0).toLocaleString()} {item.currency || "AZN"}
                    </p>
                    <p className="text-[11px] text-navy/40 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <FiEye className="inline" /> {item.views || item.views_count || 0} baxış
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/listings/${item.id}`}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-navy dark:text-slate-200 transition"
                      title="Bax"
                    >
                      <FiEye className="text-sm" />
                    </Link>
                    <Link
                      href={`/listings/${item.id}/edit`}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-navy dark:text-slate-200 transition"
                      title="Redaktə et"
                    >
                      <FiEdit2 className="text-sm" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteListing(item.id)}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                      title="Sil"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Şifrə Dəyişmə Bölməsi */}
      <form onSubmit={handlePasswordUpdate} className="card-surface p-6 sm:p-8 bg-white rounded-2xl shadow-card border border-navy/10 space-y-6">
        <h2 className="text-xl font-bold font-heading text-navy flex items-center gap-2 border-b border-navy/10 pb-4">
          <FiLock className="text-copper" /> Şifrəni Yenilə
        </h2>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Yeni Şifrə</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Yeni Şifrə (Təkrar)</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-navy/15 px-4 py-3 text-sm outline-none text-navy focus:border-copper transition"
          />
        </div>

        <button
          type="submit"
          disabled={updatingPassword}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-3.5 px-4 text-sm font-bold transition shadow-sm"
        >
          <FiLock /> {updatingPassword ? "Yenilənir..." : "Şifrəni Dəyiş"}
        </button>
      </form>

      {/* Hesabdan Çıxış və Hesabı Sil bölməsi */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy py-3 px-4 text-sm font-semibold transition"
        >
          <FiLogOut /> Hesabdan Çıxış
        </button>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 px-4 text-sm font-semibold transition"
        >
          <FiTrash2 /> Hesabı Sil
        </button>
      </div>
    </div>
  );
}