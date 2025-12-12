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

// ===== Histogram =====
function HistogramSVG({ bins = [], counts = [], height = 80 }) {
  if (!bins || bins.length < 2 || !counts)
    return <div className="text-white/40 text-xs">無資料</div>;
  const maxCount = Math.max(...counts, 1);
  const width = 120;
  const barWidth = width / counts.length;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {counts.map((c, i) => {
        const h = (c / maxCount) * (height - 10);
        return (
          <rect
            key={i}
            x={i * barWidth + 1}
            y={height - h - 2}
            width={Math.max(1, barWidth - 2)}
            height={h}
            fill="#60a5fa"
            opacity="0.8"
          />
        );
      })}
    </svg>
  );
}

// ===== Boxplot =====
function BoxplotSVG({ groups = {}, width = 420, height = 160 }) {
  const keys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));
  if (keys.length === 0)
    return <div className="text-white/40 text-sm">無分組資料</div>;

  const all = [];
  keys.forEach((k) => {
    const g = groups[k];
    if (g) all.push(g.min, g.q1, g.median, g.q3, g.max);
  });

  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.06 || 1;

  const mapY = (v) => {
    const usable = height - 30;
    return 15 + usable - ((v - (min - pad)) / (max + pad - (min - pad))) * usable;
  };

  const boxW = Math.max(8, ((width - 40) / keys.length) * 0.5);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {keys.map((k, i) => {
        const g = groups[k];
        if (!g) return null;

        const cx =
          20 +
          i * ((width - 40) / keys.length) +
          ((width - 40) / keys.length) / 2;

        const q1 = mapY(g.q1);
        const q3 = mapY(g.q3);
        const med = mapY(g.median);
        const minY = mapY(g.min);
        const maxY = mapY(g.max);

        return (
          <g key={k}>
            <line x1={cx} x2={cx} y1={maxY} y2={q3} stroke="#ccc" />
            <line x1={cx} x2={cx} y1={q1} y2={minY} stroke="#ccc" />

            <rect
              x={cx - boxW / 2}
              y={q3}
              width={boxW}
              height={Math.max(2, q1 - q3)}
              fill="#888"
              opacity="0.12"
              stroke="#888"
            />

            <line
              x1={cx - boxW / 2}
              x2={cx + boxW / 2}
              y1={med}
              y2={med}
              stroke="#60a5fa"
              strokeWidth={2}
            />

            <text
              x={cx}
              y={height - 4}
              fontSize={10}
              fill="#ddd"
              textAnchor="middle"
            >
              {k}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DataCleaning({
  dataId,
  fileName,
  onBack,
  onNext,
  onNavigateToPredict,
  onNavigateToSites,
  onLogout,
}) {
  const [plots, setPlots] = useState(null);
  const [columns, setColumns] = useState([]);
  const [stats, setStats] = useState({});
  const [sample, setSample] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [removeOutliers, setRemoveOutliers] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // ==========================================
  // ⭐ 正確的 useEffect：用 dataId，而不是 fileName
  // ==========================================
  useEffect(() => {
    if (!dataId) return;

    let aborted = false;

    async function fetchViz() {
      setLoading(true);
      setErrorMsg("");
      setPlots(null);

      try {
        const url = `http://127.0.0.1:8000/visualize/site-data?data_id=${dataId}&remove_outliers=${removeOutliers}`;

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

        // ⭐ 正確的值 (後端沒有 json.plots)
        setPlots({
          scatter_matrix: json.scatter_matrix,
          boxplot_by_month: json.boxplot_by_month,
          boxplot_by_day: json.boxplot_by_day,
          boxplot_by_hour: json.boxplot_by_hour,
        });
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "無法從後端取得視覺化資料");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchViz();
    return () => {
      aborted = true;
    };
  }, [dataId, removeOutliers]);

  // ==========================================
  // Cards
  // ==========================================
  const cards = useMemo(
    () => [
      { key: "scatter_matrix", title: "散佈矩陣 (EAC, GI, TM)" },
      { key: "boxplot_by_month", title: "按月份 Boxplot (EAC)" },
      { key: "boxplot_by_day", title: "按日期 Boxplot (EAC)" },
      { key: "boxplot_by_hour", title: "按小時 Boxplot (EAC)" },
    ],
    []
  );

  // ==========================================
  // Scatter
  // ==========================================
  const RenderPairScatter = ({ rowVar, colVar, plots }) => {
    if (!plots?.pairs) return <div className="text-white/40 text-xs">no data</div>;

    const pair = plots.pairs[`${colVar}__${rowVar}`];
    if (!pair) return <div className="text-white/40 text-xs">no data</div>;

    const pts = [];
    const L = Math.min(pair.x.length, pair.y.length);
    for (let i = 0; i < L; i++) pts.push({ x: pair.x[i], y: pair.y[i] });

    if (!pts.length) return <div className="text-white/40 text-xs">no data</div>;

    return (
      <div style={{ height: 90 }}>
        <Scatter
          data={{ datasets: [{ data: pts, pointRadius: 2 }] }}
          options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-background-dark text-white flex flex-col">
      <Navbar
        activePage="predict"
        onNavigateToPredict={onNavigateToPredict}
        onNavigateToSites={onNavigateToSites}
        onLogout={onLogout}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 py-8">
        <h1 className="text-3xl font-bold mb-4">資料清理</h1>

        {!dataId && (
          <div className="text-red-400">錯誤：沒有 dataId，請返回重新上傳。</div>
        )}

        {loading && <div className="text-white/60">讀取視覺化中...</div>}

        {errorMsg && (
          <div className="text-red-400 border border-red-500/20 p-4 rounded">
            {errorMsg}
          </div>
        )}

        {/* 原本 UI ... */}
      </main>

      <div className="sticky bottom-0 w-full bg-background-dark/80 p-4 flex justify-end">
        <button
          onClick={() => onBack()}
          className="border px-4 py-2 mr-4 rounded"
        >
          返回
        </button>

        <button
          onClick={() => onNext({ dataId, removeOutliers })}
          className="bg-primary px-6 py-2 rounded"
        >
          下一步
        </button>
      </div>
    </div>
  );
}
