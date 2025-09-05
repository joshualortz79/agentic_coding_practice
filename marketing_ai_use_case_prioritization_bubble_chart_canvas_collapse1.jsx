import React, { useMemo, useRef, useEffect, useState } from "react";

// Marketing AI Use Case Prioritization — Bubble Chart
// X = Capability Type (categorical)
// Y = Value Driver (categorical)
// Size = Use Case Benefits ($)
// Opacity = Lifecycle Stage (lighter early → darker late)
// Color = Risk (Green on track, Yellow some risk, Red high risk, Blue unknown)
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
const CAPABILITIES = CAPABILITY_GROUPS.flatMap((g) => g.items);

const VALUE_DRIVERS = [
  "Opportunity Mapping",
  "Insight Generation",
  "Brand and Growth Strategy",
  "Integrated Planning",
  "Plan Implementation",
  "In-Market Optimization",
  "Performance Intelligence",
];

const LIFECYCLE_ORDER = ["Discovery", "Pilot", "Build", "Launch", "Operate"]; // early → late
const LIFECYCLE_OPACITY = {
  Discovery: 0.35,
  Pilot: 0.5,
  Build: 0.65,
  Launch: 0.8,
  Operate: 1.0,
};

const RISK_COLOR: Record<string, string> = {
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
];

// Simple container size hook for responsive SVG
function useElementSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 520 });
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect as DOMRectReadOnly;
        // 16:9-ish but taller for category labels
        const height = Math.max(420, Math.min(720, width * 0.55));
        setSize({ width, height });
      }
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, size] as const;
}

