// src/pages/DataCleaning.js
import React, { useState } from 'react';
import Navbar from '../components/Navbar';

// HistogramChart, ScatterChart 維持不變)
const HistogramChart = ({ className = "h-40" }) => (
  <div className={`relative w-full mt-4 ${className}`}>
    <svg className="h-full w-full" viewBox="0 0 300 150" preserveAspectRatio="none">
      <line x1="0" y1="150" x2="300" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <rect x="20" y="100" width="40" height="50" fill="#9ca3af" opacity="0.5" rx="2" />
      <rect x="80" y="40" width="40" height="110" fill="#f2cc0d" opacity="0.8" rx="2" />
      <rect x="140" y="120" width="40" height="30" fill="#9ca3af" opacity="0.5" rx="2" />
      <rect x="200" y="140" width="40" height="10" fill="#9ca3af" opacity="0.5" rx="2" />
      <rect x="260" y="130" width="40" height="20" fill="#9ca3af" opacity="0.5" rx="2" />
    </svg>
    <div className="flex justify-between text-[10px] text-white/40 mt-1 px-2"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span></div>
  </div>
);
const ScatterChart = ({ hasOutliers, removeOutliers, className = "h-40" }) => (
  <div className={`relative w-full mt-4 bg-white/5 rounded p-2 border border-white/5 ${className}`}>
    <svg className="h-full w-full" viewBox="0 0 300 150" preserveAspectRatio="none">
      <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(255,255,255,0.1)" strokeDasharray="4"/>
      <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(255,255,255,0.1)" strokeDasharray="4"/>
      <line x1="0" y1="120" x2="300" y2="120" stroke="rgba(255,255,255,0.1)" strokeDasharray="4"/>
      <line x1="20" y1="140" x2="280" y2="10" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      {[...Array(40)].map((_, i) => (<circle key={i} cx={30 + i * 6 + Math.random()*10} cy={140 - i * 3 + Math.random()*20} r="2" fill="#60a5fa" opacity="0.6" />))}
      {hasOutliers && !removeOutliers && (<><circle cx="60" cy="40" r="3" fill="#ef4444" /><circle cx="120" cy="20" r="3" fill="#ef4444" /><circle cx="240" cy="130" r="3" fill="#ef4444" /><circle cx="260" cy="110" r="3" fill="#ef4444" /></>)}
    </svg>
  </div>
);

// 在參數中加入 onNavigateToSites
export default function DataCleaning({ onBack, onNext, onNavigateToPredict, onNavigateToSites, onLogout }) {
  const [removeOutliers, setRemoveOutliers] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const cards = [
    { title: "發電量分佈", value: "250 kW", sub: "平均值", type: "histogram" },
    { title: "日照強度 vs. 發電量", value: "4.8 kWh/m²", sub: "平均值", type: "scatter", hasOutliers: true },
    { title: "溫度 vs. 發電量", value: "28°C", sub: "平均值", type: "scatter" },
    { title: "每小時發電量分佈", value: "150 kW", sub: "平均值", type: "histogram" },
    { title: "模組溫度 vs. 發電量", value: "45°C", sub: "平均值", type: "scatter", hasOutliers: true },
    { title: "風速 vs. 發電量", value: "3.5 m/s", sub: "平均值", type: "scatter" },
    { title: "晴空指數分佈", value: "0.65", sub: "平均值", type: "histogram" },
    { title: "濕度 vs. 發電量", value: "60%", sub: "平均值", type: "scatter" },
    { title: "壓力 vs. 發電量", value: "1012 hPa", sub: "平均值", type: "scatter" },
  ];

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar 
        activePage="predict"
        onNavigateToDashboard={onNavigateToPredict}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites} // 傳給 Navbar
        onLogout={onLogout}
      />
      
      <div className="w-full border-b border-white/10 bg-white/[.02] px-6 py-3 sticky top-[64px] sm:top-[65px] z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"><span className="material-symbols-outlined !text-lg">arrow_back</span>返回上一步</button>
          <div className="text-sm font-medium"><span className="text-white/40">1. 上傳資料</span><span className="mx-2 text-white/30">/</span><span className="text-primary font-bold">2. 清理資料</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">3. 選擇模型</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">4. 輸出結果</span></div>
        </div>
      </div>
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 py-8 flex flex-col gap-8">
        <div><h1 className="text-3xl font-bold text-white mb-2">數據驗證與離群值處理</h1><p className="text-white/60">Review the data distribution and decide how to handle outliers before training the model.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-white/[.02] p-5 hover:bg-white/[.04] hover:border-primary/30 transition-all cursor-pointer" onClick={() => setSelectedChart(card)}>
              <h3 className="text-sm font-medium text-white/80">{card.title}</h3>
              <div className="mt-1"><span className="text-3xl font-bold text-white">{card.value}</span></div>
              <p className="text-xs text-white/40 mb-2">{card.sub}</p>
              {card.type === 'histogram' ? (<HistogramChart className="h-40" />) : (<ScatterChart hasOutliers={card.hasOutliers} removeOutliers={removeOutliers} className="h-40" />)}
            </div>
          ))}
        </div>
      </main>
      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 backdrop-blur-lg p-4 px-6 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4"><div className="flex flex-col"><span className="text-sm font-bold text-white">離群值處理選項</span><span className="text-xs text-white/50">偵測到 12 個離群點，建議移除。</span></div><button onClick={() => setRemoveOutliers(!removeOutliers)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${removeOutliers ? 'bg-primary' : 'bg-white/20'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${removeOutliers ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
          <div className="flex items-center gap-4"><button onClick={onBack} className="rounded-lg border border-white/10 px-6 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors">返回上一步</button><button onClick={onNext} className="rounded-lg bg-primary px-8 py-2 text-sm font-bold text-background-dark hover:scale-105 transition-transform">下一步</button></div>
        </div>
      </div>
      {selectedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedChart(null)}>
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#1E1E1E] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedChart(null)} className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
            <div className="mb-6"><h2 className="text-2xl font-bold text-white">{selectedChart.title}</h2><p className="text-white/60">詳細數據分析視圖</p></div>
            <div className="mb-6 flex items-baseline gap-3"><span className="text-5xl font-bold text-white">{selectedChart.value}</span><span className="text-lg text-white/40">{selectedChart.sub}</span></div>
            <div className="w-full p-4 bg-black/20 rounded-xl border border-white/5">{selectedChart.type === 'histogram' ? (<HistogramChart className="h-96" />) : (<ScatterChart hasOutliers={selectedChart.hasOutliers} removeOutliers={removeOutliers} className="h-96" />)}</div>
            <p className="mt-6 text-sm text-white/30 text-center">*在下方工具列的設定（如：移除離群值）也會即時反映在此視圖中。</p>
          </div>
        </div>
      )}
    </div>
  );
}