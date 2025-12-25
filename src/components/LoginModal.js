import React, { useState, useEffect } from "react";

export default function LoginModal({
  onClose,
  onSwitchToRegister,
  onLoginSuccess,
}) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  // Modal 打開時清空
  useEffect(() => {
    setAccount("");
    setPassword("");
    setMsg("");
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_account: account,
          user_pw: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.detail || "登入失敗");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("user_id", data.user_id);

      onLoginSuccess?.(data);
      onClose();
    } catch {
      setMsg("伺服器連線錯誤");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-background-dark p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70"
        >
          ✕
        </button>

        <h2 className="text-2xl text-white mb-4">登入系統</h2>

        {msg && <p className="text-red-400 mb-2">{msg}</p>}

        {/* ⭐ 關鍵 */}
        <form
          autoComplete="off"
          className="flex flex-col gap-4"
          onSubmit={login}
        >
          <input type="text" style={{ display: "none" }} />

          <div>
            <label className="text-white/80 text-sm">電子信箱</label>
            <input
              type="email"
              autoComplete="off"
              name="login_account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-3 text-white"
              placeholder="請輸入電子信箱"
              required
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">密碼</label>
            <input
              type="password"
              autoComplete="new-password"
              name="login_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-3 text-white"
              placeholder="請輸入密碼"
              required
            />
          </div>

          <button className="mt-4 w-full bg-primary py-3 rounded-lg font-bold">
            登入
          </button>
        </form>

        <p className="text-center text-sm text-white/60 mt-3">
          還沒有帳號？
          <button onClick={onSwitchToRegister} className="text-primary ml-1">
            立即註冊
          </button>
        </p>
      </div>
    </div>
  );
}
