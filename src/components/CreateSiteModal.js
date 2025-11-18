// src/components/CreateSiteModal.js
import React, { useState } from 'react';

export default function CreateSiteModal({ onClose, onSubmit }) {
  // 防止點擊內部時關閉
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // 表單狀態 (未來要接後端 API 可用)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = () => {
    // 這裡可以加入驗證邏輯
    if (!formData.name || !formData.location) {
      alert("請填寫完整資訊");
      return;
    }
    onSubmit(formData); // 將資料傳回 App.js 處理
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md transform rounded-xl border border-white/10 bg-[#1E1E1E] p-6 shadow-2xl transition-all"
        onClick={handleModalClick}
      >
        {/* 標題與關閉按鈕 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">建立新的案場</h2>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 表單內容 */}
        <div className="flex flex-col gap-4">
          
          {/* 案場名稱 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-white/80">
              案場名稱
            </label>
            <input 
              type="text" 
              id="name" 
              placeholder="請輸入案場名稱"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* 地點 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="location" className="text-sm font-medium text-white/80">
              地點
            </label>
            <input 
              type="text" 
              id="location" 
              placeholder="例如：嘉義縣太保市"
              value={formData.location}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* 裝置容量 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="capacity" className="text-sm font-medium text-white/80">
              裝置容量 (kWp)
            </label>
            <input 
              type="number" 
              id="capacity" 
              placeholder="請輸入數字"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

        </div>

        {/* 底部按鈕 */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSubmit}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background-dark hover:scale-105 transition-transform"
          >
            確認新增
          </button>
        </div>

      </div>
    </div>
  );
}