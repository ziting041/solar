// src/pages/ModelTraining.js
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';


const ResultChart = () => (
  <div className="relative w-full h-64 mt-4">
    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
      <line x1="0" y1="180" x2="400" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="0" y1="135" x2="400" y2="135" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4" />
      <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4" />
      <line x1="0" y1="45" x2="400" y2="45" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4" />
      <path d="M0 180 C 40 180, 60 180, 80 120 S 120 20, 160 30 S 200 180, 240 180 S 280 180, 300 100 S 340 40, 360 50 S 380 180, 400 180" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.6"/>
      <path d="M0 180 C 40 180, 60 175, 80 115 S 120 25, 160 35 S 200 175, 240 180 S 280 180, 300 105 S 340 45, 360 55 S 380 180, 400 180" fill="none" stroke="#f2cc0d" strokeWidth="2" />
      <path d="M0 180 C 40 180, 60 175, 80 115 S 120 25, 160 35 S 200 175, 240 180 S 280 180, 300 105 S 340 45, 360 55 S 380 180, 400 180 V 180 H 0" fill="url(#gradient)" opacity="0.2"/>
      <defs><linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f2cc0d" /><stop offset="100%" stopColor="#f2cc0d" stopOpacity="0" /></linearGradient></defs>
    </svg>
    <div className="absolute top-2 right-2 flex gap-4 bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm border border-white/5">
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div><span className="text-[10px] text-white/60">實際發電量</span></div>
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-[10px] text-primary">模型預測值</span></div>
    </div>
  </div>
);

