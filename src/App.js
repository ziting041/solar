// src/App.js
import React, { useState } from 'react';
import PublicHome from './pages/PublicHome';
import LoginModal from './components/LoginModal';
import Dashboard from './pages/Dashboard';
import StartPredict from './pages/StartPredict';
import DataCleaning from './pages/DataCleaning';
import UnitAdjustment from './pages/UnitAdjustment';
import ModelTraining from './pages/ModelTraining';
import PredictionReport from './pages/PredictionReport';
import Sites from './pages/Sites';
import UserGuide from './pages/UserGuide'; // 1. 匯入 UserGuide

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); 

  const handleOpenLogin = () => setIsLoginModalOpen(true);
  const handleCloseModal = () => setIsLoginModalOpen(false);

  // 新增：開啟教學
  const handleOpenUserGuide = () => {
    setCurrentPage('user-guide');
  };

  // 新增：結束教學 (回到首頁)
  const handleFinishUserGuide = () => {
    setCurrentPage('home');
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('home');
  };

  const handleSwitchToRegister = () => {
    handleCloseModal();
    alert("切換到註冊視窗");
  };

  // --- 導航函式 ---
  const handleGoToDashboard = () => { setCurrentPage('dashboard'); window.scrollTo(0, 0); };
  const handleGoToPredict = () => { setCurrentPage('start-predict'); window.scrollTo(0, 0); };
  const handleGoToSites = () => { setCurrentPage('site'); window.scrollTo(0, 0); };
  const handleGoToDataCleaning = () => { setCurrentPage('data-cleaning'); window.scrollTo(0, 0); };
  const handleGoToUnitAdjustment = () => { setCurrentPage('unit-adjustment'); window.scrollTo(0, 0); };
  const handleGoToModelTraining = () => { setCurrentPage('model-training'); window.scrollTo(0, 0); };
  const handleGoToReport = () => { setCurrentPage('report'); window.scrollTo(0, 0); };

  // --- 路由邏輯 ---

  // 如果是在教學頁面，優先顯示 (不需要登入)
  if (currentPage === 'user-guide') {
    return <UserGuide onFinish={handleFinishUserGuide} />;
  }

  if (!isLoggedIn) {
    return (
      <>
        <PublicHome 
          onOpenLogin={handleOpenLogin} 
          onOpenUserGuide={handleOpenUserGuide} // 傳入開啟函式
        />
        {isLoginModalOpen && (
          <LoginModal onClose={handleCloseModal} onSwitchToRegister={handleSwitchToRegister} onLoginSuccess={handleLoginSuccess} />
        )}
      </>
    );
  }


  if (currentPage === 'site') {
    return <Sites onNavigateToDashboard={handleGoToDashboard} onNavigateToPredict={handleGoToPredict} onNavigateToSites={handleGoToSites} onLogout={handleLogout} />;
  }
  if (currentPage === 'start-predict') {
    return <StartPredict onBack={handleGoToDashboard} onNavigateToPredict={handleGoToPredict} onNavigateToSites={handleGoToSites} onLogout={handleLogout} onNext={handleGoToDataCleaning} />;
  }
  if (currentPage === 'data-cleaning') {
    return <DataCleaning onBack={handleGoToPredict} onNext={handleGoToUnitAdjustment} onNavigateToPredict={handleGoToPredict} onNavigateToSites={handleGoToSites} onLogout={handleLogout} />;
  }
  if (currentPage === 'unit-adjustment') {
    return <UnitAdjustment onBack={handleGoToDataCleaning} onNext={handleGoToModelTraining} onNavigateToPredict={handleGoToPredict} onNavigateToSites={handleGoToSites} onLogout={handleLogout} />;
  }
  if (currentPage === 'model-training') {
    return <ModelTraining onBack={handleGoToUnitAdjustment} onNext={handleGoToReport} onNavigateToPredict={handleGoToPredict} onNavigateToSites={handleGoToSites} onLogout={handleLogout} />;
  }
  if (currentPage === 'report') {
    return <PredictionReport onBack={handleGoToModelTraining} onNavigateToDashboard={handleGoToDashboard} onNavigateToPredict={handleGoToPredict} onNavigateToSites={handleGoToSites} onLogout={handleLogout} />;
  }

  return <Dashboard onLogout={handleLogout} onNavigateToPredict={handleGoToPredict} onNavigateToDashboard={handleGoToDashboard} onNavigateToSites={handleGoToSites} />;
}

export default App;