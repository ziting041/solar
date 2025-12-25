// src/App.js
import React, { useState } from "react";

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

// ===== Modals =====
import CreateSiteModal from "./components/CreateSiteModal";
import EditSiteModal from "./components/EditSiteModal"; // ✅ 新增

export default function App() {
  // ==============================
  // 登入狀態
  // ==============================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ==============================
  // Modal 狀態
  // ==============================
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);

  const [editingSite, setEditingSite] = useState(null); // ✅ 編輯案場用

  // ==============================
  // 導航 & 預測流程
  // ==============================
  const [currentPage, setCurrentPage] = useState("home");
  const [predictInfo, setPredictInfo] = useState(null);
  const [restoredFromVisualization, setRestoredFromVisualization] =
    useState(false);

  // ==============================
  // Modal 控制
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
  // 登入 / 登出
  // ==============================
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    setIsLoginModalOpen(false);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("user");

    setPredictInfo(null);
    setRestoredFromVisualization(false);
    setCurrentPage("home");
  };

  // ==============================
  // 新增案場
  // ==============================
  const openCreateSite = () => setIsCreateSiteModalOpen(true);
  const closeCreateSite = () => setIsCreateSiteModalOpen(false);

  const submitCreateSite = async (formData) => {
    if (!currentUser) return;

    const res = await fetch("http://127.0.0.1:8000/site/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        user_id: currentUser.user_id,
      }),
    });

    if (res.ok) {
      setIsCreateSiteModalOpen(false);
      window.dispatchEvent(new Event("site-updated"));
    }
  };

  // ==============================
  // ✏️ 編輯案場（🔥 關鍵新增）
  // ==============================
  const openEditSite = (site) => {
    setEditingSite(site);
  };

  const closeEditSite = () => {
    setEditingSite(null);
  };

  // ==============================
  // 導航
  // ==============================
  const go = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const goDashboard = () => {
    setPredictInfo(null);
    setRestoredFromVisualization(false);
    go("dashboard");
  };

  const goPredict = () => {
    if (!restoredFromVisualization) {
      setPredictInfo(null);
    }
    setRestoredFromVisualization(false);
    go("start-predict");
  };

  const goSites = () => {
    setPredictInfo(null);
    setRestoredFromVisualization(false);
    go("site");
  };

  const goDataCleaning = () => go("data-cleaning");
  const goUnitAdjustment = () => go("unit-adjustment");
  const goModelTraining = () => go("model-training");
  const goReport = () => go("report");

  const submitEditSite = async (data) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/site/${data.site_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (res.ok) {
        setEditingSite(null);
        window.dispatchEvent(new Event("site-updated"));
      }
    } catch (err) {
      console.error("更新案場失敗", err);
    }
  };
  // ==============================
  // 教學頁
  // ==============================
  if (currentPage === "user-guide") {
    return <UserGuide onFinish={() => go("home")} />;
  }

  // ==============================
  // 未登入
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
  // 案場頁（🔥 這裡一定要傳 onOpenEditSite）
  // ==============================
  if (currentPage === "site") {
    return (
      <>
        <Sites
          user={currentUser}
          onOpenCreateSite={openCreateSite}
          onOpenEditSite={openEditSite}   // ✅ 關鍵修正
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

        {editingSite && (
          <EditSiteModal
            site={editingSite}
            onClose={() => setEditingSite(null)}
          />
        )}
      </>
    );
  }

  // ==============================
  // 預測流程（以下原封不動）
  // ==============================
  if (currentPage === "start-predict") {
    return (
      <StartPredict
        restoredFromVisualization={restoredFromVisualization}
        onBack={goDashboard}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}
        onNext={(info) => {
          setPredictInfo(info);
          setRestoredFromVisualization(false);
          goDataCleaning();
        }}
      />
    );
  }

  if (currentPage === "data-cleaning") {
    return (
      <DataCleaning
        dataId={predictInfo?.dataId}
        fileName={predictInfo?.fileName}
        onBack={() => {
          setRestoredFromVisualization(true);
          goPredict();
        }}
        onNext={goUnitAdjustment}
        onNavigateToPredict={goPredict}
        onNavigateToSites={goSites}
        onLogout={handleLogout}
      />
    );
  }

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
  // Dashboard
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
