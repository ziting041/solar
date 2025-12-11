// src/App.js
import React, { useState, useEffect } from 'react';

import PublicHome from './pages/PublicHome';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';

import Dashboard from './pages/Dashboard';
import StartPredict from './pages/StartPredict';
import DataCleaning from './pages/DataCleaning';
import UnitAdjustment from './pages/UnitAdjustment';
import ModelTraining from './pages/ModelTraining';
import PredictionReport from './pages/PredictionReport';
import Sites from './pages/Sites';
import UserGuide from './pages/UserGuide';

import CreateSiteModal from "./components/CreateSiteModal";

function App() {

  // --------------------------
  // 狀態管理
  // --------------------------
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentPage, setCurrentPage] = useState("home");

  // CreateSiteModal
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);


  // --------------------------
  // 讀取 localStorage（保持登入狀態）
  // --------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) return;

    try {
      const userObj = JSON.parse(savedUser);
      setCurrentUser(userObj);
      setIsLoggedIn(true);
      setCurrentPage("dashboard");
    } catch (err) {
      console.error("localStorage user 解析錯誤：", err);
      localStorage.removeItem("user");
    }
  }, []);


  // --------------------------
  // Modal 開關
  // --------------------------
  const handleOpenLogin = () => setIsLoginModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);

  const handleOpenRegister = () => setIsRegisterModalOpen(true);
  const handleCloseRegisterModal = () => setIsRegisterModalOpen(false);


  // --------------------------
  // 註冊 ⇄ 登入切換
  // --------------------------
  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };


  // --------------------------
  // 登入成功事件
  // --------------------------
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);

    localStorage.setItem("user", JSON.stringify(user));

    setIsLoginModalOpen(false);
    setCurrentPage("dashboard");
  };


  // --------------------------
  // 登出
  // --------------------------
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("user");
    setCurrentPage("home");
  };


  // --------------------------
  // 新增案場
  // --------------------------
  const handleOpenCreateSite = () => setIsCreateSiteModalOpen(true);
  const handleCloseCreateSite = () => setIsCreateSiteModalOpen(false);

  const handleCreateSiteSubmit = async (formData) => {

    if (!currentUser) {
      alert("尚未登入，無法新增案場");
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

    alert("案場已新增！");
    setIsCreateSiteModalOpen(false);
  };


  // --------------------------
  // 教學畫面
  // --------------------------
  const handleOpenUserGuide = () => setCurrentPage("user-guide");
  const handleFinishUserGuide = () => setCurrentPage("home");


  // --------------------------
  // 導航功能
  // --------------------------
  const handleGoToDashboard = () => {
    setCurrentPage("dashboard");
    window.scrollTo(0, 0);
  };

  const handleGoToPredict = () => {
    setCurrentPage("start-predict");
    window.scrollTo(0, 0);
  };

  const handleGoToSites = () => {
    setCurrentPage("site");
    window.scrollTo(0, 0);
  };

  const handleGoToDataCleaning = () => {
    setCurrentPage("data-cleaning");
    window.scrollTo(0, 0);
  };

  const handleGoToUnitAdjustment = () => {
    setCurrentPage("unit-adjustment");
    window.scrollTo(0, 0);
  };

  const handleGoToModelTraining = () => {
    setCurrentPage("model-training");
    window.scrollTo(0, 0);
  };

  const handleGoToReport = () => {
    setCurrentPage("report");
    window.scrollTo(0, 0);
  };


  // --------------------------
  // 路由邏輯
  // --------------------------

  // 教學頁
  if (currentPage === "user-guide") {
    return <UserGuide onFinish={handleFinishUserGuide} />;
  }

  // 未登入
  if (!isLoggedIn) {
    return (
      <>
        <PublicHome
          onOpenLogin={handleOpenLogin}
          onOpenUserGuide={handleOpenUserGuide}
        />

        {isLoginModalOpen && (
          <LoginModal
            onClose={handleCloseLoginModal}
            onSwitchToRegister={handleSwitchToRegister}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {isRegisterModalOpen && (
          <RegisterModal
            onClose={handleCloseRegisterModal}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </>
    );
  }

  // --------------------------
  // 已登入 — 案場管理頁
  // --------------------------
  if (currentPage === "site") {
    return (
      <>
        <Sites
          user={currentUser}
          onOpenCreateSite={handleOpenCreateSite}
          onNavigateToDashboard={handleGoToDashboard}
          onNavigateToPredict={handleGoToPredict}
          onNavigateToSites={handleGoToSites}
          onLogout={handleLogout}
        />

        {isCreateSiteModalOpen && (
          <CreateSiteModal
            onClose={handleCloseCreateSite}
            onSubmit={handleCreateSiteSubmit}
          />
        )}
      </>
    );
  }

  // --------------------------
  // 其他頁面
  // --------------------------
  if (currentPage === "start-predict") {
    return (
      <StartPredict
        onBack={handleGoToDashboard}
        onNavigateToPredict={handleGoToPredict}
        onNavigateToSites={handleGoToSites}
        onLogout={handleLogout}
        onNext={handleGoToDataCleaning}
      />
    );
  }

  if (currentPage === "data-cleaning") {
    return (
      <DataCleaning
        onBack={handleGoToPredict}
        onNext={handleGoToUnitAdjustment}
        onNavigateToPredict={handleGoToPredict}
        onNavigateToSites={handleGoToSites}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "unit-adjustment") {
    return (
      <UnitAdjustment
        onBack={handleGoToDataCleaning}
        onNext={handleGoToModelTraining}
        onNavigateToPredict={handleGoToPredict}
        onNavigateToSites={handleGoToSites}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "model-training") {
    return (
      <ModelTraining
        onBack={handleGoToUnitAdjustment}
        onNext={handleGoToReport}
        onNavigateToPredict={handleGoToPredict}
        onNavigateToSites={handleGoToSites}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "report") {
    return (
      <PredictionReport
        onBack={handleGoToModelTraining}
        onNavigateToDashboard={handleGoToDashboard}
        onNavigateToPredict={handleGoToPredict}
        onNavigateToSites={handleGoToSites}
        onLogout={handleLogout}
      />
    );
  }

  // --------------------------
  // 預設：Dashboard
  // --------------------------
  return (
    <>
      <Dashboard
        onLogout={handleLogout}
        onNavigateToPredict={handleGoToPredict}
        onNavigateToDashboard={handleGoToDashboard}
        onNavigateToSites={handleGoToSites}
        onOpenCreateSite={handleOpenCreateSite}
        user={currentUser}
      />

      {isCreateSiteModalOpen && (
        <CreateSiteModal
          onClose={handleCloseCreateSite}
          onSubmit={handleCreateSiteSubmit}
        />
      )}
    </>
  );
}

export default App;