// 在參數中加入 onNavigateToSites
export default function ModelTraining({ onBack, onNext, onNavigateToPredict, onNavigateToSites, onLogout }) {
  
  const models = [
    { id: 'LSTM', name: 'LSTM 模型', subtitle: '專為時間序列設計的深度學習模型，能捕捉長期的日照變化趨勢與氣候模式。', params: [{ id: 'epochs', label: 'Epochs (訓練迭代)', type: 'slider', min: 10, max: 200, step: 10, default: 100, desc: '模型看過完整資料集的次數。' }, { id: 'batchSize', label: 'Batch Size (批次)', type: 'select', options: [16, 32, 64, 128], default: 32, desc: '每次訓練處理的資料筆數。' }, { id: 'lookback', label: 'Lookback (回看時數)', type: 'slider', min: 6, max: 72, step: 1, default: 24, desc: '參考過去多少小時的資料。' }] },
    { id: 'XGBoost', name: 'XGBoost 模型', subtitle: '高效能的梯度提升演算法，運算速度快且準確度極高。', params: [{ id: 'n_estimators', label: 'n_estimators (樹量)', type: 'slider', min: 50, max: 500, step: 10, default: 100, desc: '建立多少棵決策樹。' }, { id: 'learning_rate', label: 'Learning Rate (學習率)', type: 'slider', min: 0.01, max: 0.3, step: 0.01, default: 0.1, desc: '每步修正錯誤的幅度。' }, { id: 'max_depth', label: 'Max Depth (樹深)', type: 'slider', min: 3, max: 10, step: 1, default: 5, desc: '限制樹生長的深度。' }] },
    { id: 'RandomForest', name: '隨機森林', subtitle: '透過多棵決策樹進行投票預測，穩定性高且抗雜訊能力強。', params: [{ id: 'n_estimators', label: 'n_estimators (樹量)', type: 'slider', min: 50, max: 300, step: 10, default: 100, desc: '森林中樹木的總數。' }, { id: 'max_depth', label: 'Max Depth (樹深)', type: 'select', options: ['None', 10, 20, 30], default: 20, desc: '限制分支深度。' }, { id: 'min_samples_split', label: 'Min Samples Split', type: 'slider', min: 2, max: 10, step: 1, default: 2, desc: '最少分裂樣本數。' }] },
    { id: 'SVR', name: 'SVR (支援向量迴歸)', subtitle: '基於統計學的演算法，擅長在小樣本中找出最佳趨勢線。', params: [{ id: 'C', label: 'C (正則化)', type: 'slider', min: 0.1, max: 100, step: 0.1, default: 1.0, desc: '控制對錯誤容忍的程度。' }, { id: 'kernel', label: 'Kernel (核函數)', type: 'select', options: ['RBF', 'Linear', 'Poly'], default: 'RBF', desc: '投影空間方式。' }, { id: 'epsilon', label: 'Epsilon (容許誤差)', type: 'slider', min: 0.01, max: 1.0, step: 0.01, default: 0.1, desc: '誤差容忍範圍。' }] }
  ];

  const [selectedModelId, setSelectedModelId] = useState('LSTM');
  const [splitRatio, setSplitRatio] = useState(80);
  const [isTraining, setIsTraining] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [paramValues, setParamValues] = useState({ epochs: 100, batchSize: 32, lookback: 24, n_estimators: 100, learning_rate: 0.1, max_depth: 5, min_samples_split: 2, C: 1.0, kernel: 'RBF', epsilon: 0.1 });

  const handleParamChange = (key, value) => setParamValues(prev => ({ ...prev, [key]: value }));
  const handleStartTraining = () => { setIsTraining(true); setTimeout(() => { setIsTraining(false); setIsTrained(true); }, 2500); };
  const getSplitDate = (ratio) => { const splitDay = Math.floor(365 * (ratio / 100)); const date = new Date('2022-01-01'); date.setDate(date.getDate() + splitDay); return date.toISOString().split('T')[0].replace(/-/g, '/'); };
  const splitDate = getSplitDate(splitRatio);
  const activeModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar 
        activePage="predict"
        onNavigateToDashboard={onNavigateToPredict}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites} //傳遞給 Navbar
        onLogout={onLogout}
      />

      {/* Sticky Header */}
      <div className="w-full border-b border-white/10 bg-white/[.02] px-6 py-3 sticky top-[64px] sm:top-[65px] z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"><span className="material-symbols-outlined !text-lg">arrow_back</span>返回上一步</button>
          <div className="text-sm font-medium"><span className="text-white/40">1. 上傳資料</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">2. 清理資料</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">3. 調整單位</span><span className="mx-2 text-white/30">/</span><span className="text-primary font-bold">4. 模型訓練與優化</span><span className="mx-2 text-white/30">/</span><span className="text-white/40">5. 預測報告與匯出</span></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左欄：設定區 */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. 模型選擇</h2>
            <div className="flex flex-col gap-2">
              {models.map((model) => (
                <div key={model.id} onClick={() => setSelectedModelId(model.id)} className={`cursor-pointer rounded-lg border p-3 transition-all ${selectedModelId === model.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <div className="flex items-center justify-between mb-1"><span className={`text-sm font-bold ${selectedModelId === model.id ? 'text-primary' : 'text-white'}`}>{model.name}</span>{selectedModelId === model.id && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}</div>
                  <p className="text-[10px] text-white/50 leading-tight">{model.subtitle}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-base font-bold text-white mb-3">2. 資料分割</h2>
            <div className="flex items-center justify-between text-xs text-white/80 mb-2"><span className="font-bold text-primary">訓練集 ({splitRatio}%)</span><span className="font-bold text-white/60">測試集 ({100 - splitRatio}%)</span></div>
            <div className="relative h-3 w-full mb-4 group">
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${splitRatio}%` }}></div></div>
              <input type="range" min="50" max="95" step="5" value={splitRatio} onChange={(e) => setSplitRatio(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-lg pointer-events-none transition-all group-hover:scale-125" style={{ left: `${splitRatio}%`, transform: 'translate(-50%, -50%)' }}></div>
            </div>
            <div className="text-[10px] text-white/40 flex justify-between"><span>2022/01/01</span><span className="text-white">{splitDate}</span><span>2022/12/31</span></div>
          </section>
          <section>
            <h2 className="text-base font-bold text-white mb-3">3. 參數調整</h2>
            <div className="flex flex-col gap-4 bg-white/5 rounded-lg p-4 border border-white/10">
              {activeModel?.params.map((param) => (
                <div key={param.id}>
                  <div className="flex justify-between mb-1"><label className="block text-xs font-bold text-white/90">{param.label}</label>{param.type === 'slider' && <span className="text-[10px] font-mono text-primary">{paramValues[param.id]}</span>}</div>
                  {param.type === 'slider' ? (<div className="flex items-center gap-2"><input type="range" min={param.min} max={param.max} step={param.step} value={paramValues[param.id] || param.default} onChange={(e) => handleParamChange(param.id, Number(e.target.value))} className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary" /></div>) : (<select value={paramValues[param.id] || param.default} onChange={(e) => handleParamChange(param.id, e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-primary outline-none">{param.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>)}
                </div>
              ))}
            </div>
          </section>
          <button onClick={handleStartTraining} disabled={isTraining} className={`w-full rounded-lg py-3 text-sm font-bold text-background-dark transition-all flex items-center justify-center gap-2 ${isTraining ? 'bg-white/50 cursor-not-allowed' : 'bg-primary hover:scale-[1.02]'}`}>
            {isTraining ? (<><span className="material-symbols-outlined animate-spin text-lg">refresh</span>訓練中...</>) : ('開始訓練')}
          </button>
        </div>

        {/* 右欄：結果顯示區 */}
        <div className="lg:col-span-8">
          <div className={`h-full min-h-[600px] w-full rounded-2xl border-white/10 bg-white/[.01] flex flex-col p-6 relative overflow-hidden transition-all duration-500 ${isTrained ? 'border border-solid' : 'border-2 border-dashed items-center justify-center'}`}>
             {isTrained ? (
               <div className="w-full h-full flex flex-col animate-fade-in">
                 <div className="grid grid-cols-3 gap-4 mb-6">
                   <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center relative overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div><span className="text-xs text-white/50 mb-1">R² Score (決定係數)</span><span className="text-3xl font-black text-green-400">0.982</span><span className="text-[10px] text-green-500/70 mt-1 bg-green-500/10 px-2 py-0.5 rounded-full">表現優異</span></div>
                   <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center relative overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div><span className="text-xs text-white/50 mb-1">RMSE (均方根誤差)</span><span className="text-3xl font-black text-red-400">12.5 <span className="text-sm font-medium text-white/40">kW</span></span><span className="text-[10px] text-red-500/70 mt-1 bg-red-500/10 px-2 py-0.5 rounded-full">需注意</span></div>
                   <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center relative overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div><span className="text-xs text-white/50 mb-1">MAE (平均絕對誤差)</span><span className="text-3xl font-black text-yellow-400">8.4 <span className="text-sm font-medium text-white/40">kW</span></span><span className="text-[10px] text-yellow-500/70 mt-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">可接受</span></div>
                 </div>
                 <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 relative">
                    <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-white">預測結果驗證 (Actual vs. Predicted)</h3><div className="text-[10px] text-white/40">區間：2022/10/01 - 2022/10/07</div></div>
                    <ResultChart />
                 </div>
                 <div className="mt-6">
                    <div className="flex flex-col gap-1">
                       <div className="text-xs text-white/40">本次訓練參數紀錄：</div>
                       <div className="flex gap-2 flex-wrap">
                          {activeModel?.params.map(p => (<span key={p.id} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/70 border border-white/5">{p.label.split(' (')[0]}: <span className="text-primary">{paramValues[p.id] || p.default}</span></span>))}
                       </div>
                    </div>
                 </div>
               </div>
             ) : isTraining ? (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="relative size-24 mb-6"><div className="absolute inset-0 rounded-full border-4 border-white/10"></div><div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><span className="material-symbols-outlined !text-4xl text-primary">model_training</span></div></div>
                  <h3 className="text-xl font-bold text-white">模型訓練中...</h3><p className="text-white/50 mt-2 text-sm">正在進行第 24/100 次迭代 (Epochs)</p>
                  <div className="mt-8 w-64 space-y-2"><div className="h-1 w-full bg-white/10 rounded overflow-hidden"><div className="h-full bg-primary animate-[width_2s_ease-in-out_infinite]" style={{width: '60%'}}></div></div><div className="flex justify-between text-[10px] text-white/30 font-mono"><span>Loss: 0.452</span><span>Val_Loss: 0.481</span></div></div>
                </div>
             ) : (
               <div className="text-center"><div className="mb-4 mx-auto size-16 rounded-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined !text-3xl text-white/20">bar_chart</span></div><h3 className="text-lg font-bold text-white mb-2">等待訓練</h3><p className="text-white/50 text-sm max-w-xs mx-auto">請在左側設定好模型參數與資料分割比例，點擊「開始訓練」以查看視覺化結果。</p></div>
             )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 backdrop-blur-lg p-4 px-6 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-4">
           <button onClick={onBack} className="rounded-lg border border-white/10 px-6 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors">返回上一步</button>
           <button onClick={onNext} disabled={!isTrained} className={`flex items-center justify-center rounded-lg px-8 py-2 text-base font-bold text-background-dark transition-transform ${isTrained ? 'bg-primary hover:scale-105' : 'bg-white/20 cursor-not-allowed text-white/40'}`}>觀看預測報告</button>
         </div>
      </div>
    </div>
  );
}