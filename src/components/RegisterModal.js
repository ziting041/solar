import React, { useState } from "react";

export default function RegisterModal({ onClose, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const register = async (e) => {
    e.preventDefault();
    setMsg("");

    const payload = {
      user_name: name,
      user_email: email,   // 👈 改成 email
      user_pw: password,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.detail || "註冊失敗");
        return;
      }

      // ✅ 註冊成功 → 回登入
      onSwitchToLogin();

    } catch {
      setMsg("伺服器連線錯誤");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex justify-center items-center">
      <div className="bg-background-dark p-8 rounded-2xl w-full max-w-md relative">

        <button className="absolute top-4 right-4 text-white" onClick={onClose}>
          ✕
        </button>

        <h2 className="text-white text-2xl mb-4">註冊新帳號</h2>

        {msg && <p className="text-red-400 mb-2">{msg}</p>}

        <form className="flex flex-col gap-4" onSubmit={register}>

          <div>
            <label className="text-white/80 text-sm">使用者名稱</label>
            <input
              className="w-full bg-white/10 text-white px-3 py-2 rounded"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入您的名字"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">電子信箱</label>
            <input
              className="w-full bg-white/10 text-white px-3 py-2 rounded"
              type="email"          // 👈 email
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">密碼</label>
            <input
              className="w-full bg-white/10 text-white px-3 py-2 rounded"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
            />
          </div>

          <button className="bg-primary py-2 rounded text-background-dark font-bold">
            註冊
          </button>
        </form>

        <p className="text-white/60 mt-3 text-sm text-center">
          已有帳號？
          <button onClick={onSwitchToLogin} className="text-primary ml-1">
            返回登入
          </button>
        </p>
      </div>
    </div>
  );
}
