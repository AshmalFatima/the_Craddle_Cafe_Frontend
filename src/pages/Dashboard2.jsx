import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import {
  Coffee, TrendingUp, TrendingDown, Package, Wallet, AlertTriangle, Search,
  RefreshCw, ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, X,
  LayoutGrid, ListFilter, ArrowLeftRight, Landmark, CircleAlert,
} from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";

/* ------------------------------------------------------------------ */
/*  API — self-contained, matches the project's inventoryApi shape     */
/* ------------------------------------------------------------------ */

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://the-craddle-cafe-backend.vercel.app/api";

function authHeaders() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function handle(res) {
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

function fetchDashboard(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== "" && v != null));
  const qs = params.toString();
  return fetch(`${BASE_URL}/dashboard${qs ? `?${qs}` : ""}`, { headers: authHeaders() }).then(handle);
}

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const COLOR = {
  ink: "#211509",
  espresso: "#3B2417",
  cream: "#FAF6EF",
  card: "#FFFFFF",
  line: "#E7DFD1",
  gold: "#B8873A",
  goldDeep: "#8C6323",
  sage: "#4F6B4F",
  sageSoft: "#E7EEE3",
  rust: "#9C4A2E",
  rustSoft: "#F3E4DC",
  muted: "#7A6A58",
};

