"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { FiUser, FiSave, FiLogOut, FiTrash2, FiLock } from "react-icons/fi";

export default function ProfilePage() {
  const { user, supabase } = useApp();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    agency_name: "RF Master Sales Agency",
  });

  // Şifrə dəyişmə state-ləri
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          agency_name: data.agency_name || "RF Master Sales Agency",
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, supabase, router]);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listings-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("listings-media").getPublicUrl(filePath);
      setForm({ ...form, avatar_url: data.publicUrl });
      alert("Profil şəkli yükləndi!");
    } catch (error) {
      alert("Şəkil yüklənərkən xəta: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        avatar_url: form.avatar_url,
        agency_name: form.agency_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert("Yenilənmə xətası: " + error.message);
    } else {
      alert("Profil uğurla yeniləndi!");
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
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Hesabınızı silmək istədiyinizə əminsinizmi? Bu əməliyyat geri qaytarılmır!")) {
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/");
      alert("Hesabınız silindi.");
    }
  };

  if (loading) {
    return <div className="py-32 text-center text-navy font-medium">Profil yüklənir...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold font-heading text-navy flex items-center gap-2">
        <FiUser className="text-copper" /> Profil Məlumatları
      </h1>

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

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy text-white hover:bg-copper py-3.5 px-4 text-sm font-bold transition shadow-sm"
        >
          <FiSave /> {saving ? "Yadda saxlanılır..." : "Dəyişiklikləri Yadda Saxla"}
        </button>
      </form>

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