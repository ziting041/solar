// src/pages/StartPredict.js
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function StartPredict({
  onBack,
  onNext,
  onNavigateToPredict,
  onNavigateToSites,
  onLogout,

  // ✅ 只有「視覺化頁返回」時才會傳進來
  restoredFromVisualization = false,
}) {
  const [activeTab, setActiveTab] = useState("existing");
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");

  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteCode, setNewSiteCode] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [features, setFeatures] = useState([]);
  const [rows, setRows] = useState(null);
  const [processing, setProcessing] = useState(false);

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.user_id || 0;
  };

  // 🔥【補齊】只清「預測流程」相關資料（不要用 localStorage.clear）
  const clearPredictCache = () => {
    localStorage.removeItem("lastUploadedFile");
    localStorage.removeItem("lastDataId");
    localStorage.removeItem("lastFeatures");
    localStorage.removeItem("lastRows");
    localStorage.removeItem("lastSelectedSite");
  };

  /* =================================================
     🔥 關鍵：不是從「視覺化返回」→ 一律清空
  ================================================= */
  useEffect(() => {
    if (!restoredFromVisualization) {
      clearPredictCache();

      setFile(null);
      setFileName("");
      setFeatures([]);
      setRows(null);
      setSelectedSite("");
    } else {
      const savedFileName = localStorage.getItem("lastUploadedFile");
      const savedFeatures = localStorage.getItem("lastFeatures");
      const savedRows = localStorage.getItem("lastRows");
      const savedSite = localStorage.getItem("lastSelectedSite");

      if (savedFileName) {
        setFileName(savedFileName);

        // 🔥 關鍵：補回 file，畫面才會顯示
        setFile({
          name: savedFileName,
          size: "",
          status: "上傳成功",
        });
      }
      if (savedFeatures) setFeatures(JSON.parse(savedFeatures));
      if (savedRows) setRows(Number(savedRows));
      if (savedSite) setSelectedSite(savedSite);
    }
  }, [restoredFromVisualization]);

  /* ==================== 載入案場列表 ==================== */
  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;

    fetch(`http://127.0.0.1:8000/site/list?user_id=${uid}`)
      .then((res) => res.json())
      .then((data) => setSites(Array.isArray(data) ? data : []))
      .catch(() => setSites([]));
  }, []);

  /* ==================== 建立新案場（不動） ==================== */
  const createNewSite = async () => {
    const uid = getUserId();
    if (!newSiteName || !newSiteCode || !newLocation) {
      alert("請完整填寫新案場資料");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/site/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: newSiteName,
          site_code: newSiteCode,
          location: newLocation,
          user_id: uid,
        }),
      });

      const json = await res.json();
      if (!json.site_id) {
        alert("新增案場失敗");
        return;
      }

      const res2 = await fetch(
        `http://127.0.0.1:8000/site/list?user_id=${uid}`
      );
      const siteList = await res2.json();

      setSites(siteList);
      setSelectedSite(json.site_id);
      setActiveTab("existing");
    } catch {
      alert("新增案場失敗");
    }
  };

  /* ==================== 上傳檔案 ==================== */
  const handleFileSelect = async (event) => {
  const uploadedFile = event.target.files[0];
  if (!uploadedFile) return;

  if (!selectedSite) {
    alert("請先選擇案場！");
    return;
  }

  const formData = new FormData();
  formData.append("file", uploadedFile);

  try {
    setProcessing(true);

    const res = await fetch(
      `http://127.0.0.1:8000/site/upload-data?site_id=${selectedSite}`,
      { method: "POST", body: formData }
    );

    const json = await res.json();
    console.log("upload response:", json); // 🔍 除錯用

    // 🔥 關鍵 1：HTTP 層級錯誤（400 / 500）
    if (!res.ok) {
      alert(
        json?.detail?.error ||
        json?.detail ||
        "上傳失敗（後端錯誤）"
      );
      return;
    }

    // 🔥 關鍵 2：成功一定要有 data_id
    if (!json.data_id) {
      alert("上傳失敗（缺少 data_id）");
      return;
    }

    // ✅ 成功流程
    setFile({
      name: uploadedFile.name,
      size: (uploadedFile.size / 1024 / 1024).toFixed(2) + " MB",
      status: "上傳成功",
    });

    setFileName(json.file_name);
    setFeatures(json.features || []);
    setRows(json.rows || null);

    // 🔥 只存預測流程資料
    localStorage.setItem("lastUploadedFile", json.file_name);
    localStorage.setItem("lastDataId", json.data_id);
    localStorage.setItem("lastFeatures", JSON.stringify(json.features || []));
    localStorage.setItem("lastRows", json.rows || "");
    localStorage.setItem("lastSelectedSite", selectedSite);

  } catch (err) {
    console.error("upload error:", err);
    alert("無法連線到後端，請確認伺服器是否啟動");
  } finally {
    setProcessing(false);
  }
};

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar
        activePage="predict"
        onNavigateToDashboard={() => {
          clearPredictCache();
          onBack();
        }}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      {/* Step Header / Breadcrumb */}
      <div className="w-full border-b border-white/10 bg-white/[.02] px-6 py-3 sticky top-[64px] sm:top-[65px] z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined !text-lg">arrow_back</span>
            返回儀表板
          </button>

          <div className="text-sm font-medium">
            <span className="text-primary font-bold">1. 上傳資料</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">2. 清理資料</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">3. 調整單位</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">4. 選擇模型</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">5. 輸出結果</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-white">
          開始建立您的發電量預測模型
        </h1>

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
                {sites.map((s) => (
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

        {/* Step 2 */}
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">步驟二：上傳數據檔案</h2>

          <div className="relative mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 py-12 bg-white/[.01] text-center">
            <input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={handleFileSelect}
            />

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

              <strong className="text-white/90">欄位列表：</strong>
              <ul className="list-disc list-inside mt-2 text-white/70">
                {features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 p-4">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button
            onClick={() => {
              const finalFileName =
                fileName || localStorage.getItem("lastUploadedFile");
              const dataId = localStorage.getItem("lastDataId");

              if (!selectedSite) {
                alert("請選擇案場！");
                return;
              }

              if (!finalFileName || !dataId) {
                alert("請先上傳檔案！");
                return;
              }

              onNext({ fileName: finalFileName, dataId });
            }}
            className="bg-primary text-black px-8 py-2 rounded-lg font-bold"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}