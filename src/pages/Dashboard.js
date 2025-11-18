// src/pages/Dashboard.js
import React from 'react';
import Navbar from '../components/Navbar';

// --- 升級版圖表佔位符 ---
const PlaceholderChart = () => (
  <div className="aspect-[16/7] w-full relative">
    <svg className="w-full h-full text-white" fill="none" viewBox="0 0 528 172" xmlns="http://www.w3.org/2000/svg">
      <text x="5" y="15" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="500">發電量 (kWh)</text>
      <g opacity="0.15">
        <line x1="1" y1="171.5" x2="527" y2="171.5" stroke="currentColor"/>
        <line x1="1" y1="128.5" x2="527" y2="128.5" stroke="currentColor"/>
        <line x1="1" y1="85.5" x2="527" y2="85.5" stroke="currentColor"/>
        <line x1="1" y1="42.5" x2="527" y2="42.5" stroke="currentColor"/>
        <line x1="1" y1="-0.5" x2="527" y2="-0.5" stroke="currentColor"/>
      </g>
      <g opacity="0.3">
        <line x1="59.5" y1="172" x2="59.5" y2="167" stroke="currentColor"/>
        <line x1="118.5" y1="172" x2="118.5" y2="167" stroke="currentColor"/>
        <line x1="177.5" y1="172" x2="177.5" y2="167" stroke="currentColor"/>
        <line x1="236.5" y1="172" x2="236.5" y2="167" stroke="currentColor"/>
        <line x1="295.5" y1="172" x2="295.5" y2="167" stroke="currentColor"/>
        <line x1="353.5" y1="172" x2="353.5" y2="167" stroke="currentColor"/>
        <line x1="412.5" y1="172" x2="412.5" y2="167" stroke="currentColor"/>
        <line x1="471.5" y1="172" x2="471.5" y2="167" stroke="currentColor"/>
      </g>
      <path d="M1 172 L1 80 Q 59 60 118 100 Q 177 80 236 90 Q 295 50 353 60 Q 412 30 471 40 L 527 10 L 527 172 Z" fill="white" fillOpacity="0.05"/>
      <path d="M1 66.5L59.7778 57.5L118.556 94L177.333 66.5L236.111 79.5L294.889 42L353.667 48.5L412.444 24L471.222 33L527 1" stroke="#f2cc0d" strokeWidth="2.5"/>
      <text x="59.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/21</text>
      <text x="118.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/22</text>
      <text x="177.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/23</text>
      <text x="236.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/24</text>
      <text x="295.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/25</text>
      <text x="353.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/26</text>
      <text x="412.5" y="165" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">5/27</text>
      <text x="500" y="165" fontSize="10" fill="rgba(255,255,255,0.5)" textAnchor="end">日期</text>
    </svg>
    <div className="absolute top-2 right-2 flex gap-3">
       <div className="flex items-center gap-1 text-[10px] text-white/40"><div className="w-3 h-3 bg-white/10 rounded-sm"></div> 日照量</div>
       <div className="flex items-center gap-1 text-[10px] text-primary"><div className="w-3 h-1 bg-primary rounded-full"></div> 發電量</div>
    </div>
  </div>
);

