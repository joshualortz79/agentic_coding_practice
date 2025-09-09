import React, { useMemo, useRef, useEffect, useState } from "react";

// Marketing AI Use Case Prioritization — Bubble Chart
// X = Capability Type (categorical)
// Y = Value Driver (categorical)
// Size = Cost ($)
// Opacity = Benefits ($) buckets
//   <$100k → 0.30; $100k–$200k → 0.40; $200k–$500k → 0.50; $500k–$1M → 0.75; >$1M → 0.85
// Color = Risk (Green on track, Yellow some risk, Red high risk, Blue unknown)
// Symbol = Level of Effort (◯ Low, ◐ Medium, ● High)

// Tailwind is available. Keep it clean, grid-based, and print-friendly.

// Capability Groups for nested X-axis labeling
const CAPABILITY_GROUPS = [
  {
    name: "Data Processing & Preparation",
    items: ["Segmentation", "Data Correction", "Data Flagging"],
  },
  {
    name: "Language & Communication AI",
    items: [
      "Translation/Transcription",
      "Voice/Speech Recognition",
      "Sentiment Analysis",
      "Content Creation",
      "Document Generation",
      "Digital Engagement",
    ],
  },
  {
    name: "Information Retrieval & Knowledge Management",
    items: ["Search & Retrieval (RAG)", "Knowledge Base / Q&A"],
  },
  {
    name: "Analysis & Prediction",
    items: ["Data Analysis", "Prediction / Forecasting"],
  },
  {
    name: "Personalization & Recommendation",
    items: [
      "Personalization",
      "Recommendation Engine",
      "Audience Optimization",
      "Offer Presentment",
    ],
  },
  {
    name: "Automation & Orchestration",
    items: ["Workflow Automation"],
  },
  {
    name: "Media Analysis",
    items: ["Image/Video Analysis"],
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

const RISK_COLOR: Record<string, string> = {
  "On Track": "#16a34a", // green-600
  "Some Risk": "#eab308", // yellow-500
  "High Risk": "#dc2626", // red-600
  "Risk Unknown": "#3b82f6", // blue-500
};

// Dummy dataset covering multiple categories — now includes cost for each row
const RAW_DATA = [
  { name: "Content Studio", capability: "Content Creation", valueDriver: "In-Market Optimization", benefits: 950000, cost: 180000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },

  { name: "AskData - Audience Discovery (P2)", capability: "Segmentation", valueDriver: "Opportunity Mapping", benefits: 1000000, cost: 220000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "AskAudience - Audience Segmentation GenAI (Prod)", capability: "Segmentation", valueDriver: "Opportunity Mapping", benefits: 1000000, cost: 200000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "High-Intent False Reds Fix", capability: "Data Correction", valueDriver: "Insight Generation", benefits: 1000000, cost: 120000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Social Media Feedback Loop", capability: "Sentiment Analysis", valueDriver: "Insight Generation", benefits: 1000000, cost: 90000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "AskRetail - Deep Customer Insights (DCI)", capability: "Search & Retrieval (RAG)", valueDriver: "Insight Generation", benefits: 1000000, cost: 250000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Insightful Search (Strativio 2025)", capability: "Search & Retrieval (RAG)", valueDriver: "Insight Generation", benefits: 1000000, cost: 190000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Enable Cludo AI Summary", capability: "Search & Retrieval (RAG)", valueDriver: "Insight Generation", benefits: 1000000, cost: 110000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Audience StartRight", capability: "Segmentation", valueDriver: "Opportunity Mapping", benefits: 1000000, cost: 150000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "1876 - Content Generation (Phase 2)", capability: "Content Creation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 130000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "1876 - Content Generation (Phase 3)", capability: "Content Creation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 160000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "New Content Generation Solution", capability: "Content Creation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 140000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Digital - Spanish Translation", capability: "Translation/Transcription", valueDriver: "Plan Implementation", benefits: 1000000, cost: 80000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Paid Media Optimization via Claritas MMA (+PILOT)", capability: "Audience Optimization", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 210000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Customized Product Offerings (Designed by Dad)", capability: "Offer Presentment", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 175000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Accessory Promotion Recommender", capability: "Recommendation Engine", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 155000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Accessory Recommender", capability: "Recommendation Engine", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 145000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "AI Decisioning Tool", capability: "Workflow Automation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 240000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Moving/Switcher Wizard (Bill Screenshot)", capability: "Image/Video Analysis", valueDriver: "Plan Implementation", benefits: 1000000, cost: 260000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Personalization Agentic AI", capability: "Personalization", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 230000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Wake Up With Craig (AT&T Small Business)", capability: "Digital Engagement", valueDriver: "Plan Implementation", benefits: 1000000, cost: 95000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Idealab AI Agent", capability: "Knowledge Base / Q&A", valueDriver: "Plan Implementation", benefits: 1000000, cost: 170000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Google AI-Max for Paid Search", capability: "Audience Optimization", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 200000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "UC 300 - The Nudge: Real-Time Call Offers", capability: "Voice/Speech Recognition", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 300000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Real-Time Call Offers - Mobility", capability: "Recommendation Engine", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 270000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Use Case 89 - AI Brief Builder (Production)", capability: "Workflow Automation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 125000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Video Editing Efficiencies (DaVinci)", capability: "Content Creation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 85000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Generate Metadata (Products/Pages)", capability: "Content Creation", valueDriver: "Plan Implementation", benefits: 1000000, cost: 92000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "AI-Prompted Exclusive Offers", capability: "Offer Presentment", valueDriver: "In-Market Optimization", benefits: 1000000, cost: 160000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "AskData / Ask Databases - Campaign Evaluation (P2)", capability: "Data Analysis", valueDriver: "Performance Intelligence", benefits: 1000000, cost: 210000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Abandonment & Progression Analysis (High-Intent)", capability: "Prediction / Forecasting", valueDriver: "Performance Intelligence", benefits: 1000000, cost: 185000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Neurons - Creative Evaluation Tool", capability: "Image/Video Analysis", valueDriver: "Performance Intelligence", benefits: 1000000, cost: 275000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Digital Experimentation Archive & Decisioning", capability: "Knowledge Base / Q&A", valueDriver: "Performance Intelligence", benefits: 1000000, cost: 120000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Use-Case Deduplication & Similarity Detection", capability: "Data Flagging", valueDriver: "Performance Intelligence", benefits: 1000000, cost: 90000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Use Case 89 - AI Brief Builder (Design)", capability: "Document Generation", valueDriver: "Integrated Planning", benefits: 1000000, cost: 115000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
  { name: "Blueprint Booster", capability: "Knowledge Base / Q&A", valueDriver: "Brand and Growth Strategy", benefits: 1000000, cost: 135000, lifecycle: "Discovery", risk: "Risk Unknown", effort: "Low" },
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
  const [riskFilter, setRiskFilter] = useState<Record<string, boolean>>(
    () => Object.fromEntries(Object.keys(RISK_COLOR).map((k) => [k, true])) as Record<string, boolean>
  );
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
  const [effortOverlay, setEffortOverlay] = useState<{ Low: boolean; Medium: boolean; High: boolean }>(
    {
      Low: true,
      Medium: true,
      High: true,
    }
  );
  // Collapsible groups (false = expanded by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (name: string) => setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  const expandAllGroups = () => setCollapsedGroups({});
  const collapseAllGroups = () =>
    setCollapsedGroups(Object.fromEntries(CAPABILITY_GROUPS.map((g) => [g.name, true])) as Record<string, boolean>);

  const updateRow = (idx: number, field: string, value: any) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: field === "benefits" || field === "cost" ? Number(value) : value } : r))
    );
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        name: "New Use Case",
        capability: CAPABILITIES[0],
        valueDriver: VALUE_DRIVERS[0],
        benefits: 100000,
        cost: 100000,
        lifecycle: LIFECYCLE_ORDER[0],
        risk: "On Track",
        effort: "Medium",
      },
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
  const costExtent = useMemo(() => {
    const vals = data.map((d) => d.cost as number);
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
      if (typeof d.cost !== "number" || Number.isNaN(d.cost)) issues.push(`Row ${i + 1}: cost must be a number`);
      if (d.cost < 0) issues.push(`Row ${i + 1}: cost should be ≥ 0`);
    });
    return issues;
  }, [data]);

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
  const M = { top: 40, right: 40, bottom: 240, left: 180 }; // widened right margin slightly for X-axis labels
  const innerW = Math.max(200, width - M.left - M.right);
  const innerH = Math.max(200, height - M.top - M.bottom);

  // HORIZONTAL EXPANSION & SCROLL (adaptive):
  // When many ticks, expand (scrollable). When groups are collapsed (few ticks),
  // *shrink the inner width* so more fits on-screen without horizontal scroll.
  const hasCapTicks = useMemo(() => visibleTicks.some((t: any) => t.type === 'capability'), [visibleTicks]);
  const MIN_STEP_CAP = 100;   // was 90; give labels a bit more breathing room
  const MIN_STEP_GROUP = 70;   // was 60; slightly wider when groups collapsed
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

  // Area-based size scale (for perceived size) — now based on COST
  const minArea = 180 * scale; // px^2
  const maxArea = 5200 * scale; // px^2
  const areaFromCost = (cost: number) => {
    const { min, max } = costExtent;
    if (max === min) return (minArea + maxArea) / 2;
    const t = (cost - min) / (max - min);
    return minArea + t * (maxArea - minArea);
  };

  // Opacity by benefits buckets
  const benefitOpacity = (benefit: number) => {
    if (benefit < 100000) return 0.3;
    if (benefit < 200000) return 0.4;
    if (benefit < 500000) return 0.5;
    if (benefit < 1000000) return 0.75;
    return 0.85;
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

  // --- NEW: jitter to avoid perfect overlap when multiple points share the same cell ---
  const JITTER_BASE = 10; // px base spread
  const jittered = useMemo(() => {
    // Group filtered points by (capability, valueDriver)
    const groups = new Map<string, any[]>();
    filtered.forEach((d) => {
      const key = `${d.capability}||${d.valueDriver}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399963
    const out: Array<{ d: any; jx: number; jy: number }> = [];

    groups.forEach((arr) => {
      const n = arr.length;
      if (n === 1) {
        out.push({ d: arr[0], jx: 0, jy: 0 });
      } else {
        // Distribute around a small spiral using golden-angle for even placement
        arr.forEach((d, i) => {
          const r = Math.min(16, JITTER_BASE * Math.sqrt((i + 1) / n));
          const a = i * GOLDEN_ANGLE;
          out.push({ d, jx: Math.cos(a) * r, jy: Math.sin(a) * r });
        });
      }
    });

    return out;
  }, [filtered]);

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
                <label className="text-sm font-medium text-slate-700">Bubble Scale (cost)</label>
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
                  <div>Size: Cost ($)</div>
                  {Object.entries(RISK_COLOR).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ background: color }} /> Color: {label}
                    </div>
                  ))}
                  <div className="space-y-1">
                    <div>Opacity: Benefits ($)</div>
                    <div className="pl-4 text-slate-600">&lt;$100k → 0.30</div>
                    <div className="pl-4 text-slate-600">$100k–$200k → 0.40</div>
                    <div className="pl-4 text-slate-600">$200k–$500k → 0.50</div>
                    <div className="pl-4 text-slate-600">$500k–$1M → 0.75</div>
                    <div className="pl-4 text-slate-600">&gt;$1M → 0.85</div>
                  </div>
                  <div className="flex items-center gap-2">Symbol: ◯ Low effort</div>
                  <div className="flex items-center gap-2">Symbol: ◐ Medium effort</div>
                  <div className="flex items-center gap-2">Symbol: ● High effort</div>
                </div>
              </div>

              {/* Diagnostics removed */}
            </div>
          </div>
        </div>

        {/* Right: Chart */}
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-200 shadow-sm bg-white">
            <div className="px-5 pt-4 pb-2">
              <h1 className="text-xl font-semibold text-slate-900">Marketing AI Use Cases — Prioritization Bubble Chart</h1>
              <p className="text-sm text-slate-600">X: Capability Type • Y: Value Driver • Size: Cost ($) • Opacity: Benefits • Color: Risk • Symbol: Level of Effort (◯/◐/●)</p>
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
                          <th className="p-2">Cost ($)</th>
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
                            <td className="p-2 min-w-[140px]"><input type="number" min={0} step={5000} className="w-full border rounded px-2 py-1" value={r.cost} onChange={(e) => updateRow(i, "cost", e.target.value)} /></td>
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

                  {/* X labels — WORD WRAP (TIGHTENED, ADJUSTED): wider margins */}
                  {visibleTicks
                    .filter((t: any) => t.type === "capability")
                    .map((t: any) => {
                      const cx = xPositions.get(t.capability);
                      const w = 86; // widened from 70 for slightly wider margins
                      const x = (cx ?? 0) - w / 2 + 6;
                      const y = innerH + 30;
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
                    const pad = 90; // widened from 70 for slightly wider margins
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
                  {/* Y-axis title intentionally omitted */}

                  {/* Points — symbol overlay for Effort; bubble fill = Risk; opacity = Benefits; size = COST */}
                  {jittered.map(({ d, jx, jy }, idx) => {
                    const cx = (xPositions.get(d.capability) ?? 0) + jx;
                    const cy = (yPositions.get(d.valueDriver) ?? 0) + jy;
                    const area = areaFromCost(d.cost);
                    const fill = RISK_COLOR[d.risk] || "#94a3b8";
                    const opacity = benefitOpacity(d.benefits);

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
                  <foreignObject x={hover.x + 12} y={hover.y - 8} width={340} height={240} pointerEvents="none">
                    <div className="bg-white/95 backdrop-blur rounded-lg border border-slate-200 shadow px-3 py-2 text-xs leading-tight text-slate-800">
                      <div className="font-semibold text-slate-900 text-sm">{hover.datum.name}</div>
                      <div>
                        Capability: <span className="font-medium">{hover.datum.capability}</span>
                      </div>
                      <div>
                        Value Driver: <span className="font-medium">{hover.datum.valueDriver}</span>
                      </div>
                      <div>
                        Cost: <span className="font-medium">{'$'}{hover.datum.cost.toLocaleString()}</span>
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
                <div className="text-slate-500">Min → Max Cost</div>
                <div className="text-lg font-semibold text-slate-900">{'$'}{costExtent.min.toLocaleString()} {'→'} {'$'}{costExtent.max.toLocaleString()}</div>
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
