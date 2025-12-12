// src/App.js
import React, { useState, useEffect } from "react";

// ===== Public (未登入) =====
import PublicHome from "./pages/PublicHome";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";

// ===== Main Pages =====
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import StartPredict from "./pages/StartPredict";
import DataCleaning from "./pages/DataCleaning";
import UnitAdjustment from "./pages/UnitAdjustment";
import ModelTraining from "./pages/ModelTraining";
import PredictionReport from "./pages/PredictionReport";
import UserGuide from "./pages/UserGuide";

import CreateSiteModal from "./components/CreateSiteModal";

export default function App() {

  // ==============================
  // 狀態管理
  // ==============================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);

  // ⭐ 目前所在頁面
  const [currentPage, setCurrentPage] = useState("home");

  // ⭐ 存 StartPredict 傳來的 fileName / dataId
  const [predictInfo, setPredictInfo] = useState(null);


  // ==============================
  // 讀取 localStorage（保持登入狀態）
  // ==============================
  useEffect(() => {
    const saved = localStorage.getItem("user");

    if (!saved) return;

    try {
      const userObj = JSON.parse(saved);
      setCurrentUser(userObj);
      setIsLoggedIn(true);
      setCurrentPage("dashboard");
    } catch (err) {
      console.error("⚠ localStorage user 格式錯誤：", err);
      localStorage.removeItem("user");
    }
  }, []);


  // ==============================
  // Modal 開關
  // ==============================
  const openLogin = () => setIsLoginModalOpen(true);
  const closeLogin = () => setIsLoginModalOpen(false);

  const openRegister = () => setIsRegisterModalOpen(true);
  const closeRegister = () => setIsRegisterModalOpen(false);

  const switchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };


  // ==============================
  // 登入成功
  // ==============================
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    setIsLoginModalOpen(false);
    setCurrentPage("dashboard");
  };


  // ==============================
  // 登出
  // ==============================
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("user");
    setCurrentPage("home");
  };


  // ==============================
  // 新增案場 Modal
  // ==============================
  const openCreateSite = () => setIsCreateSiteModalOpen(true);
  const closeCreateSite = () => setIsCreateSiteModalOpen(false);

  const submitCreateSite = async (formData) => {
    if (!currentUser) {
      alert("請先登入！");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/site/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        user_id: currentUser.user_id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("新增失敗：" + data.detail);
      return;
    }

    alert("案場新增成功！");
    setIsCreateSiteModalOpen(false);
  };


  // ==============================
  // 導航
  // ==============================
  const go = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const goDashboard = () => go("dashboard");
  const goPredict = () => go("start-predict");
  const goSites = () => go("site");
  const goDataCleaning = () => go("data-cleaning");
  const goUnitAdjustment = () => go("unit-adjustment");
  const goModelTraining = () => go("model-training");
  const goReport = () => go("report");


  // ==============================
  // 教學頁
  // ==============================
  if (currentPage === "user-guide") {
    return <UserGuide onFinish={() => go("home")} />;
  }


  // ==============================
  // 未登入（首頁）
  // ==============================
  if (!isLoggedIn) {
    return (
      <>
        <PublicHome
          onOpenLogin={openLogin}
          onOpenUserGuide={() => go("user-guide")}
        />

        {isLoginModalOpen && (
          <LoginModal
            onClose={closeLogin}
            onSwitchToRegister={switchToRegister}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {isRegisterModalOpen && (
          <RegisterModal
            onClose={closeRegister}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </>
    );
  }


  // ==============================
  // 已登入：案場管理頁
  // ==============================
  if (currentPage === "site") {
    return (
      <>
        <Sites
          user={currentUser}
          onOpenCreateSite={openCreateSite}
          onNavigateToDashboard={goDashboard}
          onNavigateToPredict={goPredict}
          onNavigateToSites={goSites}
          onLogout={handleLogout}
        />

        {isCreateSiteModalOpen && (
          <CreateSiteModal
            onClose={closeCreateSite}
            onSubmit={submitCreateSite}
          />
        )}
      </>
    );
  }


  // ==============================
  // StartPredict（開始建立模型）
  // ==============================
  if (currentPage === "start-predict") {
    return (
      <StartPredict
        onBack={goDashboard}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}

        // ⭐ 把 StartPredict 回傳的 {dataId, fileName} 存起來
        onNext={(info) => {
          setPredictInfo(info);
          goDataCleaning();
        }}
      />
    );
  }


  // ==============================
  // DataCleaning（資料清理）
  // ==============================
  if (currentPage === "data-cleaning") {
    return (
      <DataCleaning
        dataId={predictInfo?.dataId}     // ⭐ 確保 dataId 正確傳入
        fileName={predictInfo?.fileName}

        onBack={goPredict}
        onNext={goUnitAdjustment}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}
      />
    );
  }


  // ==============================
  // 後續流程
  // ==============================
  if (currentPage === "unit-adjustment") {
    return (
      <UnitAdjustment
        onBack={goDataCleaning}
        onNext={goModelTraining}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "model-training") {
    return (
      <ModelTraining
        onBack={goUnitAdjustment}
        onNext={goReport}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "report") {
    return (
      <PredictionReport
        onBack={goModelTraining}
        onNavigateToDashboard={goDashboard}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}
      />
    );
  }


  // ==============================
  // 預設：Dashboard
  // ==============================
  return (
    <>
      <Dashboard
        user={currentUser}
        onLogout={handleLogout}
        onNavigateToPredict={goPredict}
        onNavigateToDashboard={goDashboard}
        onNavigateToSites={goSites}
        onOpenCreateSite={openCreateSite}
      />

      {isCreateSiteModalOpen && (
        <CreateSiteModal
          onClose={closeCreateSite}
          onSubmit={submitCreateSite}
        />
      )}
    </>
  );
}
