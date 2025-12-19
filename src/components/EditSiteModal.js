// components/EditSiteModal.js
import React, { useState } from "react";

export default function EditSiteModal({ site, onClose, onSubmit }) {
  const [form, setForm] = useState({
    site_name: site.site_name || "",
    site_code: site.site_code || "",
    location: site.location || "",
  });

  const handleSubmit = () => {
    onSubmit({
      site_id: site.site_id,
      site_name: form.site_name,
      site_code: form.site_code,
      location: form.location,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#1E1E1E] rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">編輯案場</h2>

        {/* 案場名稱 */}
        <div className="mb-4">
          <label className="block text-sm text-white/60 mb-1">
            案場名稱（site_name）
          </label>
          <input
            type="text"
            value={form.site_name}
            onChange={(e) =>
              setForm({ ...form, site_name: e.target.value })
            }
            className="w-full rounded-md bg-black/40 border border-white/20 px-3 py-2"
          />
        </div>

        {/* 案場代碼 */}
        <div className="mb-4">
          <label className="block text-sm text-white/60 mb-1">
            案場代碼（site_code）
          </label>
          <input
            type="text"
            value={form.site_code}
            onChange={(e) =>
              setForm({ ...form, site_code: e.target.value })
            }
            className="w-full rounded-md bg-black/40 border border-white/20 px-3 py-2 font-mono"
          />
        </div>

        {/* 案場地址 */}
        <div className="mb-6">
          <label className="block text-sm text-white/60 mb-1">
            案場地址（location）
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            className="w-full rounded-md bg-black/40 border border-white/20 px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary rounded font-bold"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}
