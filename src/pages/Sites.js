// src/pages/Sites.js
import React, { useState } from 'react';
import Navbar from '../components/Navbar';

// 接收 onOpenCreateSite
export default function Sites({ onNavigateToDashboard, onNavigateToPredict, onNavigateToSites, onLogout, onOpenCreateSite }) {
  // 模擬案場資料
  const [sites, setSites] = useState([
    {
      id: 1,
      name: '向陽一號',
      location: '嘉義縣太保市',
      createdDate: '2023/05/20',
      operator: 'Admin',
      predictCount: 12,
      lastPredict: '2024/01/15',
      history: [
        { date: '2024/01/15', model: 'LSTM', result: '1,823 kWh' },
        { date: '2024/01/14', model: 'XGBoost', result: '1,750 kWh' },
      ]
    },
    {
      id: 2,
      name: '永續二號',
      location: '台南市七股區',
      createdDate: '2023/08/12',
      operator: 'Manager_01',
      predictCount: 8,
      lastPredict: '2024/01/14',
      history: [
        { date: '2024/01/14', model: 'LSTM', result: '4,350 kWh' },
      ]
    },
    {
      id: 3,
      name: '追日三號',
      location: '屏東縣林邊鄉',
      createdDate: '2023/11/05',
      operator: 'Admin',
      predictCount: 5,
      lastPredict: '2024/01/10',
      history: [
        { date: '2024/01/10', model: 'RandomForest', result: '3,100 kWh' },
        { date: '2024/01/09', model: 'LSTM', result: '3,050 kWh' },
      ]
    },
  ]);

  const [expandedSiteId, setExpandedSiteId] = useState(null);
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);

  const toggleExpand = (id) => {
    if (expandedSiteId === id) {
      setExpandedSiteId(null); 
    } else {
      setExpandedSiteId(id); 
    }
  };

  const toggleSelect = (id) => {
    if (selectedSiteIds.includes(id)) {
      setSelectedSiteIds(selectedSiteIds.filter(siteId => siteId !== id));
    } else {
      setSelectedSiteIds([...selectedSiteIds, id]);
    }
  };

  const handleBatchDelete = () => {
    const confirmDelete = window.confirm(`確定要刪除選取的 ${selectedSiteIds.length} 個案場嗎？此動作無法復原。`);
    if (confirmDelete) {
      setSites(sites.filter(site => !selectedSiteIds.includes(site.id)));
      setSelectedSiteIds([]); 
    }
  };

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      {/* 1. Navbar */}
      <Navbar 
        activePage="site" 
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      {/* 2. 主要內容 */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 py-10">
        
        {/* 標題與新增按鈕 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">我的案場管理</h1>
          
          {/* 加上 onClick={onOpenCreateSite} */}
          <button 
            onClick={onOpenCreateSite}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background-dark transition-transform hover:scale-105"
          >
            <span className="material-symbols-outlined !text-xl">add</span>
            新增案場
          </button>
        </div>

        {/* 案場列表 */}
        <div className="flex flex-col gap-4">
          {sites.map((site) => (
            <div 
              key={site.id} 
              className={`rounded-xl border transition-all duration-300 ${
                expandedSiteId === site.id 
                  ? 'border-primary/50 bg-white/[.02]' 
                  : 'border-white/10 bg-white/[.01] hover:bg-white/[.03]'
              }`}
            >
              {/* 卡片標頭 */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-6">
                  {/* Checkbox */}
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedSiteIds.includes(site.id)}
                      onChange={() => toggleSelect(site.id)}
                      className="peer size-5 cursor-pointer appearance-none rounded border border-white/30 bg-transparent checked:border-primary checked:bg-primary transition-all"
                    />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark opacity-0 peer-checked:opacity-100 material-symbols-outlined !text-base font-bold">check</span>
                  </div>

                  {/* Icon & Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined !text-3xl">solar_power</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{site.name}</h3>
                      <p className="text-sm text-white/50">{site.location}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex size-10 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                    <span className="material-symbols-outlined !text-xl">edit</span>
                  </button>
                  <button 
                    onClick={() => toggleExpand(site.id)}
                    className={`flex size-10 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-transform duration-300 ${expandedSiteId === site.id ? 'rotate-180 text-white' : ''}`}
                  >
                    <span className="material-symbols-outlined !text-2xl">expand_more</span>
                  </button>
                </div>
              </div>

              {/* 展開內容 */}
              {expandedSiteId === site.id && (
                <div className="border-t border-white/10 bg-white/[.02] p-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                    <div>
                      <p className="text-xs text-white/40 mb-1">建立日期</p>
                      <p className="text-sm text-white font-mono">{site.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">建立者帳號</p>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-sm text-white/40">person</span>
                        <p className="text-sm text-white">{site.operator}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">累計預測次數</p>
                      <p className="text-sm text-white font-mono">{site.predictCount} 次</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/40 mb-3">最近預測紀錄</p>
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-white/50 text-xs">
                          <tr>
                            <th className="px-4 py-2 font-medium">日期</th>
                            <th className="px-4 py-2 font-medium">使用模型</th>
                            <th className="px-4 py-2 font-medium text-right">預測結果</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {site.history.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="px-4 py-2 font-mono">{row.date}</td>
                              <td className="px-4 py-2">{row.model}</td>
                              <td className="px-4 py-2 text-right font-mono text-primary">{row.result}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                     <button className="px-4 py-2 rounded border border-white/10 text-xs text-white/60 hover:text-red-400 hover:border-red-400/50 transition-colors">
                        刪除案場
                     </button>
                     <button 
                       onClick={onNavigateToPredict}
                       className="px-4 py-2 rounded bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-colors flex items-center gap-2"
                     >
                        以此案場開始預測
                        <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                     </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="mt-24 flex w-full justify-center border-t border-solid border-white/10">
        <div className="flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-10">
          <p className="text-white/50 text-sm">© 2024 日光預. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="text-white/50 hover:text-white/80 text-sm font-normal leading-normal transition-colors" href="#">服務條款</a>
            <a className="text-white/50 hover:text-white/80 text-sm font-normal leading-normal transition-colors" href="#">隱私權政策</a>
          </div>
        </div>
      </footer>

      {/* 4. Sticky Footer */}
      {selectedSiteIds.length > 0 && (
        <div className="sticky bottom-0 w-full border-t border-white/10 bg-[#1E1E1E] p-4 px-6 z-40 shadow-2xl animate-slide-up">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
             <div className="text-sm text-white">
               已選取 <span className="text-primary font-bold mx-1">{selectedSiteIds.length}</span> 個案場
             </div>
             
             {selectedSiteIds.length > 1 ? (
               <button 
                 onClick={handleBatchDelete}
                 className="flex items-center justify-center gap-2 rounded-lg border border-red-500/50 text-red-400 px-6 py-2 text-sm font-bold hover:bg-red-500/10 transition-colors"
               >
                 <span className="material-symbols-outlined !text-lg">delete</span>
                 批次刪除
               </button>
             ) : (
               <button 
                 onClick={onNavigateToPredict}
                 className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-background-dark transition-transform hover:scale-105"
               >
                 <span className="material-symbols-outlined !text-lg">play_arrow</span>
                 開始預測
               </button>
             )}
           </div>
        </div>
      )}
    </div>
  );
}