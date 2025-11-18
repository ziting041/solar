// src/pages/StartPredict.js
import React, { useState } from 'react';
import Navbar from '../components/Navbar';

// 在參數中加入 onNavigateToSites
export default function StartPredict({ onBack, onNext, onNavigateToPredict, onNavigateToSites, onLogout }) {
  const [activeTab, setActiveTab] = useState('existing');
  const [file, setFile] = useState(null);
  const handleFileUpload = () => { setFile({ name: 'site_data_2023_final.csv', size: '1.2 MB', status: '上傳成功' }); };
  const handleRemoveFile = () => { setFile(null); };

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar 
        activePage="predict"
        onNavigateToDashboard={onBack}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites} // 傳給 Navbar
        onLogout={onLogout}
      />
      
      <div className="w-full border-b border-white/10 bg-white/[.02] px-6 py-3 sticky top-[64px] sm:top-[65px] z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"><span className="material-symbols-outlined !text-lg">arrow_back</span>返回儀表板</button>
          <div className="text-sm font-medium"><span className="text-primary font-bold">1. 上傳資料</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">2. 清理資料</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">3. 選擇模型</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">4. 輸出結果</span></div>
        </div>
      </div>
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-white">開始建立您的發電量預測模型</h1>
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">步驟一：選擇或建立案場</h2>
          <div className="flex flex-col gap-6">
            <div className="flex rounded-lg bg-white/5 p-1 w-full">
              <button onClick={() => setActiveTab('existing')} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'existing' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}>選擇現有案場</button>
              <button onClick={() => setActiveTab('new')} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'new' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}>建立新案場資料</button>
            </div>
            <div>
              {activeTab === 'existing' ? (
                <div className="relative">
                  <select className="w-full appearance-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>陽光一號發電廠</option><option>永續二號案場</option><option>追日三號</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50"><span className="material-symbols-outlined">expand_more</span></div>
                </div>
              ) : (
                <div><input type="text" placeholder="請輸入新案場名稱" className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /><p className="mt-2 text-xs text-white/40">* 此名稱將用於之後的報告與管理</p></div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">步驟二：上傳數據檔案</h2>
          <div className="relative mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[.01] py-12 text-center transition-colors hover:border-primary/50 hover:bg-white/[.03]">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary"><span className="material-symbols-outlined !text-4xl">cloud_upload</span></div>
            <p className="text-lg font-medium text-white mb-1">將檔案拖曳至此，或點擊瀏覽</p>
            <p className="text-sm text-white/40 mb-6">支援格式：.xslv, .csv</p>
            <button onClick={handleFileUpload} className="rounded-lg border border-primary text-primary hover:bg-primary hover:text-background-dark px-6 py-2 text-sm font-bold transition-all">瀏覽檔案</button>
          </div>
          {file && (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4 mt-4 animate-pulse-once">
              <div className="flex items-center gap-4"><div className="flex size-10 items-center justify-center rounded-full bg-green-500/20 text-green-500"><span className="material-symbols-outlined">check_circle</span></div><div><p className="text-sm font-bold text-white">{file.name}</p><p className="text-xs text-white/50">{file.size} • {file.status}</p></div></div>
              <button onClick={handleRemoveFile} className="text-white/40 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
          )}
        </div>
      </main>
      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 backdrop-blur-lg p-4 px-6 z-40">
         <div className="w-full max-w-4xl mx-auto flex justify-end">
           <button onClick={onNext} className="flex items-center justify-center rounded-lg bg-primary px-8 py-2 text-base font-bold text-background-dark transition-transform hover:scale-105">下一步</button>
         </div>
      </div>
    </div>
  );
}