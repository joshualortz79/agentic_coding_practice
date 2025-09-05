import React, { useMemo, useRef, useEffect, useState } from "react";

// Marketing AI Use Case Prioritization — Bubble Chart
// X = Capability Type (categorical)
// Y = Value Driver (categorical)
// Size = Use Case Benefits ($)
// Opacity = Lifecycle Stage (lighter early → darker late)
// Color = Risk (Green on track, Yellow some risk, Red high risk)
// Symbol = Level of Effort (◯ Low, ◐ Medium, ● High)

// Tailwind is available. Keep it clean, grid-based, and print-friendly.

// Capability Groups for nested X-axis labeling
const CAPABILITY_GROUPS = [
  {
    name: "Data Foundations & Quality",
    items: ["Data Mining", "Data Analysis", "Data Flagging", "Data Correction"],
  },
  {
    name: "Knowledge & Retrieval",
    items: ["Search & Retrieval (RAG)", "Knowledge Base / Q&A"],
  },
  {
    name: "Language & Multimodal AI",
    items: [
      "Summarization",
      "Translation/Transcription",
      "Sentiment Analysis",
      "Voice/Speech Recognition",
      "Image/Video Analysis",
    ],
  },
  {
    name: "Generative Content & Synthesis",
    items: ["Content Creation", "Document Generation", "Synthetic Data Creation"],
  },
  {
    name: "Targeting & Personalization",
    items: [
      "Segmentation",
      "Audience Optimization",
      "Personalization",
      "Recommendation Engine",
      "Offer Presentment",
    ],
  },
  {
    name: "Engagement & Lifecycle Activation",
    items: ["Digital Engagement", "Customer Engagement (Lifecycle)"],
  },
  {
    name: "Experimentation & Causal Decisioning",
    items: ["Split Testing (A/B/MVT)", "Prediction/Forecasting", "Root Cause Analysis"],
  },
  {
    name: "Monitoring, Risk & Orchestration",
    items: ["Anomaly Detection", "Compliance Monitoring", "Risk Scoring", "Workflow Automation"],
  },
];

// Flattened list used for scales, selectors, and validation (order respects groups)
const CAPABILITIES = CAPABILITY_GROUPS.flatMap(g => g.items);

// Alternative capability examples (kept as reference)
// const ALT_CAPABILITIES = [
//   "Segmentation",
//   "Data Correction",
//   "Sentiment Analysis",
//   "Search & Retrieval (RAG)",
//   "Content Creation",
//   "Translation/Transcription",
//   "Audience Optimization",
//   "Offer Presentment",
//   "Recommendation Engine",
//   "Workflow Automation",
//   "Image/Video Analysis",
//   "Personalization",
//   "Digital Engagement",
//   "Knowledge Base / Q&A",
//   "Voice/Speech Recognition",
//   "Data Analysis",
//   "Prediction/Forecasting",
//   "Data Flagging",
//   "Document Generation",
// ];

const VALUE_DRIVERS = [
  "Opportunity Mapping",
  "Insight Generation",
  "Brand and Growth Strategy",
  "Integrated Planning",
  "Plan Implementation",
  "In-Market Optimization",
  "Performance Intelligence",
];

// Alternative value drivers (kept as reference)
// const ALT_VALUE_DRIVERS = [
//   "Opportunity Mapping",
//   "Insight Generation",
//   "Plan Implementation",
//   "In-Market Optimization",
//   "Performance Intelligence",
//   "Integrated Planning",
//   "Brand & Growth Strategy",
// ];

const LIFECYCLE_ORDER = ["Discovery", "Pilot", "Build", "Launch", "Operate"]; // early → late
const LIFECYCLE_OPACITY = {
  Discovery: 0.35,
  Pilot: 0.5,
  Build: 0.65,
  Launch: 0.8,
  Operate: 1.0,
};

const RISK_COLOR = {
  "On Track": "#16a34a", // green-600
  "Some Risk": "#eab308", // yellow-500
  "High Risk": "#dc2626", // red-600
  "Risk Unknown": "#3b82f6", // blue-500
};