// 在這裡接收 onOpenCreateSite
export default function Dashboard({ onLogout, onNavigateToPredict, onNavigateToDashboard, onNavigateToSites, onOpenCreateSite }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar 
        activePage="dashboard"
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      <main className="flex flex-1 flex-col items-center p-4 sm:p-10">
        <div className="w-full max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold text-white">儀表板</h1><p className="text-sm text-white/60">我的案場概況</p></div>
            
            {/*在這裡綁定 onOpenCreateSite */}
            <button 
              onClick={onOpenCreateSite} 
              className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105"
            >
              <span className="material-symbols-outlined !text-xl">add</span>
              <span className="truncate">新增案場</span>
            </button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-grow flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-white">向陽一號</h3><p className="text-sm text-white/60">嘉義縣太保市</p></div><span className="rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-medium text-green-400">運轉中</span></div><div className="flex items-end justify-between"><div><p className="text-sm text-white/60">裝置容量</p><p className="text-3xl font-bold text-white">499 <span className="text-xl">kWp</span></p></div><div><p className="text-sm text-white/60 text-right">今日預測</p><p className="text-xl font-bold text-white">1,823 <span className="text-base">kWh</span></p></div><div><p className="text-sm text-white/60 text-right">狀態</p><p className="text-xl font-bold text-green-400">良好</p></div></div></div>
                <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-white">永續二號</h3><p className="text-sm text-white/60">台南市七股區</p></div><span className="rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-medium text-green-400">運轉中</span></div><div className="flex items-end justify-between"><div><p className="text-sm text-white/60">裝置容量</p><p className="text-3xl font-bold text-white">1.2 <span className="text-xl">MWp</span></p></div><div><p className="text-sm text-white/60 text-right">今日預測</p><p className="text-xl font-bold text-white">4,350 <span className="text-base">kWh</span></p></div><div><p className="text-sm text-white/60 text-right">狀態</p><p className="text-xl font-bold text-green-400">良好</p></div></div></div>
                <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-white">追日三號</h3><p className="text-sm text-white/60">屏東縣林邊鄉</p></div><span className="rounded-full bg-yellow-500/20 px-3 py-0.5 text-xs font-medium text-yellow-400">維護中</span></div><div className="flex items-end justify-between"><div><p className="text-sm text-white/60">裝置容量</p><p className="text-3xl font-bold text-white">850 <span className="text-xl">kWp</span></p></div><div><p className="text-sm text-white/60 text-right">今日預測</p><p className="text-xl font-bold text-white">-- <span className="text-base">kWh</span></p></div><div><p className="text-sm text-white/60 text-right">狀態</p><p className="text-xl font-bold text-yellow-400">注意</p></div></div></div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center justify-between"><div className="flex items-baseline gap-3"><h3 className="text-xl font-bold text-white">發電趨勢分析</h3><span className="text-xs text-white/40">結合日照與天氣資訊</span></div><button className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20">向陽一號<span className="material-symbols-outlined !text-xl">expand_more</span></button></div><PlaceholderChart /></div>
            </div>
            <div className="flex w-full flex-col gap-6 lg:w-80 xl:w-96 lg:flex-shrink-0">
              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.03] p-6"><h3 className="text-base font-medium text-white/80">最佳歷史預測準確度</h3><div className="text-center"><p className="text-6xl font-bold text-green-400">98.7<span className="text-5xl">%</span></p><p className="text-sm text-white/60">準確度 (MAPE)</p></div><div className="text-sm text-white/70 border-t border-white/10 pt-4 mt-2"><div className="flex justify-between mb-1"><span>案場</span><span className="text-white">向陽一號</span></div><div className="flex justify-between mb-1"><span>日期</span><span className="text-white">2024-05-20</span></div><div className="flex justify-between"><span>模型</span><span className="text-primary">LSTM-v3</span></div></div></div>
              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-green-900/20 to-white/[.03] p-6"><h3 className="text-base font-medium text-white/80 flex items-center gap-2"><span className="material-symbols-outlined text-green-400">eco</span>環境減碳效益 (本週)</h3><div className="flex items-center gap-4"><div><p className="text-3xl font-bold text-white">2,450 <span className="text-lg font-normal text-white/60">kgCO₂e</span></p><div className="flex items-center gap-2 mt-2 text-green-300 bg-green-500/10 px-3 py-1.5 rounded-lg"><span className="material-symbols-outlined !text-lg">forest</span><p className="text-sm font-bold">相當於種植 205 棵樹</p></div></div></div></div>
              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.03] p-6"><div className="flex justify-between items-end"><h3 className="text-xl font-bold text-white">發電量排名 (昨日)</h3><span className="text-[10px] text-white/40">效率 (kWh/kWp)</span></div><div className="flex flex-col gap-6 mt-2"><div className="flex items-center gap-3"><div className="flex flex-col items-center justify-center size-8 bg-yellow-500/20 text-yellow-500 rounded-lg font-bold">1</div><div className="flex-grow"><div className="flex justify-between items-center mb-1.5"><p className="text-sm font-bold text-white">追日三號</p><div className="text-right"><span className="text-sm font-bold text-white block">3,378 <span className="text-xs text-white/50">kWh</span></span><span className="text-xs text-primary font-mono">3.97 kWp</span></div></div><div className="h-2.5 w-full rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: '100%' }}></div></div></div></div><div className="flex items-center gap-3"><div className="flex flex-col items-center justify-center size-8 bg-white/10 text-white/70 rounded-lg font-bold">2</div><div className="flex-grow"><div className="flex justify-between items-center mb-1.5"><p className="text-sm font-bold text-white">向陽一號</p><div className="text-right"><span className="text-sm font-bold text-white block">1,854 <span className="text-xs text-white/50">kWh</span></span><span className="text-xs text-primary font-mono">3.71 kWp</span></div></div><div className="h-2.5 w-full rounded-full bg-white/10"><div className="h-full rounded-full bg-primary/70" style={{ width: '93%' }}></div></div></div></div><div className="flex items-center gap-3"><div className="flex flex-col items-center justify-center size-8 bg-white/10 text-white/70 rounded-lg font-bold">3</div><div className="flex-grow"><div className="flex justify-between items-center mb-1.5"><p className="text-sm font-medium text-white">永續二號</p><div className="text-right"><span className="text-sm font-bold text-white block">4,120 <span className="text-xs text-white/50">kWh</span></span><span className="text-xs text-white/40 font-mono">3.43 kWp</span></div></div><div className="h-2.5 w-full rounded-full bg-white/10"><div className="h-full rounded-full bg-white/30" style={{ width: '86%' }}></div></div></div></div></div></div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-24 flex w-full justify-center border-t border-solid border-white/10">
        <div className="flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-10">
          <p className="text-white/50 text-sm">© 2025 日光預. All rights reserved.</p>
          <div className="flex items-center gap-6"><a className="text-white/50 hover:text-white/80 text-sm font-normal leading-normal transition-colors" href="#">服務條款</a><a className="text-white/50 hover:text-white/80 text-sm font-normal leading-normal transition-colors" href="#">隱私權政策</a></div>
        </div>
      </footer>
    </div>
  );
}