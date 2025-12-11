// src/pages/DataCleaning.js
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Chart as ChartJS,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(PointElement, CategoryScale, LinearScale, Tooltip, Legend);

// small histogram svg
function HistogramSVG({ bins = [], counts = [], height = 80 }) {
  if (!bins || bins.length < 2 || !counts) return <div className="text-white/40 text-xs">無資料</div>;
  const maxCount = Math.max(...counts, 1);
  const barCount = counts.length;
  const width = 120;
  const barWidth = width / barCount;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <rect x="0" y="0" width={width} height={height} fill="none" />
      {counts.map((c, i) => {
        const h = (c / maxCount) * (height - 10);
        const x = i * barWidth + 1;
        const y = height - h - 2;
        return <rect key={i} x={x} y={y} width={Math.max(1, barWidth - 2)} height={h} fill="#60a5fa" opacity="0.8" rx="1" />;
      })}
    </svg>
  );
}

// boxplot svg drawer
function BoxplotSVG({ groups = {}, width = 420, height = 160 }) {
  const keys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));
  if (keys.length === 0) return <div className="text-white/40 text-sm">無分組資料</div>;

  // collect values
  let allVals = [];
  keys.forEach(k => {
    const g = groups[k];
    if (!g) return;
    allVals.push(g.min, g.q1, g.median, g.q3, g.max);
  });
  const vmin = Math.min(...allVals);
  const vmax = Math.max(...allVals);
  const pad = (vmax - vmin) * 0.06 || 1;
  const rangeMin = vmin - pad;
  const rangeMax = vmax + pad;

  const mapY = (v) => {
    const hv = height - 30;
    return 15 + hv - ((v - rangeMin) / (rangeMax - rangeMin)) * hv;
  };

  const boxW = Math.max(8, (width - 40) / keys.length * 0.5);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={width} height={height} fill="none" />
      {keys.map((k, i) => {
        const g = groups[k];
        if (!g) return null;
        const cx = 20 + i * ((width - 40) / keys.length) + ((width - 40) / keys.length) / 2;
        const q1y = mapY(g.q1);
        const q3y = mapY(g.q3);
        const medy = mapY(g.median);
        const miny = mapY(g.min);
        const maxy = mapY(g.max);
        const boxLeft = cx - boxW / 2;
        const boxRight = cx + boxW / 2;

        return (
          <g key={k}>
            <line x1={cx} x2={cx} y1={maxy} y2={q3y} stroke="#ddd" strokeWidth={1} />
            <line x1={cx} x2={cx} y1={q1y} y2={miny} stroke="#ddd" strokeWidth={1} />
            <line x1={boxLeft} x2={boxRight} y1={maxy} y2={maxy} stroke="#ddd" strokeWidth={1} />
            <line x1={boxLeft} x2={boxRight} y1={miny} y2={miny} stroke="#ddd" strokeWidth={1} />
            <rect x={boxLeft} y={q3y} width={boxW} height={Math.max(2, q1y - q3y)} fill="#9ca3af" opacity="0.12" stroke="#9ca3af" />
            <line x1={boxLeft} x2={boxRight} y1={medy} y2={medy} stroke="#60a5fa" strokeWidth={2} />
            <text x={cx} y={height - 4} textAnchor="middle" fontSize="10" fill="#ddd">{k}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DataCleaning({
  fileName: propFileName,
  onBack,
  onNext,
  onNavigateToPredict,
  onNavigateToSites,
  onLogout,
}) {
  const [fileName, setFileName] = useState(() => propFileName || localStorage.getItem("lastUploadedFile") || "");
  const [plots, setPlots] = useState(null);
  const [columns, setColumns] = useState([]);
  const [stats, setStats] = useState({});
  const [sample, setSample] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [removeOutliers, setRemoveOutliers] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    if (propFileName) {
      setFileName(propFileName);
      try { localStorage.setItem("lastUploadedFile", propFileName); } catch (e) {}
    }
  }, [propFileName]);

  // fetch visualize-data with optional remove_outliers
  useEffect(() => {
    if (!fileName) return;
    let aborted = false;
    async function fetchViz() {
      setLoading(true);
      setErrorMsg("");
      setPlots(null);
      try {
        const url = `http://127.0.0.1:8000/visualize-data/?file_name=${encodeURIComponent(fileName)}&remove_outliers=${removeOutliers ? "true" : "false"}`;
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`後端錯誤 ${res.status}: ${text}`);
        }
        const json = await res.json();
        if (aborted) return;
        setColumns(json.columns || []);
        setStats(json.stats || {});
        setSample(json.sample || []);
        setPlots(json.plots || {});
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "無法從後端取得視覺化資料");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    fetchViz();
    return () => { aborted = true; };
  }, [fileName, removeOutliers, propFileName]);

  const cards = useMemo(() => ([
    { key: "scatter_matrix", title: "散佈矩陣 (EAC, GI, TM)" },
    { key: "boxplot_by_month", title: "按月份 Boxplot (EAC)" },
    { key: "boxplot_by_day", title: "按日期 Boxplot (EAC)" },
    { key: "boxplot_by_hour", title: "按小時 Boxplot (EAC)" },
  ]), []);

  // render small scatter for a pair; note: when drawing grid cell (row=v1, col=v2) we want x=col, y=row
  const RenderPairScatter = ({ rowVar, colVar, plots }) => {
    if (!plots || !plots.pairs) return <div className="text-white/40 text-xs">no data</div>;
    // key saved as "X__Y" meaning x=X, y=Y
    const key = `${colVar}__${rowVar}`; // x = colVar, y = rowVar  -> FIX for swapped axes
    const pair = plots.pairs?.[key];
    if (!pair || !pair.x || !pair.y) return <div className="text-white/40 text-xs">no data</div>;
    const pts = [];
    const L = Math.min(pair.x.length, pair.y.length);
    for (let i = 0; i < L; i++) {
      const xv = pair.x[i];
      const yv = pair.y[i];
      if (xv == null || yv == null) continue;
      const xn = Number(xv);
      const yn = Number(yv);
      if (Number.isNaN(xn) || Number.isNaN(yn)) continue;
      pts.push({ x: xn, y: yn });
    }
    if (pts.length === 0) return <div className="text-white/40 text-xs">no data</div>;
    const data = { datasets: [{ data: pts, pointBackgroundColor: "#60a5fa", pointRadius: 2 }] };

    return <div style={{ height: 90 }}><Scatter data={data} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>;
  };

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar
        activePage="predict"
        onNavigateToDashboard={onNavigateToPredict}
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      <div className="w-full border-b border-white/10 bg-white/[.02] px-6 py-3 sticky top-[64px] z-40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined !text-lg">arrow_back</span> 返回上一步
          </button>
          <div className="text-sm font-medium">
            <span className="text-white/40">1. 上傳資料</span><span className="mx-2 text-white/30">/</span>
            <span className="text-primary font-bold">2. 清理資料</span><span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">3. 選擇模型</span><span className="mx-2 text-white/30">/</span>
            <span className="text-white/40">4. 輸出結果</span>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">資料檢視與離群值處理</h1>
          <p className="text-white/60">系統已依上傳檔案自動產生視覺化預覽。讀取檔案：<span className="text-white/80 ml-2">{fileName || "尚未指定檔案"}</span></p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-white">離群值處理選項</div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${removeOutliers ? 'bg-primary' : 'bg-white/20'}`} onClick={() => setRemoveOutliers(!removeOutliers)}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${removeOutliers ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <div className="text-xs text-white/50">偵測到若干離群點，切換以排除</div>
          </div>
          <div className="text-sm text-white/50">（切換會重新載入視覺化）</div>
        </div>

        {loading && <div className="text-center text-white/60 py-8">視覺化載入中...</div>}

        {!loading && errorMsg && (
          <div className="rounded-lg border border-red-600/30 bg-red-600/5 p-4 text-red-300">
            <div className="font-medium">取得視覺化資料失敗：</div>
            <div className="text-sm mt-1">{errorMsg}</div>
            <div className="mt-2 text-xs text-white/40">請確認後端是否正在執行，並且 file_name 與 uploads 資料夾內檔案一致。</div>
          </div>
        )}

        {!loading && !errorMsg && plots && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map(card => (
                <div key={card.key} className="rounded-xl border border-white/10 bg-white/[.02] p-5 hover:bg-white/[.04] transition-all cursor-pointer" onClick={() => setSelectedCard(card.key)}>
                  <h3 className="text-sm font-medium text-white/80">{card.title}</h3>

                  <div className="mt-3">
                    {card.key === "scatter_matrix" && plots.scatter_matrix && (
                      <div className="grid grid-cols-3 gap-2 bg-black/10 p-2 rounded">
                        {plots.scatter_matrix.variables.map((v1, i) => (
                          plots.scatter_matrix.variables.map((v2, j) => {
                            if (i === j) {
                              const hist = plots.scatter_matrix.hist?.[v1] || { bins: [], counts: [] };
                              return (
                                <div key={`${v1}_${v2}`} className="p-1 bg-black/5 rounded">
                                  <div className="text-xs text-white/60 mb-1">{v1}</div>
                                  <HistogramSVG bins={hist.bins} counts={hist.counts} height={70} />
                                </div>
                              );
                            } else {
                              return (
                                <div key={`${v1}_${v2}`} className="p-1 bg-black/5 rounded">
                                  <div className="text-[10px] text-white/50 mb-1">{v1} vs {v2}</div>
                                  <RenderPairScatter rowVar={v1} colVar={v2} plots={plots.scatter_matrix} />
                                </div>
                              );
                            }
                          })
                        ))}
                      </div>
                    )}

                    {card.key === "boxplot_by_month" && <div><div className="text-xs text-white/50 mb-2">按月份（1-12）</div><BoxplotSVG groups={plots.boxplot_by_month || {}} width={420} height={140} /></div>}
                    {card.key === "boxplot_by_day" && <div><div className="text-xs text-white/50 mb-2">按日期（1-31）</div><BoxplotSVG groups={plots.boxplot_by_day || {}} width={420} height={140} /></div>}
                    {card.key === "boxplot_by_hour" && <div><div className="text-xs text-white/50 mb-2">按小時（0-23）</div><BoxplotSVG groups={plots.boxplot_by_hour || {}} width={420} height={140} /></div>}
                  </div>

                  <div className="mt-4 text-xs text-white/50">點擊可放大查看</div>
                </div>
              ))}
            </div>

            {/* stats + sample */}
            <div className="rounded-xl border border-white/10 bg-white/[.02] p-4 mt-6">
              <h3 className="text-sm font-bold text-white mb-2">資料摘要 / 檢視</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/10 p-3 rounded">
                  <div className="text-xs text-white/50 mb-2">前 5 筆</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead><tr>{columns.slice(0,8).map(c => <th key={c} className="px-2 py-1 text-left text-white/60">{c}</th>)}</tr></thead>
                      <tbody>{sample.map((r, i) => <tr key={i} className="border-t border-white/5">{columns.slice(0,8).map(c => <td key={c} className="px-2 py-1">{String(r[c] ?? "")}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-black/10 p-3 rounded">
                  <div className="text-xs text-white/50 mb-2">部分統計</div>
                  <pre className="text-xs text-white/50 max-h-48 overflow-auto">{JSON.stringify(stats || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 backdrop-blur-lg p-4 px-6 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="text-sm text-white/60">視覺化已依上傳檔案產生。</div>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="rounded-lg border border-white/10 px-6 py-2 text-sm font-bold text-white hover:bg-white/10">返回</button>
            <button onClick={() => onNext && onNext({ fileName, removeOutliers })} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-background-dark hover:scale-105">下一步</button>
          </div>
        </div>
      </div>

      {/* modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedCard(null)}>
          <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-[#1E1E1E] p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedCard(null)} className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:bg-white/10"><span className="material-symbols-outlined">close</span></button>
            <h3 className="text-xl text-white mb-4">
              {selectedCard === "scatter_matrix" ? "散佈矩陣（放大）" : (selectedCard === "boxplot_by_month" ? "按月份 Boxplot" : (selectedCard === "boxplot_by_day" ? "按日期 Boxplot" : "按小時 Boxplot"))}
            </h3>

            <div className="w-full">
              {selectedCard === "scatter_matrix" && plots.scatter_matrix && (
                <div className="grid grid-cols-3 gap-3">
                  {plots.scatter_matrix.variables.map((v1, i) => (
                    plots.scatter_matrix.variables.map((v2, j) => {
                      if (i === j) {
                        const hist = plots.scatter_matrix.hist?.[v1] || { bins: [], counts: [] };
                        return (
                          <div key={`${v1}_${v2}`} className="bg-black/5 p-2 rounded">
                            <div className="text-sm text-white/70 mb-2">{v1}</div>
                            <HistogramSVG bins={hist.bins} counts={hist.counts} height={140} />
                          </div>
                        );
                      } else {
                        return (
                          <div key={`${v1}_${v2}`} className="bg-black/5 p-2 rounded">
                            <div className="text-xs text-white/50 mb-1">{v1} vs {v2}</div>
                            <RenderPairScatter rowVar={v1} colVar={v2} plots={plots.scatter_matrix} />
                          </div>
                        );
                      }
                    })
                  ))}
                </div>
              )}

              {selectedCard === "boxplot_by_month" && <BoxplotSVG groups={plots.boxplot_by_month || {}} width={900} height={320} />}
              {selectedCard === "boxplot_by_day" && <BoxplotSVG groups={plots.boxplot_by_day || {}} width={900} height={320} />}
              {selectedCard === "boxplot_by_hour" && <BoxplotSVG groups={plots.boxplot_by_hour || {}} width={900} height={320} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
