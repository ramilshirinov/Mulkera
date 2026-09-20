// FAYL YOLU: components/MediaUploader.jsx
"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { FiUpload, FiVideo, FiX, FiLoader } from "react-icons/fi";

/**
 * Faylları Supabase Storage-a ("listings-media" bucket-i) yükləyir və
 * hər faylı { url, path, name, type } formatında files massivinə əlavə edir.
 * Props: files, setFiles, accept, type ("image" | "video"), label
 */
export default function MediaUploader({
  files = [],
  setFiles,
  accept = "image/*",
  type = "image",
  label,
}) {
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

        if (uploadErr) throw uploadErr;

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
      {label && (
        <label className="block text-sm font-semibold text-navy dark:text-slate-200">
          {label}
        </label>
      )}

      <div className="flex flex-wrap gap-4">
        {(files || []).map((file, index) => {
          const url = file?.url || file;
          return (
            <div
              key={`${url}-${index}`}
              className="relative h-24 w-24 overflow-hidden rounded-xl border border-navy/10 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {type === "video" ? (
                <video src={url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Yüklənmiş fayl" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label="Faylı sil"
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-xs text-white transition-all hover:bg-red-600"
              >
                <FiX />
              </button>
            </div>
          );
        })}

        <label
          className={`flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy/20 bg-slate-50 text-navy/60 transition-all hover:border-gold hover:bg-gold-50/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-copper dark:hover:bg-slate-700 ${
            uploading ? "cursor-wait opacity-60" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <FiLoader className="mb-1 animate-spin text-xl text-copper" />
          ) : type === "video" ? (
            <FiVideo className="mb-1 text-xl text-copper" />
          ) : (
            <FiUpload className="mb-1 text-xl text-copper" />
          )}
          <span className="px-1 text-center text-[10px] font-medium">
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

      {uploadError && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">⚠️ {uploadError}</p>
      )}
    </div>
  );
}
