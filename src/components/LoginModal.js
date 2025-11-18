// src/components/LoginModal.js
import React from 'react';

// 1. 新增 onLoginSuccess prop
export default function LoginModal({ onClose, onSwitchToRegister, onLoginSuccess }) {
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // 2. 建立表單提交的處理函式
  const handleLoginSubmit = (e) => {
    e.preventDefault(); // 防止頁面重新載入
    // 這裡可以加入 email/password 的驗證

    
    // 3. 呼叫 onLoginSuccess 通知 App.js
    onLoginSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-background-dark p-8 shadow-lg"
        onClick={handleModalClick}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 transition-colors hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-white">
            登入日光預平台
          </h2>

          {/* 4. 將 <form> 綁定 onSubmit 事件 */}
          <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
            {/* 電子郵件 */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                電子郵件地址
              </label>
              <input
                type="email"
                id="email"
                placeholder="請輸入您的電子郵件"
                className="w-full rounded-lg border-none bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-primary"
                // 為了快速測試，您可以加上 required
                required 
              />
            </div>

            {/* 密碼 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white/80">
                  密碼
                </label>
                <a href="#" className="text-sm text-primary/80 hover:text-primary">
                  忘記密碼？
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  placeholder="請輸入您的密碼"
                  className="w-full rounded-lg border-none bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-primary"
                  // 為了快速測試加上 required
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="material-symbols-outlined text-white/40">
                    visibility
                  </span>
                </div>
              </div>
            </div>

            {/* 登入按鈕 (type="submit") */}
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-primary py-3 text-base font-bold text-background-dark transition-transform hover:scale-105"
            >
              登入
            </button>
          </form>

          {/* 註冊連結 */}
          <p className="text-center text-sm text-white/50">
            還沒有帳號？{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-primary hover:text-primary/80"
            >
              立即註冊
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}