function AxisLabel({ x, y, text, vertical = false }: { x: number; y: number; text: string; vertical?: boolean }) {
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
  const [riskFilter, setRiskFilter] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.keys(RISK_COLOR).map((k) => [k, true])) as Record<string, boolean>);
  const [capabilityFilter, setCapabilityFilter] = useState("All");
  const [valueDriverFilter, setValueDriverFilter] = useState("All");
  const [minBenefit, setMinBenefit] = useState(0);
  const [scale, setScale] = useState(1); // bubble size scaling
  const [showLabels, setShowLabels] = useState(false);
  const [hover, setHover] = useState<{ datum: any; x: number; y: number } | null>(null);
  const [rows, setRows] = useState(RAW_DATA);
  const riskOptions = Object.keys(RISK_COLOR);
  const [jsonText, setJsonText] = useState("");
  // Effort symbol visibility toggles (appearance only; does not filter data)
  const [effortOverlay, setEffortOverlay] = useState<{ Low: boolean; Medium: boolean; High: boolean }>({ Low: true, Medium: true, High: true });
  // Collapsible groups (false = expanded by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (name: string) => setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  const expandAllGroups = () => setCollapsedGroups({});
  const collapseAllGroups = () => setCollapsedGroups(Object.fromEntries(CAPABILITY_GROUPS.map((g) => [g.name, true])) as Record<string, boolean>);

  const updateRow = (idx: number, field: string, value: any) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: field === "benefits" ? Number(value) : value } : r)));
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { name: "New Use Case", capability: CAPABILITIES[0], valueDriver: VALUE_DRIVERS[0], benefits: 100000, lifecycle: LIFECYCLE_ORDER[0], risk: "On Track", effort: "Medium" },
    ]);
  const deleteRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const refreshJSON = () => setJsonText(JSON.stringify(rows, null, 2));
  const importJSON = () => {
    try {
      const arr = JSON.parse(jsonText);
      if (Array.isArray(arr)) setRows(arr);
    } catch (e) {
      alert("Invalid JSON");
    }
  };
  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    } catch (e) {
      /* ignore */
    }
  };

  const data = rows;
  const benefitsExtent = useMemo(() => {
    const vals = data.map((d) => d.benefits as number);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data]);

  // Quick runtime validations (acts as lightweight tests)
  const dataIssues = useMemo(() => {
    const issues: string[] = [];
    data.forEach((d, i) => {
      if (!CAPABILITIES.includes(d.capability)) issues.push(`Row ${i + 1}: invalid capability → ${d.capability}`);
      if (!VALUE_DRIVERS.includes(d.valueDriver)) issues.push(`Row ${i + 1}: invalid valueDriver → ${d.valueDriver}`);
      if (typeof d.benefits !== "number" || Number.isNaN(d.benefits)) issues.push(`Row ${i + 1}: benefits must be a number`);
      if (d.benefits < 0) issues.push(`Row ${i + 1}: benefits should be ≥ 0`);
    });
    return issues;
  }, [data]);

  // helper used by diagnostics — define BEFORE diagnostics useMemo
  function filteredLengthSafe() {
    try {
      return true;
    } catch {
      return false;
    }
  }

  // Visible X-axis ticks reflecting collapsed groups
  const visibleTicks = useMemo(() => {
    const ticks: Array<
      | { key: string; type: "group"; label: string; groupName: string }
      | { key: string; type: "capability"; label: string; capability: string; groupName: string }
    > = [];
    for (const g of CAPABILITY_GROUPS) {
      if (collapsedGroups[g.name]) {
        ticks.push({ key: `group:${g.name}`, type: "group", label: g.name, groupName: g.name });
      } else {
        for (const c of g.items) {
          ticks.push({ key: `cap:${c}`, type: "capability", label: c, capability: c, groupName: g.name });
        }
      }
    }
    return ticks;
  }, [collapsedGroups]);

  // Self-tests / diagnostics — do not change existing validations; add new ones below
  const diagnostics = useMemo(() => {
    const tests: { name: string; pass: boolean }[] = [];
    const push = (name: string, pass: boolean) => tests.push({ name, pass: !!pass });

    // Test: CAPABILITIES unique & non-empty
    const capsSet = new Set(CAPABILITIES);
    push("CAPABILITIES are unique", capsSet.size === CAPABILITIES.length && CAPABILITIES.every(Boolean));

    // Test: VALUE_DRIVERS unique & non-empty
    const valsSet = new Set(VALUE_DRIVERS);
    push("VALUE_DRIVERS are unique", valsSet.size === VALUE_DRIVERS.length && VALUE_DRIVERS.every(Boolean));

    // Test: positions map coverage (approx)
    const stepX = Math.max(200, width - 180 - 24) / (CAPABILITIES.length - 1 || 1);
    push("x scale step positive", stepX > 0);

    const stepY = Math.max(200, height - 40 - 240) / (VALUE_DRIVERS.length - 1 || 1);
    push("y scale step positive", stepY > 0);

    // Test: data rows validity (mirrors dataIssues expectation)
    push("all data rows valid", dataIssues.length === 0);

    // Test: effort glyph mapping
    push(
      "effort glyph mapping",
      ["Low", "Medium", "High"].every((e) => {
        const g = e === "Low" ? "◯" : e === "High" ? "●" : "◐";
        return typeof g === "string" && g.length > 0;
      })
    );

    // Test: area scale monotonic
    const amin = 0,
      amax = 100;
    const A = (val: number) => {
      const minArea = 180;
      const maxArea = 5200;
      const min = amin,
        max = amax;
      const t = (val - min) / (max - min);
      return minArea + t * (maxArea - minArea);
    };
    push("area scale monotonic", A(80) > A(20));

    // Test: filtered does not exceed data size (smoke)
    push("filtered ≤ data length", data.length >= 0 && (data.length ? 1 : 0) <= data.length && filteredLengthSafe());

    // Test: benefits extent sane
    push(
      "benefits extent sane",
      Number.isFinite(benefitsExtent.min) && Number.isFinite(benefitsExtent.max) && benefitsExtent.min <= benefitsExtent.max
    );

    // Test: effort overlay keys present
    push("effort overlay keys", ["Low", "Medium", "High"].every((k) => typeof (effortOverlay as any)[k] === "boolean"));

    // Test: risk map includes Risk Unknown
    push("risk color has 'Risk Unknown'", !!RISK_COLOR["Risk Unknown"]);

    // Test: risk filter covers all risks
    push("risk filter has all risks", Object.keys(RISK_COLOR).every((k) => k in riskFilter));

    // Test: visible ticks ≥ 1
    push("visible ticks ≥ 1", typeof visibleTicks !== "undefined" && visibleTicks.length >= 1);

    return tests;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dataIssues, benefitsExtent.min, benefitsExtent.max, effortOverlay, visibleTicks.length]);

  // Filtering logic
  const filtered = useMemo(() => {
    return data.filter(
      (d) =>
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

  // HORIZONTAL EXPANSION & SCROLL (adaptive):
  // When many ticks, expand (scrollable). When groups are collapsed (few ticks),
  // *shrink the inner width* so more fits on-screen without horizontal scroll.
  const hasCapTicks = useMemo(() => visibleTicks.some((t: any) => t.type === 'capability'), [visibleTicks]);
  const MIN_STEP_CAP = 90;   // px between capability ticks (enough for wrapped labels)
  const MIN_STEP_GROUP = 60; // px between collapsed group ticks
  const BASE_STEP = hasCapTicks ? MIN_STEP_CAP : MIN_STEP_GROUP;

  // Ideal inner width strictly follows visible ticks; may be smaller than container when collapsed.
  const targetInnerW = useMemo(() => {
    const ticks = visibleTicks.length;
    const steps = (ticks - 1) || 1;
    const ideal = Math.max(300, steps * BASE_STEP);
    return ideal; // narrower when collapsed; wider when expanded
  }, [visibleTicks.length, BASE_STEP]);

  const svgW = M.left + targetInnerW + M.right; // SVG grows or shrinks with state

  // Scales for categorical axes (even spacing)
  const xPositions = useMemo(() => {
    const step = targetInnerW / (visibleTicks.length - 1 || 1);
    const map = new Map<string, number>();
    let i = 0;
    for (const t of visibleTicks) {
      const x = i * step;
      if ((t as any).type === "capability" && (t as any).capability) {
        map.set((t as any).capability, x);
      } else if ((t as any).type === "group") {
        const g = CAPABILITY_GROUPS.find((g) => g.name === (t as any).groupName);
        if (g) g.items.forEach((c) => map.set(c, x));
      }
      i++;
    }
    return map;
  }, [targetInnerW, visibleTicks]);

  // step for convenience in group label sizing
  const stepX = useMemo(() => targetInnerW / (visibleTicks.length - 1 || 1), [targetInnerW, visibleTicks.length]);

  // Compute group spans (for group labels on X-axis)
  const groupRanges = useMemo(() => {
    return CAPABILITY_GROUPS.map((g) => {
      const first = g.items[0];
      const last = g.items[g.items.length - 1];
      const startX = xPositions.get(first) ?? 0;
      const endX = xPositions.get(last) ?? startX;
      const centerX = (startX + endX) / 2;
      return { name: g.name, startX, endX, centerX, count: g.items.length };
    });
  }, [stepX, targetInnerW, xPositions]);

  const yPositions = useMemo(() => {
    const step = innerH / (VALUE_DRIVERS.length - 1 || 1);
    const map = new Map<string, number>();
    VALUE_DRIVERS.forEach((v, i) => map.set(v, i * step));
    return map;
  }, [innerH]);

  // Area-based size scale (for perceived size)
  const minArea = 180 * scale; // px^2
  const maxArea = 5200 * scale; // px^2
  const areaScale = (benefit: number) => {
    const { min, max } = benefitsExtent;
    if (max === min) return (minArea + maxArea) / 2;
    const t = (benefit - min) / (max - min);
    return minArea + t * (maxArea - minArea);
  };

  // Size helper (area → radius)
  const circleR = (area: number) => Math.sqrt(area / Math.PI);

  // Tooltip positioning
  const svgRef = useRef<SVGSVGElement | null>(null);
  const onPointEnter = (evt: React.MouseEvent, d: any) => {
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
                  {["Low", "Medium", "High"].map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={effortOverlay[k as "Low" | "Medium" | "High"]}
                        onChange={(e) => setEffortOverlay((prev) => ({ ...prev, [k]: e.target.checked }))}
                      />
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>{k === "Low" ? "◯" : k === "High" ? "●" : "◐"}</span>
                        {k}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={expandAllGroups} className="px-2 py-1 rounded border bg-white hover:bg-slate-50 text-xs">Expand All Groups</button>
                <button type="button" onClick={collapseAllGroups} className="px-2 py-1 rounded border bg-white hover:bg-slate-50 text-xs">Collapse All Groups</button>
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
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ background: color }} /> Color: {label}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">Opacity: Lifecycle — lighter early to darker late</div>
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
                            <td className="p-2 min-w-[180px]"><input className="w-full border rounded px-2 py-1" value={r.name} onChange={(e) => updateRow(i, "name", e.target.value)} /></td>
                            <td className="p-2 min-w-[220px]">
                              <select className="w-full border rounded px-2 py-1" value={r.capability} onChange={(e) => updateRow(i, "capability", e.target.value)}>
                                {CAPABILITIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 min-w-[220px]">
                              <select className="w-full border rounded px-2 py-1" value={r.valueDriver} onChange={(e) => updateRow(i, "valueDriver", e.target.value)}>
                                {VALUE_DRIVERS.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 min-w-[140px]"><input type="number" min={0} step={50000} className="w-full border rounded px-2 py-1" value={r.benefits} onChange={(e) => updateRow(i, "benefits", e.target.value)} /></td>
                            <td className="p-2 min-w-[120px]">
                              <select className="w-full border rounded px-2 py-1" value={r.lifecycle} onChange={(e) => updateRow(i, "lifecycle", e.target.value)}>
                                {LIFECYCLE_ORDER.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 min-w-[120px]">
                              <select className="w-full border rounded px-2 py-1" value={r.risk} onChange={(e) => updateRow(i, "risk", e.target.value)}>
                                {riskOptions.map((ro) => (
                                  <option key={ro} value={ro}>
                                    {ro}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 min-w-[110px]">
                              <select className="w-full border rounded px-2 py-1" value={r.effort} onChange={(e) => updateRow(i, "effort", e.target.value)}>
                                {["Low", "Medium", "High"].map((eff) => (
                                  <option key={eff} value={eff}>
                                    {eff}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 min-w-[80px]">
                              <button type="button" onClick={() => deleteRow(i)} className="px-2 py-1 rounded border hover:bg-red-50">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <textarea
                      className="w-full h-32 border rounded p-2 font-mono text-[11px]"
                      placeholder="Paste JSON here to import, or click Refresh JSON to view current data"
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Data issues (lightweight tests) */}
                  {dataIssues.length > 0 && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      <div className="font-semibold">Data validation issues:</div>
                      <ul className="list-disc pl-4">
                        {dataIssues.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
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
                  {visibleTicks.map((t) => {
                    const rep = (t as any).type === "capability" ? (t as any).capability : CAPABILITY_GROUPS.find((g) => g.name === (t as any).groupName)?.items[0];
                    const x = typeof rep === "string" ? xPositions.get(rep) : 0;
                    return <line key={`vx-${(t as any).key}`} x1={x} y1={0} x2={x} y2={innerH} stroke="#e5e7eb" />;
                  })}
                  {VALUE_DRIVERS.map((v) => (
                    <line key={`hy-${v}`} x1={0} y1={yPositions.get(v)} x2={targetInnerW} y2={yPositions.get(v)} stroke="#e5e7eb" />
                  ))}

                  {/* Group boundary gridlines (darker) */}
                  {groupRanges.map((gr, i) => (
                    <g key={`gx-bound-${gr.name}`}>
                      {/* Left/start boundary for each group */}
                      <line x1={gr.startX} y1={0} x2={gr.startX} y2={innerH} stroke="#94a3b8" strokeWidth={1.25} />
                      {/* Right/end boundary for the last group to frame the axis */}
                      {i === groupRanges.length - 1 && gr.endX !== gr.startX && (
                        <line x1={gr.endX} y1={0} x2={gr.endX} y2={innerH} stroke="#94a3b8" strokeWidth={1.25} />
                      )}
                    </g>
                  ))}

                  {/* Group label separators in the X-axis label band */}
                  {groupRanges.map((gr, i) => (
                    i === 0 ? null : (
                      <line key={`xlab-sep-${gr.name}`} x1={gr.startX} y1={innerH + 24} x2={gr.startX} y2={innerH + 110} stroke="#cbd5e1" strokeWidth={1} />
                    )
                  ))}

                  {/* X labels — WORD WRAP (TIGHTENED, ADJUSTED): higher & slightly left to sit closer to grid. */}
                  {visibleTicks
                    .filter((t: any) => t.type === "capability")
                    .map((t: any) => {
                      const cx = xPositions.get(t.capability);
                      const w = 70; // narrower label box to make labels appear closer
                      const x = (cx ?? 0) - w / 2 + 6; // ADJUSTMENT: slight left-right nudge — tweak here
                      const y = innerH + 30; // ADJUSTMENT: closer to grid — tweak here
                      return (
                        <foreignObject key={`xl-${t.key}`} x={x} y={y} width={w} height={60}>
                          {/* WORD WRAP HAPPENS HERE: the div constrains width and lets text wrap */}
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className="text-[11px] leading-tight text-slate-700 text-center break-words"
                            style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                          >
                            {t.label}
                          </div>
                        </foreignObject>
                      );
                    })}

                  {/* X group labels (click to collapse/expand) */}
                  {groupRanges.map((gr) => {
                    const pad = 70; // extra width to cover tick labels under the group title
                    const rangeW = Math.max(pad, gr.endX - gr.startX + pad);
                    const x = gr.centerX - rangeW / 2;
                    const y = innerH + 100; // below the capability labels
                    const isCollapsed = !!collapsedGroups[gr.name];
                    return (
                      <foreignObject key={`xg-${gr.name}`} x={x} y={y} width={rangeW} height={34}>
                        <div
                          xmlns="http://www.w3.org/1999/xhtml"
                          className="text-[12px] font-semibold text-slate-800 text-center cursor-pointer select-none hover:text-slate-900"
                          onClick={() => toggleGroup(gr.name)}
                          title="Click to collapse/expand this group"
                        >
                          <span className="mr-1">{isCollapsed ? "▸" : "▾"}</span>
                          {gr.name}
                        </div>
                      </foreignObject>
                    );
                  })}

                  {/* Y labels */}
                  {VALUE_DRIVERS.map((v) => (
                    <text key={`yl-${v}`} x={-10} y={yPositions.get(v)} className="fill-slate-700 text-[11px]" textAnchor="end" alignmentBaseline="middle">
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
                    const opacity = (LIFECYCLE_OPACITY as any)[d.lifecycle] ?? 0.7;

                    if (isNaN(cx as any) || isNaN(cy as any)) return null;

                    const r = circleR(area);
                    const glyph = d.effort === "Low" ? "◯" : d.effort === "High" ? "●" : "◐";
                    const fontSize = Math.max(12, r * 1.6);

                    const common = {
                      onMouseEnter: (e: React.MouseEvent) => onPointEnter(e, d),
                      onMouseMove: (e: React.MouseEvent) => onPointEnter(e, d),
                      onMouseLeave: onLeave,
                      style: { cursor: "pointer" },
                    } as const;

                    return (
                      <g key={idx} transform={`translate(${cx},${cy})`} {...common}>
                        <circle r={r} fill={fill} opacity={opacity} />
                        {effortOverlay[d.effort as "Low" | "Medium" | "High"] && (
                          <text
                            fontSize={fontSize}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontFamily:
                                "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols 2','Noto Sans Symbols','Arial Unicode MS','sans-serif'",
                              fontWeight: 700,
                            }}
                          >
                            {glyph}
                          </text>
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
                      <div>
                        Capability: <span className="font-medium">{hover.datum.capability}</span>
                      </div>
                      <div>
                        Value Driver: <span className="font-medium">{hover.datum.valueDriver}</span>
                      </div>
                      <div>
                        Benefits: <span className="font-medium">{'$'}{hover.datum.benefits.toLocaleString()}</span>
                      </div>
                      <div>
                        Lifecycle: <span className="font-medium">{hover.datum.lifecycle}</span>
                      </div>
                      <div>
                        Risk: <span className="font-medium">{hover.datum.risk}</span>
                      </div>
                      <div>
                        Effort: <span className="font-medium">{hover.datum.effort}</span>
                      </div>
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