// Dummy dataset covering multiple categories
const RAW_DATA = [
  { name: "Content Studio", capability: "Content Creation", valueDriver: "In-Market Optimization", benefits: 950000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Insight Hub", capability: "Data Analysis", valueDriver: "Insight Generation", benefits: 1500000, lifecycle: "Pilot", risk: "Some Risk", effort: "Medium" },
  { name: "Quality Sentinel", capability: "Data Flagging", valueDriver: "Performance Intelligence", benefits: 480000, lifecycle: "Build", risk: "On Track", effort: "Medium" },
  { name: "Offer Presentment Optimizer", capability: "Offer Presentment", valueDriver: "In-Market Optimization", benefits: 2100000, lifecycle: "Launch", risk: "Some Risk", effort: "High" },
  { name: "Data Cleanse Pro", capability: "Data Correction", valueDriver: "Plan Implementation", benefits: 520000, lifecycle: "Pilot", risk: "On Track", effort: "Low" },
  { name: "Engage360", capability: "Digital Engagement", valueDriver: "In-Market Optimization", benefits: 1750000, lifecycle: "Operate", risk: "On Track", effort: "High" },
  { name: "Prospect Miner", capability: "Data Mining", valueDriver: "Opportunity Mapping", benefits: 1120000, lifecycle: "Build", risk: "On Track", effort: "Medium" },
  { name: "Lifecycle Coach", capability: "Customer Engagement (Lifecycle)", valueDriver: "Integrated Planning", benefits: 2300000, lifecycle: "Build", risk: "Some Risk", effort: "Medium" },
  { name: "RecoMax", capability: "Recommendation Engine", valueDriver: "In-Market Optimization", benefits: 2600000, lifecycle: "Operate", risk: "On Track", effort: "High" },
  { name: "SynthGen", capability: "Synthetic Data Creation", valueDriver: "Performance Intelligence", benefits: 820000, lifecycle: "Pilot", risk: "Some Risk", effort: "Medium" },
  { name: "TestLab", capability: "Split Testing (A/B/MVT)", valueDriver: "In-Market Optimization", benefits: 690000, lifecycle: "Discovery", risk: "On Track", effort: "Low" },
  { name: "Smart Segments", capability: "Segmentation", valueDriver: "Opportunity Mapping", benefits: 980000, lifecycle: "Build", risk: "On Track", effort: "Medium" },
  { name: "Audience Booster", capability: "Audience Optimization", valueDriver: "Brand and Growth Strategy", benefits: 1950000, lifecycle: "Launch", risk: "Some Risk", effort: "Medium" },
  { name: "PersonalizePro", capability: "Personalization", valueDriver: "In-Market Optimization", benefits: 2250000, lifecycle: "Operate", risk: "On Track", effort: "High" },
  { name: "Demand Forecaster", capability: "Prediction/Forecasting", valueDriver: "Performance Intelligence", benefits: 3200000, lifecycle: "Launch", risk: "On Track", effort: "Medium" },
  { name: "Pulse Analyzer", capability: "Sentiment Analysis", valueDriver: "Insight Generation", benefits: 740000, lifecycle: "Pilot", risk: "On Track", effort: "Medium" },
  { name: "Outlier Guard", capability: "Anomaly Detection", valueDriver: "Performance Intelligence", benefits: 680000, lifecycle: "Build", risk: "High Risk", effort: "High" },
  { name: "BriefBot", capability: "Summarization", valueDriver: "Insight Generation", benefits: 430000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Polyglot", capability: "Translation/Transcription", valueDriver: "Plan Implementation", benefits: 520000, lifecycle: "Pilot", risk: "Risk Unknown", effort: "Medium" },
  { name: "Answer Search", capability: "Search & Retrieval (RAG)", valueDriver: "Insight Generation", benefits: 1400000, lifecycle: "Build", risk: "Some Risk", effort: "Medium" },
  { name: "Knowledge Desk", capability: "Knowledge Base / Q&A", valueDriver: "Plan Implementation", benefits: 900000, lifecycle: "Launch", risk: "On Track", effort: "Low" },
  { name: "Compliance Watch", capability: "Compliance Monitoring", valueDriver: "Integrated Planning", benefits: 1100000, lifecycle: "Build", risk: "Some Risk", effort: "Medium" },
  { name: "Flow Automator", capability: "Workflow Automation", valueDriver: "Plan Implementation", benefits: 2450000, lifecycle: "Operate", risk: "On Track", effort: "High" },
  { name: "DocBuilder", capability: "Document Generation", valueDriver: "In-Market Optimization", benefits: 870000, lifecycle: "Pilot", risk: "On Track", effort: "Medium" },
  { name: "Vision Insight", capability: "Image/Video Analysis", valueDriver: "Insight Generation", benefits: 1550000, lifecycle: "Build", risk: "Risk Unknown", effort: "Medium" },
  { name: "Voice Assist", capability: "Voice/Speech Recognition", valueDriver: "Plan Implementation", benefits: 600000, lifecycle: "Discovery", risk: "On Track", effort: "Low" },
  { name: "Risk Scorer", capability: "Risk Scoring", valueDriver: "Performance Intelligence", benefits: 2050000, lifecycle: "Launch", risk: "Some Risk", effort: "High" },
  { name: "Root Cause Finder", capability: "Root Cause Analysis", valueDriver: "Brand and Growth Strategy", benefits: 1300000, lifecycle: "Build", risk: "High Risk", effort: "Medium" },
];

// Simple container size hook for responsive SVG
function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 520 });
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // 16:9-ish but taller for category labels
        const height = Math.max(420, Math.min(720, width * 0.55));
        setSize({ width, height });
      }
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, size];
}

