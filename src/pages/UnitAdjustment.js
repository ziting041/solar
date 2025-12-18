// src/pages/UnitAdjustment.js
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function UnitAdjustment({
  onBack,
  onNext,
  onNavigateToPredict,
  onNavigateToSites,
  onLogout
}) {
  const [selectedUnit, setSelectedUnit] = useState('kWh/m²');

  // 🔥 真實資料：第一筆原始日照值（來自資料庫）
  const [rawValue, setRawValue] = useState(null);

  const units = ['kWh/m²', 'MJ/m²', 'Wh/m²'];

  const unitInfo = {
    'kWh/m²': {
      title: '千瓦時 / 平方公尺',
      description: '太陽能產業界最通用的標準單位，常用於描述每日或每月的累積日照量。',
      impact: '✅ 推薦選項：如果您的數據來源是一般逆變器或案場監控系統，通常預設為此單位。模型將直接使用數值進行訓練。',
      conversion: '1 kWh/m² = 3.6 MJ/m²'
    },
    'MJ/m²': {
      title: '百萬焦耳 / 平方公尺',
      description: '氣象學與科學研究常用的國際標準單位 (SI)，台灣氣象局 (CWB) 的觀測資料常使用此單位。',
      impact: '⚠️ 注意：若選錯，數值會相差 3.6 倍。系統會自動將其轉換為 kWh 以配合 AI 模型運算。',
      conversion: '1 MJ/m² ≈ 0.28 kWh/m²'
    },
    'Wh/m²': {
      title: '瓦時 / 平方公尺',
      description: '較小單位的日照量，通常用於高頻率（如每分鐘）的日照數據紀錄。',
      impact: '⚠️ 注意：這是較小的單位。若未正確選擇，預測結果可能會被放大 1000 倍。',
      conversion: '1000 Wh/m² = 1 kWh/m²'
    }
  };

  /* =========================
     🔥 從「資料庫」取得最新一筆資料
     （不再讀 CSV、不用 solar_data）
  ========================= */
  useEffect(() => {
    fetch('http://localhost:8000/api/data/latest-from-db')
      .then(res => res.json())
      .then(data => {
        const firstRow = data?.rows?.[0];
        if (!firstRow) return;

        // 🔥 只抓 GI 欄位（避免抓到 TM）
        const giKey = Object.keys(firstRow).find(key =>
          key.toLowerCase().includes('gi') ||
          key.toLowerCase().includes('irradiance') ||
          key.toLowerCase().includes('ghi')
        );

        if (!giKey) {
          console.error('❌ 找不到 GI 欄位:', firstRow);
          return;
        }

        const giValue = firstRow[giKey];

        if (typeof giValue === 'number' && !isNaN(giValue)) {
          setRawValue(giValue);
        } else {
          console.error('❌ GI 欄位不是數值:', giKey, giValue);
        }
      })
      .catch(err => {
        console.error('讀取資料庫資料失敗:', err);
      });
  }, []);

  /* =========================
     🔥 單位轉換 → kWh/m²
  ========================= */
  const convertToKWh = (value, unit) => {
    if (value == null) return null;

    switch (unit) {
      case 'MJ/m²':
        return value / 3.6;
      case 'Wh/m²':
        return value / 1000;
      default:
        return value;
    }
  };

  const convertedValue = convertToKWh(rawValue, selectedUnit);

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar
        activePage="predict"
        onNavigateToDashboard={onNavigateToPredict}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      {/* Sticky Header */}
      <div className="w-full border-b border-white/10 bg-white/[.02] px-6 py-3 sticky top-[64px] sm:top-[65px] z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined !text-lg">arrow_back</span>
            返回上一步
          </button>

          <div className="text-sm font-medium">
            <span className="text-white/40">1. 上傳資料</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">2. 清理資料</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-primary font-bold">3. 調整單位</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">4. 模型訓練與優化</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">5. 輸出結果</span>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 py-12 flex flex-col justify-center">
        <div className="w-full mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">確認日照量單位</h1>
          <p className="text-white/60">
            系統偵測到您的數據欄位包含日照數值，請確認其原始單位以進行標準化處理。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* 左欄 */}
          <div className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-white/[.02] p-8">
            <div className="text-center py-4">
              <p className="text-white/40 text-sm mb-2">第一筆資料（轉換後）</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black text-white tracking-tight">
                  {convertedValue == null ? '--' : convertedValue.toFixed(2)}
                </span>
                <span className="text-2xl font-bold text-primary">
                  kWh/m²
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-white/80">請選擇原始數據中的單位：</p>
              <div className="grid grid-cols-3 gap-2">
                {units.map(unit => (
                  <button
                    key={unit}
                    onClick={() => setSelectedUnit(unit)}
                    className={`py-4 text-sm font-bold rounded-lg transition-all border ${
                      selectedUnit === unit
                        ? 'bg-primary text-background-dark border-primary shadow-lg scale-105'
                        : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右欄（完全不動） */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-6 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {unitInfo[selectedUnit].title}
                  </h3>
                  <p className="text-xs text-white/40 font-mono">
                    {selectedUnit}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">單位定義</h4>
                  <p className="text-white/80 leading-relaxed text-sm">
                    {unitInfo[selectedUnit].description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">選擇此項的影響</h4>
                  <div className={`text-sm p-3 rounded-lg border ${
                    selectedUnit === 'kWh/m²'
                      ? 'bg-green-500/10 border-green-500/20 text-green-200'
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'
                  }`}>
                    {unitInfo[selectedUnit].impact}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/40">換算參考</span>
                  <span className="text-sm font-mono text-primary">
                    {unitInfo[selectedUnit].conversion}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-2">
              <span className="material-symbols-outlined text-white/30 text-xl">help</span>
              <p className="text-xs text-white/40 leading-relaxed">
                如果不確定您的數據單位，請查閱您的逆變器規格書或氣象站數據來源說明。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 backdrop-blur-lg p-4 px-6 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-4">
          <button onClick={onBack} className="rounded-lg border border-white/10 px-6 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors">
            返回上一步
          </button>
          <button onClick={onNext} className="flex items-center justify-center rounded-lg bg-primary px-8 py-2 text-base font-bold text-background-dark transition-transform hover:scale-105">
            確認並繼續
          </button>
        </div>
      </div>
    </div>
  );
}
