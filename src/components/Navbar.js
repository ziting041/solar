// src/components/Navbar.js
import React, { useState } from 'react';

// 接收新增的 onNavigateToSites prop
export default function Navbar({ activePage, onNavigateToDashboard, onNavigateToPredict, onNavigateToSites, onNavigateToHistory, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getLinkClass = (pageName) => {
    const baseClass = "text-sm font-medium leading-normal transition-colors";
    if (activePage === pageName) {
      return `${baseClass} text-white`;
    }
    return `${baseClass} text-white/70 hover:text-white hover:text-primary`;
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-center border-b border-solid border-white/10 bg-background-dark/80 px-4 py-3 backdrop-blur-sm sm:px-10">
      <div className="flex w-full max-w-7xl items-center justify-between">
        
        <button onClick={onNavigateToDashboard} className="flex items-center gap-2.5 text-white">
          <div className="size-8 overflow-hidden text-primary">
            <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4V20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
            日光預
          </h2>
        </button>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            <button onClick={onNavigateToDashboard} className={getLinkClass('dashboard')}>
              儀表板
            </button>
            
            <button onClick={onNavigateToPredict} className={getLinkClass('predict')}>
              開始預測
            </button>
            
            {/* 綁定 onClick */}
            <button onClick={onNavigateToSites} className={getLinkClass('site')}>
              案場管理
            </button>
            
            <button onClick={onNavigateToHistory} className={getLinkClass('history')}>
              歷史資料
            </button>
          </nav>
          
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:text-white ${isProfileOpen ? 'ring-2 ring-primary text-white' : ''}`}
            >
              <span className="material-symbols-outlined !text-2xl">person</span>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1E1E1E] shadow-xl backdrop-blur-xl">
                  <div className="flex flex-col p-1">
                    <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                      <span className="material-symbols-outlined !text-[20px]">settings</span>
                      設定
                    </button>
                    <div className="my-1 h-px w-full bg-white/10"></div>
                    <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <span className="material-symbols-outlined !text-[20px]">logout</span>
                      登出
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}