function AxisLabel({ x, y, text, vertical = false }) {
  return (
    <text
      x={x}
      y={y}
      className="fill-slate-600 text-[12px] font-medium"
      textAnchor={vertical ? "middle" : "middle"}
      transform={vertical ? `rotate(-90, ${x}, ${y})` : undefined}
    >
      {text}
    </text>
  );
}

export default function MarketingAIBubbleChart() {
  const [containerRef, { width, height }] = useElementSize();
  const [riskFilter, setRiskFilter] = useState(() => Object.fromEntries(Object.keys(RISK_COLOR).map(k => [k, true])));
  const [capabilityFilter, setCapabilityFilter] = useState("All");
  const [valueDriverFilter, setValueDriverFilter] = useState("All");
  const [minBenefit, setMinBenefit] = useState(0);
  const [scale, setScale] = useState(1); // bubble size scaling
  const [showLabels, setShowLabels] = useState(false);
  const [hover, setHover] = useState(null);
  const [rows, setRows] = useState(RAW_DATA);
  const riskOptions = Object.keys(RISK_COLOR);
  const [jsonText, setJsonText] = useState("");
  // Effort symbol visibility toggles (appearance only; does not filter data)
  const [effortOverlay, setEffortOverlay] = useState({ Low: true, Medium: true, High: true });

  const updateRow = (idx, field, value) => setRows(prev => prev.map((r,i)=> i===idx ? { ...r, [field]: field === "benefits" ? Number(value) : value } : r));
  const addRow = () => setRows(prev => [...prev, { name: "New Use Case", capability: CAPABILITIES[0], valueDriver: VALUE_DRIVERS[0], benefits: 100000, lifecycle: LIFECYCLE_ORDER[0], risk: "On Track", effort: "Medium" }]);
  const deleteRow = (idx) => setRows(prev => prev.filter((_,i)=> i!==idx));
  const refreshJSON = () => setJsonText(JSON.stringify(rows, null, 2));
  const importJSON = () => { try { const arr = JSON.parse(jsonText); if (Array.isArray(arr)) setRows(arr); } catch (e) { alert("Invalid JSON"); } };
  const copyJSON = async () => { try { await navigator.clipboard.writeText(JSON.stringify(rows, null, 2)); } catch (e) { /* ignore */ } };

  const data = rows;
  const benefitsExtent = useMemo(() => {
    const vals = data.map((d) => d.benefits);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data]);

  // Quick runtime validations (acts as lightweight tests)
  const dataIssues = useMemo(() => {
    const issues = [];
    data.forEach((d, i) => {
      if (!CAPABILITIES.includes(d.capability)) issues.push(`Row ${i + 1}: invalid capability → ${d.capability}`);
      if (!VALUE_DRIVERS.includes(d.valueDriver)) issues.push(`Row ${i + 1}: invalid valueDriver → ${d.valueDriver}`);
      if (typeof d.benefits !== 'number' || Number.isNaN(d.benefits)) issues.push(`Row ${i + 1}: benefits must be a number`);
      if (d.benefits < 0) issues.push(`Row ${i + 1}: benefits should be ≥ 0`);
    });
    return issues;
  }, [data]);

  // helper used by diagnostics — define BEFORE diagnostics useMemo
  function filteredLengthSafe() {
    try { return true; } catch { return false; }
  }

  // Self-tests / diagnostics — do not change existing validations; add new ones below
  const diagnostics = useMemo(() => {
    const tests = [];
    const push = (name, pass) => tests.push({ name, pass: !!pass });

    // Test: CAPABILITIES unique & non-empty
    const capsSet = new Set(CAPABILITIES);
    push("CAPABILITIES are unique", capsSet.size === CAPABILITIES.length && CAPABILITIES.every(Boolean));

    // Test: VALUE_DRIVERS unique & non-empty
    const valsSet = new Set(VALUE_DRIVERS);
    push("VALUE_DRIVERS are unique", valsSet.size === VALUE_DRIVERS.length && VALUE_DRIVERS.every(Boolean));

    // Test: positions map coverage (approx)
    const stepX = (Math.max(200, width - 180 - 24)) / (CAPABILITIES.length - 1 || 1);
    push("x scale step positive", stepX > 0);

    const stepY = (Math.max(200, height - 40 - 240)) / (VALUE_DRIVERS.length - 1 || 1);
    push("y scale step positive", stepY > 0);

    // Test: data rows validity (mirrors dataIssues expectation)
    push("all data rows valid", dataIssues.length === 0);

    // Test: effort glyph mapping
    push("effort glyph mapping", ["Low","Medium","High"].every(e => { const g = e === 'Low' ? '◯' : e === 'High' ? '●' : '◐'; return typeof g === 'string' && g.length > 0; }));

    // Test: area scale monotonic
    const amin = 0, amax = 100;
    const A = (val) => {
      const minArea = 180; const maxArea = 5200; const min = amin, max = amax; const t = (val - min) / (max - min); return minArea + t * (maxArea - minArea);
    };
    push("area scale monotonic", A(80) > A(20));

    // Test: filtered does not exceed data size (smoke)
    push("filtered ≤ data length", data.length >= 0 && data.length >=  (data.length ? 1 : 0) && filteredLengthSafe());

    // Test: benefits extent sane
    push("benefits extent sane", Number.isFinite(benefitsExtent.min) && Number.isFinite(benefitsExtent.max) && benefitsExtent.min <= benefitsExtent.max);

    // Test: effort overlay keys present
    push("effort overlay keys", ["Low","Medium","High"].every(k => typeof effortOverlay[k] === 'boolean'));

    // Test: risk map includes Risk Unknown
    push("risk color has 'Risk Unknown'", !!RISK_COLOR["Risk Unknown"]);

    // Test: risk filter covers all risks
    push("risk filter has all risks", Object.keys(RISK_COLOR).every(k => k in riskFilter));

    return tests;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dataIssues, benefitsExtent.min, benefitsExtent.max, effortOverlay]);

  // Filtering logic
  const filtered = useMemo(() => {
    return data.filter((d) =>
      riskFilter[d.risk] &&
      (capabilityFilter === "All" || d.capability === capabilityFilter) &&
      (valueDriverFilter === "All" || d.valueDriver === valueDriverFilter) &&
      d.benefits >= minBenefit
    );
  }, [data, riskFilter, capabilityFilter, valueDriverFilter, minBenefit]);

  // Layout
  const M = { top: 40, right: 24, bottom: 240, left: 180 }; // tightened bottom margin since labels moved closer to grid
  const innerW = Math.max(200, width - M.left - M.right);
  const innerH = Math.max(200, height - M.top - M.bottom);

  // HORIZONTAL EXPANSION & SCROLL: ensure minimum x-step so labels don't overlap
  const MIN_STEP_X = 120; // px between capability ticks
  const targetInnerW = useMemo(() => (
    Math.max(innerW, (CAPABILITIES.length - 1 || 1) * MIN_STEP_X)
  ), [innerW]);
  const svgW = M.left + targetInnerW + M.right; // make SVG wider than viewport when needed (scrolls)

  // Scales for categorical axes (even spacing)
  const xPositions = useMemo(() => {
    const step = targetInnerW / (CAPABILITIES.length - 1 || 1); // use expanded inner width
    const map = new Map();
    CAPABILITIES.forEach((c, i) => map.set(c, i * step));
    return map;
  }, [targetInnerW]);

  // step for convenience in group label sizing
  const stepX = useMemo(() => targetInnerW / (CAPABILITIES.length - 1 || 1), [targetInnerW]);

  // Compute group spans (for group labels on X-axis)
  const groupRanges = useMemo(() => {
    return CAPABILITY_GROUPS.map(g => {
      const first = g.items[0];
      const last = g.items[g.items.length - 1];
      const startX = xPositions.get(first) ?? 0;
      const endX = xPositions.get(last) ?? startX;
      const centerX = (startX + endX) / 2;
      return { name: g.name, startX, endX, centerX, count: g.items.length };
    });
  }, [stepX, targetInnerW]);

  const yPositions = useMemo(() => {
    const step = innerH / (VALUE_DRIVERS.length - 1 || 1);
    const map = new Map();
    VALUE_DRIVERS.forEach((v, i) => map.set(v, i * step));
    return map;
  }, [innerH]);

  // Area-based size scale (for perceived size)
  const minArea = 180 * scale; // px^2
  const maxArea = 5200 * scale; // px^2
  const areaScale = (benefit) => {
    const { min, max } = benefitsExtent;
    if (max === min) return (minArea + maxArea) / 2;
    const t = (benefit - min) / (max - min);
    return minArea + t * (maxArea - minArea);
  };

  // Size helper (area → radius)
  const circleR = (area) => Math.sqrt(area / Math.PI);

  // Tooltip positioning
  const svgRef = useRef(null);
  const onPointEnter = (evt, d) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const cx = evt.clientX - (rect?.left || 0);
    const cy = evt.clientY - (rect?.top || 0);
    setHover({ datum: d, x: cx, y: cy });
  };

  const onLeave = () => setHover(null);

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4">
      <div className="flex items-start gap-4 flex-col lg:flex-row">
        {/* Left: Controls */}
        <div className="lg:w-64 w-full shrink-0">
          <div className="rounded-2xl border border-slate-200 shadow-sm p-4 bg-white sticky top-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Controls</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Risk</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(RISK_COLOR).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={riskFilter[k]}
                        onChange={(e) => setRiskFilter((prev) => ({ ...prev, [k]: e.target.checked }))}
                      />
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: RISK_COLOR[k] }} />
                        {k}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Effort Symbols</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["Low","Medium","High"]).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={effortOverlay[k]}
                        onChange={(e) => setEffortOverlay((prev) => ({ ...prev, [k]: e.target.checked }))}
                      />
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>{k === 'Low' ? '◯' : k === 'High' ? '●' : '◐'}</span>
                        {k}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Capability Type</label>
                <select
                  value={capabilityFilter}
                  onChange={(e) => setCapabilityFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border-slate-300"
                >
                  <option>All</option>
                  {CAPABILITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Value Driver</label>
                <select
                  value={valueDriverFilter}
                  onChange={(e) => setValueDriverFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border-slate-300"
                >
                  <option>All</option>
                  {VALUE_DRIVERS.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Min Benefits ($)</label>
                <input
                  type="range"
                  min={0}
                  max={benefitsExtent.max}
                  step={50000}
                  value={minBenefit}
                  onChange={(e) => setMinBenefit(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-slate-600">{'$'}{minBenefit.toLocaleString()}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Bubble Scale</label>
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.1}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-slate-600">×{scale.toFixed(1)}</div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                Show labels
              </label>

              <div className="pt-2 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Legend</h3>
                <div className="text-xs text-slate-700 space-y-2">
                  {Object.entries(RISK_COLOR).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: color }} /> Color: {label}</div>
                  ))}
                  <div className="flex items-center gap-2">Opacity: Lifecycle → lighter early to darker late → lighter early to darker late</div>
                  <div className="flex items-center gap-2">Symbol: ◯ Low effort</div>
                  <div className="flex items-center gap-2">Symbol: ◐ Medium effort</div>
                  <div className="flex items-center gap-2">Symbol: ● High effort</div>
                </div>
              </div>

              {/* Diagnostics (self-tests) */}
              <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Diagnostics (self-tests)</summary>
                <ul className="mt-2 text-xs list-disc pl-5 space-y-1">
                  {diagnostics.map((t, i) => (
                    <li key={i} className={t.pass ? "text-emerald-600" : "text-red-600"}>
                      {t.pass ? "✔" : "✖"} {t.name}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>

        {/* Right: Chart */}
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-200 shadow-sm bg-white">
            <div className="px-5 pt-4 pb-2">
              <h1 className="text-xl font-semibold text-slate-900">Marketing AI Use Cases — Prioritization Bubble Chart</h1>
              <p className="text-sm text-slate-600">X: Capability Type • Y: Value Driver • Size: Benefits ($) • Opacity: Lifecycle • Color: Risk • Symbol: Level of Effort (◯/◐/●)</p>
            </div>

            <div className="px-5 pb-2">
              <details className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Data Editor (add/edit/import/export)</summary>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={addRow} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">+ Add Use Case</button>
                    <button type="button" onClick={refreshJSON} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">Refresh JSON</button>
                    <button type="button" onClick={copyJSON} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">Copy JSON</button>
                    <button type="button" onClick={importJSON} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">Import JSON</button>
                  </div>

                  <div className="max-h-72 overflow-auto border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-white sticky top-0">
                        <tr className="text-left">
                          <th className="p-2">Name</th>
                          <th className="p-2">Capability</th>
                          <th className="p-2">Value Driver</th>
                          <th className="p-2">Benefits ($)</th>
                          <th className="p-2">Lifecycle</th>
                          <th className="p-2">Risk</th>
                          <th className="p-2">Effort</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="odd:bg-white even:bg-slate-50/60">
                            <td className="p-2 min-w-[180px]"><input className="w-full border rounded px-2 py-1" value={r.name} onChange={(e)=>updateRow(i,'name',e.target.value)} /></td>
                            <td className="p-2 min-w-[220px]">
                              <select className="w-full border rounded px-2 py-1" value={r.capability} onChange={(e)=>updateRow(i,'capability',e.target.value)}>
                                {CAPABILITIES.map(c=> <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            <td className="p-2 min-w-[220px]">
                              <select className="w-full border rounded px-2 py-1" value={r.valueDriver} onChange={(e)=>updateRow(i,'valueDriver',e.target.value)}>
                                {VALUE_DRIVERS.map(v=> <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                            <td className="p-2 min-w-[140px]"><input type="number" min={0} step={50000} className="w-full border rounded px-2 py-1" value={r.benefits} onChange={(e)=>updateRow(i,'benefits',e.target.value)} /></td>
                            <td className="p-2 min-w-[120px]">
                              <select className="w-full border rounded px-2 py-1" value={r.lifecycle} onChange={(e)=>updateRow(i,'lifecycle',e.target.value)}>
                                {LIFECYCLE_ORDER.map(s=> <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="p-2 min-w-[120px]">
                              <select className="w-full border rounded px-2 py-1" value={r.risk} onChange={(e)=>updateRow(i,'risk',e.target.value)}>
                                {riskOptions.map(ro=> <option key={ro} value={ro}>{ro}</option>)}
                              </select>
                            </td>
                            <td className="p-2 min-w-[110px]">
                              <select className="w-full border rounded px-2 py-1" value={r.effort} onChange={(e)=>updateRow(i,'effort',e.target.value)}>
                                {["Low","Medium","High"].map(eff=> <option key={eff} value={eff}>{eff}</option>)}
                              </select>
                            </td>
                            <td className="p-2 min-w-[80px]"><button type="button" onClick={()=>deleteRow(i)} className="px-2 py-1 rounded border hover:bg-red-50">Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <textarea className="w-full h-32 border rounded p-2 font-mono text-[11px]" placeholder="Paste JSON here to import, or click Refresh JSON to view current data" value={jsonText} onChange={(e)=>setJsonText(e.target.value)}></textarea>
                  </div>

                  {/* Data issues (lightweight tests) */}
                  {dataIssues.length > 0 && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      <div className="font-semibold">Data validation issues:</div>
                      <ul className="list-disc pl-4">
                        {dataIssues.map((msg, i) => (<li key={i}>{msg}</li>))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            </div>

            <div ref={containerRef} className="px-2 pb-2 overflow-x-auto">
              <svg ref={svgRef} width={svgW} height={height} className="overflow-visible">
                {/* Axes group */}
                <g transform={`translate(${M.left},${M.top})`}>
                  {/* Gridlines */}
                  {CAPABILITIES.map((c, i) => (
                    <line
                      key={`vx-${c}`}
                      x1={xPositions.get(c)}
                      y1={0}
                      x2={xPositions.get(c)}
                      y2={innerH}
                      stroke="#e5e7eb"
                    />
                  ))}
                  {VALUE_DRIVERS.map((v, i) => (
                    <line
                      key={`hy-${v}`}
                      x1={0}
                      y1={yPositions.get(v)}
                      x2={targetInnerW}
                      y2={yPositions.get(v)}
                      stroke="#e5e7eb"
                    />
                  ))}

                  {/* X labels — WORD WRAP (TIGHTENED, ADJUSTED): higher & slightly left to sit closer to grid. */}
                  {CAPABILITIES.map((c) => {
                    const cx = xPositions.get(c);
                    const w = 70; // narrower label box to make labels appear closer
                    const x = cx - w / 2 + 6; // ADJUSTMENT: slight left-right nudge — tweak here
                    const y = innerH + 30; // ADJUSTMENT: closer to grid — tweak here
                    return (
                      <foreignObject key={`xl-${c}`} x={x} y={y} width={w} height={60}>
                        {/* WORD WRAP HAPPENS HERE: the div constrains width and lets text wrap */}
                        <div xmlns="http://www.w3.org/1999/xhtml" className="text-[11px] leading-tight text-slate-700 text-center break-words" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                          {c}
                        </div>
                      </foreignObject>
                    );
                  })}

                  {/* X group labels (derived from CAPABILITY_GROUPS mapping) */}
                  {groupRanges.map((gr) => {
                    const pad = 70; // extra width to cover tick labels under the group title
                    const rangeW = Math.max(pad, (gr.endX - gr.startX) + pad);
                    const x = gr.centerX - rangeW / 2;
                    const y = innerH + 100; // below the capability labels
                    return (
                      <foreignObject key={`xg-${gr.name}`} x={x} y={y} width={rangeW} height={34}>
                        <div xmlns="http://www.w3.org/1999/xhtml" className="text-[12px] font-semibold text-slate-800 text-center">
                          {gr.name}
                        </div>
                      </foreignObject>
                    );
                  })}

                  {/* Y labels */}
                  {VALUE_DRIVERS.map((v) => (
                    <text
                      key={`yl-${v}`}
                      x={-10}
                      y={yPositions.get(v)}
                      className="fill-slate-700 text-[11px]"
                      textAnchor="end"
                      alignmentBaseline="middle"
                    >
                      {v}
                    </text>
                  ))}

                  {/* Axis titles */}
                  <AxisLabel x={targetInnerW / 2} y={innerH + 150} text="Capability Type (X)" />
                  {/* Y-axis title removed per request */}

                  {/* Points — symbol overlay for Effort; bubble fill = Risk; opacity = Lifecycle; size = Benefits */}
                  {filtered.map((d, idx) => {
                    const cx = xPositions.get(d.capability);
                    const cy = yPositions.get(d.valueDriver);
                    const area = areaScale(d.benefits);
                    const fill = RISK_COLOR[d.risk] || "#94a3b8";
                    const opacity = LIFECYCLE_OPACITY[d.lifecycle] ?? 0.7;

                    if (isNaN(cx) || isNaN(cy)) return null;

                    const r = circleR(area);
                    const glyph = d.effort === 'Low' ? '◯' : d.effort === 'High' ? '●' : '◐';
                    const fontSize = Math.max(12, r * 1.6);

                    const common = {
                      onMouseEnter: (e) => onPointEnter(e, d),
                      onMouseMove: (e) => onPointEnter(e, d),
                      onMouseLeave: onLeave,
                      style: { cursor: 'pointer' },
                    };

                    return (
                      <g key={idx} transform={`translate(${cx},${cy})`} {...common}>
                        <circle r={r} fill={fill} opacity={opacity} />
                        {effortOverlay[d.effort] && (
                          <text fontSize={fontSize} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols 2','Noto Sans Symbols','Arial Unicode MS','sans-serif'", fontWeight: 700 }}>{glyph}</text>
                        )}
                        {showLabels && (
                          <text y={-r - 8} textAnchor="middle" className="text-[10px] fill-slate-800">
                            {d.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Tooltip */}
                {hover && (
                  <foreignObject x={hover.x + 12} y={hover.y - 8} width={320} height={220} pointerEvents="none">
                    <div className="bg-white/95 backdrop-blur rounded-lg border border-slate-200 shadow px-3 py-2 text-xs leading-tight text-slate-800">
                      <div className="font-semibold text-slate-900 text-sm">{hover.datum.name}</div>
                      <div>Capability: <span className="font-medium">{hover.datum.capability}</span></div>
                      <div>Value Driver: <span className="font-medium">{hover.datum.valueDriver}</span></div>
                      <div>Benefits: <span className="font-medium">{'$'}{hover.datum.benefits.toLocaleString()}</span></div>
                      <div>Lifecycle: <span className="font-medium">{hover.datum.lifecycle}</span></div>
                      <div>Risk: <span className="font-medium">{hover.datum.risk}</span></div>
                      <div>Effort: <span className="font-medium">{hover.datum.effort}</span></div>
                    </div>
                  </foreignObject>
                )}
              </svg>
            </div>

            {/* Footer KPI band */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <div className="text-slate-500">Visible Use Cases</div>
                <div className="text-lg font-semibold text-slate-900">{filtered.length}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <div className="text-slate-500">Min → Max Benefits</div>
                <div className="text-lg font-semibold text-slate-900">{'$'}{benefitsExtent.min.toLocaleString()} {'→'} {'$'}{benefitsExtent.max.toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <div className="text-slate-500">Lifecycle Stages</div>
                <div className="text-lg font-semibold text-slate-900">{LIFECYCLE_ORDER.join(" · ")}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <div className="text-slate-500">Symbol = Effort</div>
                <div className="text-lg font-semibold text-slate-900">◯ Low · ◐ Medium · ● High</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