const PIE_COLORS = ["#B8873A", "#4F6B4F", "#9C4A2E", "#5C4A34", "#7A8FA6", "#B4A48A"];

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function pkr(v, decimals = 0) {
  const n = Number(v || 0);
  return `₨${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function pad(n) { return String(n).padStart(2, "0"); }
function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function presetRange(key) {
  const today = new Date();
  const end = isoDate(today);
  if (key === "today") return { startDate: end, endDate: end };
  if (key === "7d") {
    const s = new Date(today); s.setDate(s.getDate() - 6);
    return { startDate: isoDate(s), endDate: end };
  }
  if (key === "30d") {
    const s = new Date(today); s.setDate(s.getDate() - 29);
    return { startDate: isoDate(s), endDate: end };
  }
  if (key === "month") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: isoDate(s), endDate: end };
  }
  return { startDate: "", endDate: "" };
}

function generateDemoData() {
  const categories = ["Beans & Roasts", "Bakery", "Dairy & Milk Alt.", "Syrups", "Packaging"];
  const names = [
    ["Ethiopia Yirgacheffe", "1kg"], ["Colombia Supremo", "1kg"], ["Croissant Dough", "Box/24"],
    ["Blueberry Muffin Mix", "5kg"], ["Whole Milk", "1L"], ["Oat Milk", "1L"], ["Vanilla Syrup", "750ml"],
    ["Caramel Syrup", "750ml"], ["Paper Cups 12oz", "Sleeve/50"], ["Lids 12oz", "Sleeve/50"],
    ["House Blend", "1kg"], ["Chocolate Chips", "2kg"],
  ];
  const productsSummary = names.map(([name, variantName], i) => {
    const unitStock = [2, 6, 14, 40, 55, 8, 3, 22, 90, 75, 18, 30][i];
    const unitPrice = [1800, 1600, 900, 1200, 210, 380, 650, 650, 1400, 900, 1750, 2100][i];
    const sellingPrice = Math.round(unitPrice * 1.35);
    const costValue = unitPrice * unitStock;
    const sellingValue = sellingPrice * unitStock;
    return {
      _id: `demo-${i}`, name, variantName,
      category: { _id: `cat-${i % categories.length}`, name: categories[i % categories.length] },
      unitStock, petStock: 0, unitPrice, sellingPrice, costValue, sellingValue,
      profitValue: sellingValue - costValue,
    };
  });
  const totals = productsSummary.reduce((a, p) => ({
    totalUnits: a.totalUnits + p.unitStock, totalCost: a.totalCost + p.costValue,
    totalSelling: a.totalSelling + p.sellingValue, totalProfit: a.totalProfit + p.profitValue,
  }), { totalUnits: 0, totalCost: 0, totalSelling: 0, totalProfit: 0 });

  const movementTotals = { unitsIn: 214, costIn: 186400, sellingIn: 251800, profitIn: 65400,
    unitsOut: 176, costOut: 141200, sellingOut: 196500, profitOut: 55300 };

  const expenses = [
    { _id: "e1", title: "Milk & dairy restock", type: "Cash Out", amount: 24500, expenseDate: new Date() },
    { _id: "e2", title: "Till sales — Saturday", type: "Cash In", amount: 78200, expenseDate: new Date(Date.now() - 86400000) },
    { _id: "e3", title: "Electricity bill", type: "Cash Out", amount: 15800, expenseDate: new Date(Date.now() - 2 * 86400000) },
    { _id: "e4", title: "Roastery invoice", type: "Cash Out", amount: 42000, expenseDate: new Date(Date.now() - 3 * 86400000) },
    { _id: "e5", title: "Till sales — Wednesday", type: "Cash In", amount: 61300, expenseDate: new Date(Date.now() - 4 * 86400000) },
  ];
  const expenseTotals = expenses.reduce((a, e) => {
    if (e.type === "Cash Out") a.totalOut += e.amount; else a.totalIn += e.amount;
    return a;
  }, { totalIn: 0, totalOut: 0 });

  const duesList = [
    { _id: "d1", customer: { name: "Bilal Events" }, totalAmount: 32000, paid: 20000, remaining: 12000, createdAt: new Date() },
    { _id: "d2", customer: { name: "Cafe Corner Wholesale" }, totalAmount: 18000, paid: 6000, remaining: 12000, createdAt: new Date(Date.now() - 86400000) },
    { _id: "d3", customer: { name: "Sana Traders" }, totalAmount: 9000, paid: 9000, remaining: 0, createdAt: new Date(Date.now() - 5 * 86400000) },
  ];
  const duesTotals = duesList.reduce((a, d) => ({
    count: a.count + 1, totalAmount: a.totalAmount + d.totalAmount, paid: a.paid + d.paid, remaining: a.remaining + d.remaining,
  }), { count: 0, totalAmount: 0, paid: 0, remaining: 0 });

  return {
    productsSummary, totals, movementTotals, expenses, expenseTotals,
    duesList, duesTotals, globalRemaining: 41500,
  };
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
      style={{
        backgroundColor: active ? COLOR.ink : "transparent",
        color: active ? COLOR.cream : COLOR.muted,
        border: `1px solid ${active ? COLOR.ink : COLOR.line}`,
      }}
    >
      {children}
    </button>
  );
}

function Badge({ tone = "muted", children }) {
  const tones = {
    sage: { bg: COLOR.sageSoft, fg: "#2E4530" },
    rust: { bg: COLOR.rustSoft, fg: "#6B2E1B" },
    muted: { bg: "#F0EBE1", fg: COLOR.muted },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone }) {
  const toneColor = tone === "up" ? COLOR.sage : tone === "down" ? COLOR.rust : COLOR.ink;
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3 rounded-xl"
      style={{ backgroundColor: COLOR.card, border: `1px solid ${COLOR.line}` }}
    >
      <div className="flex items-center gap-1.5" style={{ color: COLOR.muted }}>
        <Icon size={13} strokeWidth={2} />
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div
        className="text-lg sm:text-xl leading-none"
        style={{ fontWeight: 600, color: toneColor, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px]" style={{ color: COLOR.muted }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLOR.card, border: `1px solid ${COLOR.line}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLOR.line}` }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} style={{ color: COLOR.goldDeep }} />}
          <h3 style={{ fontSize: 15, color: COLOR.ink }}>{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SortHeader({ label, field, sortKey, sortDir, onSort, align = "left" }) {
  const activeField = sortKey === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-3 py-2 text-${align} cursor-pointer select-none`}
      style={{ color: COLOR.muted }}
    >
      <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide font-semibold">
        {label}
        {activeField ? (
          sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : null}
      </span>
    </th>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: COLOR.ink, color: COLOR.cream }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} >
          {p.name}: {pkr(p.value)}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const NAV_TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "products", label: "Products", icon: Package },
  { key: "movements", label: "Movements", icon: ArrowLeftRight },
  { key: "finance", label: "Finance", icon: Landmark },
];

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [preset, setPreset] = useState("30d");
  const [startDate, setStartDate] = useState(presetRange("30d").startDate);
  const [endDate, setEndDate] = useState(presetRange("30d").endDate);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState("sellingValue");
  const [sortDir, setSortDir] = useState("desc");

  const load = useCallback(async (sd, ed) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboard({ startDate: sd, endDate: ed });
      setData(res);
      setDemoMode(false);
    } catch (err) {
      setData(generateDemoData());
      setDemoMode(true);
      setError(null);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => { load(startDate, endDate); /* eslint-disable-next-line */ }, []);

  const applyPreset = (key) => {
    setPreset(key);
    const r = presetRange(key);
    setStartDate(r.startDate);
    setEndDate(r.endDate);
    load(r.startDate, r.endDate);
  };

  const applyCustom = () => { setPreset("custom"); load(startDate, endDate); };
  const clearFilters = () => { applyPreset("all"); };

  /* ---------------- derived data ---------------- */

  const categories = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.productsSummary.map((p) => p.category?.name || "Uncategorized"));
    return ["all", ...Array.from(set)];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let rows = data.productsSummary.filter((p) => {
      const matchesSearch = `${p.name} ${p.variantName || ""}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || (p.category?.name || "Uncategorized") === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [data, search, categoryFilter, sortKey, sortDir]);

  const lowStock = useMemo(() => {
    if (!data) return [];
    return data.productsSummary.filter((p) => p.unitStock <= 10).sort((a, b) => a.unitStock - b.unitStock);
  }, [data]);

  const categoryBreakdown = useMemo(() => {
    if (!data) return [];
    const map = {};
    data.productsSummary.forEach((p) => {
      const key = p.category?.name || "Uncategorized";
      map[key] = (map[key] || 0) + p.sellingValue;
    });
    const arr = Object.entries(map).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    if (arr.length > 6) {
      const top = arr.slice(0, 5);
      const other = arr.slice(5).reduce((s, x) => s + x.value, 0);
      return [...top, { name: "Other", value: other }];
    }
    return arr;
  }, [data]);

  const movementChartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Stock in", cost: data.movementTotals.costIn, value: data.movementTotals.sellingIn },
      { name: "Stock out", cost: data.movementTotals.costOut, value: data.movementTotals.sellingOut },
    ];
  }, [data]);

  const netCash = data ? data.expenseTotals.totalIn - data.expenseTotals.totalOut : 0;

  const toggleSort = (field) => {
    if (sortKey === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(field); setSortDir("desc"); }
  };

  /* ---------------- render ---------------- */

  return (
   <SidebarLayout>
     <div >
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${COLOR.line}; border-radius: 4px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid ${COLOR.gold}; outline-offset: 2px;
        }
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
        tbody tr:hover { background: #FBF8F2; }
      `}</style>

      {/* Topbar */}
      <header style={{ backgroundColor: COLOR.card, borderBottom: `1px solid ${COLOR.line}` }} className="sticky top-0 z-20">
     
        {/* Nav tabs */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {NAV_TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  color: active ? COLOR.goldDeep : COLOR.muted,
                  borderColor: active ? COLOR.gold : "transparent",
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-5 flex flex-col gap-5">

        {demoMode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: COLOR.rustSoft, color: "#6B2E1B" }}>
            <CircleAlert size={14} />
            Showing sample data — the live API at {BASE_URL.replace("https://", "")} could not be reached from this preview. This screen will use real data automatically once it's running in your app.
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: COLOR.card, border: `1px solid ${COLOR.line}` }}>
          <ListFilter size={15} style={{ color: COLOR.muted }} className="mr-1 flex-shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            <Pill active={preset === "today"} onClick={() => applyPreset("today")}>Today</Pill>
            <Pill active={preset === "7d"} onClick={() => applyPreset("7d")}>7 days</Pill>
            <Pill active={preset === "30d"} onClick={() => applyPreset("30d")}>30 days</Pill>
            <Pill active={preset === "month"} onClick={() => applyPreset("month")}>This month</Pill>
            <Pill active={preset === "all"} onClick={() => applyPreset("all")}>All time</Pill>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input
              type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPreset("custom"); }}
              className="text-xs px-2 py-1.5 rounded-lg" style={{ border: `1px solid ${COLOR.line}`, color: COLOR.ink }}
            />
            <span className="text-xs" style={{ color: COLOR.muted }}>to</span>
            <input
              type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPreset("custom"); }}
              className="text-xs px-2 py-1.5 rounded-lg" style={{ border: `1px solid ${COLOR.line}`, color: COLOR.ink }}
            />
            <button
              onClick={applyCustom}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: COLOR.gold, color: COLOR.ink }}
            >
              Apply
            </button>
            {(startDate || endDate) && (
              <button onClick={clearFilters} className="text-xs flex items-center gap-1" style={{ color: COLOR.muted }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: COLOR.rustSoft, color: "#6B2E1B" }}>{error}</div>
        )}

        {!data ? (
          <div className="py-24 text-center text-sm" style={{ color: COLOR.muted }}>Loading dashboard…</div>
        ) : (
          <>
            {/* KPI summary cards — always 2 per row */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard icon={Package} label="Stock value (cost)" value={pkr(data.totals.totalCost)} sub={`${data.totals.totalUnits} units on hand`} />
              <KpiCard icon={TrendingUp} label="Stock value (selling)" value={pkr(data.totals.totalSelling)} />
              <KpiCard icon={TrendingUp} label="Potential profit" value={pkr(data.totals.totalProfit)} tone="up" />
              <KpiCard icon={ArrowUpRight} label="Cash in" value={pkr(data.expenseTotals.totalIn)} tone="up" />
              <KpiCard icon={ArrowDownRight} label="Cash out" value={pkr(data.expenseTotals.totalOut)} tone="down" />
              <KpiCard icon={Wallet} label="Net cash flow" value={pkr(netCash)} tone={netCash >= 0 ? "up" : "down"} />
              <KpiCard icon={Landmark} label="Remaining dues" value={pkr(data.globalRemaining)} sub="All-time, unfiltered" />
            </div>
            {lastUpdated && (
              <div className="text-[11px] -mt-3" style={{ color: COLOR.muted }}>
                As of {lastUpdated.toLocaleTimeString()} · range: {startDate || "start"} → {endDate || "today"}
              </div>
            )}

            {/* -------- Overview tab -------- */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <SectionCard title="Value by category" icon={LayoutGrid}>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div style={{ width: "100%", maxWidth: 220, height: 200 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
                              {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke={COLOR.card} strokeWidth={2} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 w-full flex flex-col gap-1.5">
                        {categoryBreakdown.map((c, i) => (
                          <div key={c.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span style={{ color: COLOR.ink }}>{c.name}</span>
                            </span>
                            <span style={{ color: COLOR.muted }}>{pkr(c.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Top products by selling value" icon={TrendingUp}>
                    <div className="flex flex-col gap-2">
                      {[...data.productsSummary].sort((a, b) => b.sellingValue - a.sellingValue).slice(0, 5).map((p) => (
                        <div key={p._id} className="flex items-center justify-between text-sm">
                          <div>
                            <div style={{ color: COLOR.ink }}>{p.name}</div>
                            <div className="text-xs" style={{ color: COLOR.muted }}>{p.variantName} · {p.unitStock} units</div>
                          </div>
                          <div style={{ fontWeight: 600 }}>{pkr(p.sellingValue)}</div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="flex flex-col gap-4">
                  <SectionCard
                    title="Low stock"
                    icon={AlertTriangle}
                    action={<Badge tone="rust">{lowStock.length} items</Badge>}
                  >
                    {lowStock.length === 0 ? (
                      <div className="text-sm py-4 text-center" style={{ color: COLOR.muted }}>Everything is well stocked.</div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                        {lowStock.map((p) => (
                          <div key={p._id} className="flex items-center justify-between text-sm">
                            <span style={{ color: COLOR.ink }}>{p.name} <span style={{ color: COLOR.muted }}>· {p.variantName}</span></span>
                            <Badge tone={p.unitStock === 0 ? "rust" : "muted"}>{p.unitStock} left</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard title="Recent cash activity" icon={Wallet}>
                    <div className="flex flex-col gap-2">
                      {data.expenses.slice(0, 5).map((e) => (
                        <div key={e._id} className="flex items-center justify-between text-sm">
                          <div>
                            <div style={{ color: COLOR.ink }}>{e.title}</div>
                            <div className="text-xs" style={{ color: COLOR.muted }}>{new Date(e.expenseDate).toLocaleDateString()}</div>
                          </div>
                          <span style={{ fontWeight: 600, color: e.type === "Cash Out" ? COLOR.rust : COLOR.sage }}>
                            {e.type === "Cash Out" ? "-" : "+"}{pkr(e.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* -------- Products tab -------- */}
            {tab === "products" && (
              <SectionCard
                title="Products"
                icon={Package}
                action={<span className="text-xs" style={{ color: COLOR.muted }}>{filteredProducts.length} of {data.productsSummary.length}</span>}
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLOR.muted }} />
                    <input
                      value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search product or variant…"
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg"
                      style={{ border: `1px solid ${COLOR.line}` }}
                    />
                  </div>
                  <select
                    value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg" style={{ border: `1px solid ${COLOR.line}`, color: COLOR.ink }}
                  >
                    {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
                  </select>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                        <SortHeader label="Product" field="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Category</th>
                        <SortHeader label="Units" field="unitStock" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                        <SortHeader label="Cost value" field="costValue" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                        <SortHeader label="Selling value" field="sellingValue" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                        <SortHeader label="Profit" field="profitValue" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p._id} style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                          <td className="px-3 py-2.5">
                            <div style={{ color: COLOR.ink, fontWeight: 500 }}>{p.name}</div>
                            <div className="text-xs" style={{ color: COLOR.muted }}>{p.variantName}</div>
                          </td>
                          <td className="px-3 py-2.5" style={{ color: COLOR.muted }}>{p.category?.name || "Uncategorized"}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span >{p.unitStock}</span>
                            {p.unitStock <= 10 && <div><Badge tone="rust">Low</Badge></div>}
                          </td>
                          <td className="px-3 py-2.5 text-right" >{pkr(p.costValue)}</td>
                          <td className="px-3 py-2.5 text-right" >{pkr(p.sellingValue)}</td>
                          <td className="px-3 py-2.5 text-right" style={{ color: COLOR.sage, fontWeight: 600 }}>{pkr(p.profitValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden flex flex-col gap-2">
                  {filteredProducts.map((p) => (
                    <div key={p._id} className="p-3 rounded-lg" style={{ border: `1px solid ${COLOR.line}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        {p.unitStock <= 10 && <Badge tone="rust">Low stock</Badge>}
                      </div>
                      <div className="text-xs mb-2" style={{ color: COLOR.muted }}>{p.variantName} · {p.category?.name || "Uncategorized"}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs" >
                        <div><div style={{ color: COLOR.muted }}>Units</div>{p.unitStock}</div>
                        <div><div style={{ color: COLOR.muted }}>Selling</div>{pkr(p.sellingValue)}</div>
                        <div><div style={{ color: COLOR.muted }}>Profit</div><span style={{ color: COLOR.sage }}>{pkr(p.profitValue)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* -------- Movements tab -------- */}
            {tab === "movements" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <SectionCard title={`Stock in vs out (${startDate || "all"} → ${endDate || "today"})`} icon={ArrowLeftRight}>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer>
                        <BarChart data={movementChartData} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLOR.line} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLOR.muted }} axisLine={{ stroke: COLOR.line }} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="cost" name="Cost" fill={COLOR.espresso} radius={[4, 4, 0, 0]} maxBarSize={56} />
                          <Bar dataKey="value" name="Selling value" fill={COLOR.gold} radius={[4, 4, 0, 0]} maxBarSize={56} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>
                </div>
                <div className="flex flex-col gap-4">
                  <SectionCard title="Stock in" icon={ArrowUpRight}>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between"><span style={{ color: COLOR.muted }}>Units</span><span >{data.movementTotals.unitsIn}</span></div>
                      <div className="flex justify-between"><span style={{ color: COLOR.muted }}>Cost</span><span >{pkr(data.movementTotals.costIn)}</span></div>
                      <div className="flex justify-between"><span style={{ color: COLOR.muted }}>Selling value</span><span >{pkr(data.movementTotals.sellingIn)}</span></div>
                      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${COLOR.line}` }}><span style={{ color: COLOR.muted }}>Profit</span><span style={{ color: COLOR.sage, fontWeight: 600 }}>{pkr(data.movementTotals.profitIn)}</span></div>
                    </div>
                  </SectionCard>
                  <SectionCard title="Stock out" icon={ArrowDownRight}>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between"><span style={{ color: COLOR.muted }}>Units</span><span >{data.movementTotals.unitsOut}</span></div>
                      <div className="flex justify-between"><span style={{ color: COLOR.muted }}>Cost</span><span >{pkr(data.movementTotals.costOut)}</span></div>
                      <div className="flex justify-between"><span style={{ color: COLOR.muted }}>Selling value</span><span >{pkr(data.movementTotals.sellingOut)}</span></div>
                      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${COLOR.line}` }}><span style={{ color: COLOR.muted }}>Profit</span><span style={{ color: COLOR.sage, fontWeight: 600 }}>{pkr(data.movementTotals.profitOut)}</span></div>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* -------- Finance tab -------- */}
            {tab === "finance" && (
              <div className="flex flex-col gap-4">
                <SectionCard title="Expenses" icon={Wallet} action={<span className="text-xs" style={{ color: COLOR.muted }}>{data.expenses.length} entries</span>}>
                  <div className="hidden md:block overflow-x-auto">
                    <table>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Title</th>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Type</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Amount</th>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expenses.map((e) => (
                          <tr key={e._id} style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                            <td className="px-3 py-2.5">{e.title}</td>
                            <td className="px-3 py-2.5"><Badge tone={e.type === "Cash Out" ? "rust" : "sage"}>{e.type}</Badge></td>
                            <td className="px-3 py-2.5 text-right" style={{ fontWeight: 600, color: e.type === "Cash Out" ? COLOR.rust : COLOR.sage }}>{pkr(e.amount)}</td>
                            <td className="px-3 py-2.5" style={{ color: COLOR.muted }}>{new Date(e.expenseDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden flex flex-col gap-2">
                    {data.expenses.map((e) => (
                      <div key={e._id} className="p-3 rounded-lg flex items-center justify-between" style={{ border: `1px solid ${COLOR.line}` }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{e.title}</div>
                          <div className="text-xs" style={{ color: COLOR.muted }}>{new Date(e.expenseDate).toLocaleDateString()}</div>
                        </div>
                        <span style={{ fontWeight: 600, color: e.type === "Cash Out" ? COLOR.rust : COLOR.sage }}>{pkr(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Dues" icon={Landmark} action={<span className="text-xs" style={{ color: COLOR.muted }}>{data.duesTotals.count} accounts</span>}>
                  <div className="hidden md:block overflow-x-auto">
                    <table>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Customer</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Total</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Paid</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold" style={{ color: COLOR.muted }}>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.duesList.map((d) => (
                          <tr key={d._id} style={{ borderBottom: `1px solid ${COLOR.line}` }}>
                            <td className="px-3 py-2.5">{d.customer?.name || "Unknown"}</td>
                            <td className="px-3 py-2.5 text-right" >{pkr(d.totalAmount)}</td>
                            <td className="px-3 py-2.5 text-right" style={{ color: COLOR.sage }}>{pkr(d.paid)}</td>
                            <td className="px-3 py-2.5 text-right">
                              {d.remaining > 0
                                ? <Badge tone="rust">{pkr(d.remaining)}</Badge>
                                : <Badge tone="sage">Settled</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden flex flex-col gap-2">
                    {data.duesList.map((d) => (
                      <div key={d._id} className="p-3 rounded-lg" style={{ border: `1px solid ${COLOR.line}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <div style={{ fontWeight: 500 }}>{d.customer?.name || "Unknown"}</div>
                          {d.remaining > 0 ? <Badge tone="rust">{pkr(d.remaining)}</Badge> : <Badge tone="sage">Settled</Badge>}
                        </div>
                        <div className="text-xs" style={{ color: COLOR.muted }}>Total {pkr(d.totalAmount)} · Paid {pkr(d.paid)}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </>
        )}
      </main>
    </div>
   </SidebarLayout>
  );
}