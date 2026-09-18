"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { FiUpload, FiVideo, FiX, FiLoader } from "react-icons/fi";

/**
 * DİQQƏT — Əvvəlki versiyada bu komponent:
 * 1) "images" / "setImages" adlı props qəbul edirdi, amma AddListingPage
 *    ona "files" / "setFiles" göndərirdi -> setImages undefined olduğu üçün
 *    şəkil seçəndə "setImages is not a function" xətası verirdi.
 * 2) Faylları HEÇ VAXT Supabase Storage-a yükləmirdi — sadəcə
 *    URL.createObjectURL() ilə brauzerin öz yaddaşında müvəqqəti keçid
 *    yaradırdı. Bu keçidlər səhifə yenilənəndə itir və backend-ə real
 *    şəkil ünvanı kimi ötürülmürdü (elan yaradılanda şəkilsiz qalırdı).
 * 3) "video" tipini dəstəkləmirdi — accept və label props-larını qəbul
 *    etmirdi, hər zaman "Şəkil seç" yazırdı və video faylını <img> kimi
 *    göstərməyə çalışırdı.
 *
 * Bu versiya faylları həqiqətən Supabase Storage-a ("listings-media"
 * bucket-i, ProfilePage-dəki avatar yükləməsi ilə eyni bucket) yükləyir,
 * hər faylı {url, path, name, type} formatında saxlayır və
 * AddListingPage-in gözlədiyi files/setFiles props-larına uyğundur.
 * Süni fayl sayı/ölçü limiti qoyulmayıb.
 */
export default function MediaUploader({ files = [], setFiles, accept = "image/*", type = "image", label }) {
  const { supabase, user } = useApp();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setUploading(true);
    setUploadError("");

    try {
      const uploaded = [];

      for (const file of selected) {
        const fileExt = file.name.split(".").pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const folder = type === "video" ? "videos" : "images";
        const filePath = `listings/${user?.id || "guest"}/${folder}/${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from("listings-media")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) {
          throw uploadErr;
        }

        const { data } = supabase.storage.from("listings-media").getPublicUrl(filePath);

        uploaded.push({ url: data.publicUrl, path: filePath, name: file.name, type });
      }

      setFiles((prev) => [...(prev || []), ...uploaded]);
    } catch (err) {
      console.error(err);
      setUploadError("Fayl yüklənərkən xəta: " + (err.message || "Naməlum xəta"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => (prev || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-semibold text-navy">{label}</label>}

      <div className="flex flex-wrap gap-4">
        {(files || []).map((file, index) => {
          const url = file?.url || file;
          return (
            <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-navy/10 shadow-sm bg-slate-100">
              {type === "video" ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 transition-all"
              >
                <FiX />
              </button>
            </div>
          );
        })}

        <label
          className={`w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-navy/20 rounded-xl bg-slate-50 hover:border-gold hover:bg-gold-50/20 transition-all text-navy/60 ${
            uploading ? "opacity-60 cursor-wait" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <FiLoader className="text-xl mb-1 text-copper animate-spin" />
          ) : type === "video" ? (
            <FiVideo className="text-xl mb-1 text-copper" />
          ) : (
            <FiUpload className="text-xl mb-1 text-copper" />
          )}
          <span className="text-[10px] font-medium text-center px-1">
            {uploading ? "Yüklənir..." : type === "video" ? "Video seç" : "Şəkil seç"}
          </span>
          <input
            type="file"
            multiple
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {uploadError && <p className="text-xs text-red-500 font-medium">⚠️ {uploadError}</p>}
    </div>
  );
}
