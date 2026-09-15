"use client";

import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

export default function MediaUploader({ images = [], setImages }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...(prev || []), ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => (prev || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {(images || []).map((img, index) => (
          <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-navy/10 shadow-sm">
            <img src={img} alt="Uploaded" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 transition-all"
            >
              <FiX />
            </button>
          </div>
        ))}

        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-navy/20 rounded-xl cursor-pointer bg-slate-50 hover:border-gold hover:bg-gold-50/20 transition-all text-navy/60">
          <FiUpload className="text-xl mb-1 text-copper" />
          <span className="text-[10px] font-medium">Şəkil seç</span>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  );
}