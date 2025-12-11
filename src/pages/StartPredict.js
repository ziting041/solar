// src/pages/StartPredict.js
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function StartPredict({
  onBack,
  onNext,
  onNavigateToPredict,
  onNavigateToSites,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("existing");

  // ====== 資料庫案場 ======
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");

  // ====== 新案場資料 ======
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteCode, setNewSiteCode] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // ====== 上傳檔案 ======
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [features, setFeatures] = useState([]);
  const [rows, setRows] = useState(null);
  const [processing, setProcessing] = useState(false);

  const userId = localStorage.getItem("user_id");

  // === ⭐ 讀取資料庫案場 ===
  useEffect(() => {
  const fetchSites = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/site/list?user_id=${userId}`);
      const data = await res.json();

      console.log("=== /site/list 回傳內容 ===", data);

      if (Array.isArray(data)) {
        setSites(data);
      } else {
        console.warn("後端回傳格式非 array");
        setSites([]);
      }
    } catch (e) {
      console.error("取得案場失敗", e);
      setSites([]);
    }
  };
  fetchSites();
}, [userId]);

  // === ⭐ 新增案場 ===
  const createNewSite = async () => {
    if (!newSiteName || !newSiteCode || !newLocation) {
      alert("請完整填寫新案場資料");
      return;
    }

    const payload = {
      site_name: newSiteName,
      site_code: newSiteCode,
      location: newLocation,
      user_id: parseInt(userId),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/site/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.site_id) {
        alert("新增案場失敗");
        return;
      }

      alert("案場建立成功！");

      // ⭐ 新增後重新讀取案場列表
      const res2 = await fetch(
        `http://127.0.0.1:8000/site/list?user_id=${userId}`
      );
      const siteList = await res2.json();

      setSites(siteList);         // 更新 select 下拉選單
      setSelectedSite(json.site_id);  // 自動選中剛剛新增的案場
      setActiveTab("existing");       // 自動跳回現有案場

    } catch (error) {
      console.error(error);
      alert("無法建立案場");
    }
  };

  // === ⭐ 上傳檔案（會寫入 site_data） ===
  const handleFileSelect = async (event) => {
  const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!selectedSite) {
      alert("請先選擇或建立案場！");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile); // ⭐ 只放 file，site_id 用 query

    try {
      setProcessing(true);

      const res = await fetch(
        `http://127.0.0.1:8000/site/upload-data?site_id=${selectedSite}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const text = await res.text();
      console.log("後端回傳原文：", text);

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        alert("上傳失敗：後端未回傳 JSON");
        return;
      }

      if (!json.file_name) {
        alert("後端未回傳檔名，上傳失敗");
        return;
      }

      // ⭐ 上傳成功
      setFile({
        name: uploadedFile.name,
        size: (uploadedFile.size / 1024 / 1024).toFixed(2) + " MB",
        status: "上傳成功",
      });

      setFileName(json.file_name);
      setFeatures(json.features || []);
      setRows(json.rows || null);

      localStorage.setItem("lastUploadedFile", json.file_name);
    } catch (err) {
      console.error(err);
      alert("上傳失敗，後端無回應");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setFeatures([]);
    setRows(null);
  };

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar
        activePage="predict"
        onNavigateToDashboard={onBack}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-white">開始建立您的發電量預測模型</h1>

        {/* Step 1 */}
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">步驟一：選擇或建立案場</h2>

          <div className="flex rounded-lg bg-white/5 p-1 w-full">
            <button
              onClick={() => setActiveTab("existing")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "existing"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/50"
              }`}
            >
              選擇現有案場
            </button>

            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "new"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/50"
              }`}
            >
              建立新案場資料
            </button>
          </div>

          {activeTab === "existing" ? (
            <div className="mt-4">
              <select
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">請選擇案場</option>

                {Array.isArray(sites) &&
                  sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.site_code} - {s.site_name}（{s.location}）
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="案場代號（site_code）"
                className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={newSiteCode}
                onChange={(e) => setNewSiteCode(e.target.value)}
              />

              <input
                type="text"
                placeholder="案場名稱（site_name）"
                className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
              />

              <input
                type="text"
                placeholder="案場地點（location）"
                className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />

              <button
                onClick={createNewSite}
                className="mt-3 bg-primary text-black font-bold px-4 py-2 rounded-lg"
              >
                建立案場
              </button>
            </div>
          )}
        </div>

        {/* Step 2：上傳檔案 */}
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">步驟二：上傳數據檔案</h2>

          <div className="relative mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 py-12 bg-white/[.01] text-center">
            <input type="file" id="fileInput" className="hidden" onChange={handleFileSelect} />

            <label
              htmlFor="fileInput"
              className="rounded-lg border border-primary text-primary px-6 py-2 cursor-pointer"
            >
              選擇檔案
            </label>
          </div>

          {fileName && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="text-lg font-bold mb-2">📄 檔案資訊</h3>

              <p className="text-white/80 mb-2">
                <strong>欄位數量：</strong> {features.length} 個
              </p>

              <p className="text-white/80 mb-4">
                <strong>資料筆數：</strong> {rows} 筆
              </p>

              <div>
                <strong className="text-white/90">欄位列表：</strong>
                <ul className="list-disc list-inside mt-2 text-white/70">
                  {features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 下一步 */}
      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 p-4">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button
            onClick={() => {
              const stored = localStorage.getItem("lastUploadedFile");
              const finalFileName = fileName || stored;

              if (!selectedSite) {
                alert("請選擇案場！");
                return;
              }

              if (!finalFileName) {
                alert("請先上傳檔案！");
                return;
              }

              onNext(finalFileName);
            }}
            className="bg-primary px-8 py-2 rounded-lg font-bold"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}
