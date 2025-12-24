import React, { useState } from "react";

export default function LoginModal({
  onClose,
  onSwitchToRegister,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: email,   // 👈 改成 email
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
      onClose?.();
    } catch {
      setMsg("伺服器連線錯誤");
    }
  };

  const handleModalClick = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-background-dark p-8 shadow-lg"
        onClick={handleModalClick}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-white mb-4">登入系統</h2>

        {msg && <p className="text-red-400 mb-2">{msg}</p>}

        <form className="flex flex-col gap-4" onSubmit={login}>
          <div>
            <label className="text-white/80 text-sm">電子信箱</label>
            <input
              type="email"
              className="w-full rounded-lg bg-white/10 px-4 py-3 text-white"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入電子信箱"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">密碼</label>
            <input
              type="password"
              className="w-full rounded-lg bg-white/10 px-4 py-3 text-white"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
            />
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-primary py-3 text-background-dark font-bold"
          >
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
