import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
  AlertTriangle,
  CircleSlash,
  Check,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
  Ban,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
// Point this at your API. Adjust if your server runs elsewhere.
const API_BASE = "http://localhost:5000/api/products";
const CATEGORY_API_BASE = "http://localhost:5000/api/categories"; // assumed existing endpoint that returns [{ _id, name }]

const LOW_STOCK_THRESHOLD = 10;

/* ------------------------------------------------------------------ */
/*  Variant suggestions per category                                   */
/* ------------------------------------------------------------------ */
const VARIANT_SUGGESTIONS = {
  bottle: ["100ml", "250ml", "300ml", "500ml", "750ml", "1L", "1.5L", "2L"],
  water: ["250ml", "300ml", "500ml", "750ml", "1L", "1.5L", "2L", "5L"],
  beverage: ["250ml", "330ml", "500ml", "1L"],
  juice: ["200ml", "250ml", "500ml", "1L"],
  oil: ["250ml", "500ml", "1L", "2L", "5L"],
  paint: ["1L", "4L", "10L", "20L"],
  cleaning: ["250ml", "500ml", "1L", "5L"],
  clothing: ["XS", "Small", "Medium", "Large", "XL", "XXL"],
  apparel: ["XS", "Small", "Medium", "Large", "XL", "XXL"],
  shirt: ["Small", "Medium", "Large", "XL", "XXL"],
  tshirt: ["Small", "Medium", "Large", "XL", "XXL"],
  jeans: ["28", "30", "32", "34", "36", "38"],
  shoe: ["6", "7", "8", "9", "10", "11", "12"],
  footwear: ["6", "7", "8", "9", "10", "11", "12"],
  sneaker: ["6", "7", "8", "9", "10", "11", "12"],
  electronics: ["1m", "2m", "3m", "5m"],
  cable: ["0.5m", "1m", "2m", "3m", "5m"],
  charger: ["18W", "20W", "30W", "65W"],
  snack: ["Small Pack", "Medium Pack", "Large Pack", "Family Pack"],
  food: ["Small Pack", "Medium Pack", "Family Pack"],
  grocery: ["250g", "500g", "1kg", "2kg", "5kg"],
  spice: ["50g", "100g", "250g", "500g"],
  stationery: ["Single", "Pack of 5", "Pack of 10", "Pack of 12"],
};
const DEFAULT_VARIANT_SUGGESTIONS = ["Small", "Medium", "Large"];

function getVariantSuggestions(categoryName = "") {
  const lower = categoryName.toLowerCase();
  const key = Object.keys(VARIANT_SUGGESTIONS).find((k) => lower.includes(k));
  return key ? VARIANT_SUGGESTIONS[key] : DEFAULT_VARIANT_SUGGESTIONS;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(
    Number(n) || 0
  );

function stockStatus(stock) {
  const s = Number(stock) || 0;
  if (s <= 0) return { label: "Out of stock", tone: "rust" };
  if (s <= LOW_STOCK_THRESHOLD) return { label: "Low stock", tone: "amber" };
  return { label: "In stock", tone: "teal" };
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* no body */
  }
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((message, tone = "teal") => {
    clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  return [toast, show];
}

function Toast({ toast }) {
  if (!toast) return null;
  const toneClasses =
    toast.tone === "rust"
      ? "bg-[#B23A34] border-[#8f2b26]"
      : "bg-[#2F6F63] border-[#245850]";
  return (
    <div
      className={`fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium text-[#F7F5F0] shadow-lg shadow-black/20 ${toneClasses}`}
      style={{ fontFamily: "Inter, sans-serif" }}
      role="status"
    >
      {toast.tone === "rust" ? (
        <Ban className="h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      )}
      {toast.message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stock indicator (signature element)                                */
/* ------------------------------------------------------------------ */
function StockGauge({ stock, compact = false }) {
  const { tone } = stockStatus(stock);
  const toneHex = { teal: "#2F6F63", amber: "#C77D22", rust: "#B23A34" }[tone];
  const pct = Math.max(4, Math.min(100, (Number(stock) / 50) * 100));
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "min-w-0 sm:min-w-[128px]"}`}>
      <div className={`h-1.5 shrink-0 rounded-full bg-[#E4E0D6] overflow-hidden ${compact ? "w-10" : "w-16"}`}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: toneHex }}
        />
      </div>
      <span
        className="shrink-0 text-xs font-medium tabular-nums"
        style={{ color: toneHex, fontFamily: "IBM Plex Mono, monospace" }}
      >
        {stock}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SKU tag (signature element)                                        */
/* ------------------------------------------------------------------ */
function SkuTag({ sku }) {
  return (
    <span
      className="relative inline-flex items-center rounded-sm border border-dashed border-[#5C6B73]/50 bg-[#F7F5F0] px-2 py-0.5 text-[11px] tracking-wide text-[#5C6B73]"
      style={{ fontFamily: "IBM Plex Mono, monospace" }}
      title={sku}
    >
      {sku}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Searchable category combobox                                       */
/* ------------------------------------------------------------------ */
function CategorySelect({ categories, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = categories.find((c) => c._id === value);
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass(error)} flex items-center justify-between text-left`}
      >
        <span className={selected ? "text-[#1C2B33]" : "text-[#5C6B73]"}>
          {selected ? selected.name : "Select a category"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#5C6B73] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-[#E4E0D6] bg-white shadow-lg">
          <div className="relative border-b border-[#E4E0D6] p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5C6B73]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full rounded border border-[#E4E0D6] bg-[#F7F5F0] py-1.5 pl-7 pr-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#5C6B73]">No categories found</li>
            ) : (
              filtered.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c._id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[#2F6F63]/10 ${
                      c._id === value ? "font-medium text-[#2F6F63]" : "text-[#1C2B33]"
                    }`}
                  >
                    {c.name}
                    {c._id === value && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm dialog                                                     */
/* ------------------------------------------------------------------ */
function ConfirmDialog({ open, title, body, confirmLabel, danger, onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1C2B33]/50 backdrop-blur-[2px] px-4">
      <div className="w-full max-w-sm rounded-md bg-[#F7F5F0] border border-[#E4E0D6] shadow-2xl">
        <div className="p-5">
          <h3
            className="text-[15px] font-semibold text-[#1C2B33]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {title}
          </h3>
          <p className="mt-2 text-sm text-[#5C6B73] leading-relaxed">{body}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#E4E0D6] p-3">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm font-medium text-[#5C6B73] hover:bg-[#E4E0D6]/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-[#F7F5F0] transition-colors disabled:opacity-60 ${
              danger ? "bg-[#B23A34] hover:bg-[#8f2b26]" : "bg-[#2F6F63] hover:bg-[#245850]"
            }`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add / Edit drawer                                                  */
/* ------------------------------------------------------------------ */
const emptyForm = {
  category: "",
  name: "",
  variantName: "",
  costPrice: "",
  sellingPrice: "",
  stock: "",
};

function ProductDrawer({ open, mode, initial, categories, onClose, onSaved, showToast }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              category: initial.category?._id || initial.category || "",
              name: initial.name || "",
              variantName: initial.variantName || "",
              costPrice: initial.costPrice ?? "",
              sellingPrice: initial.sellingPrice ?? "",
              stock: initial.stock ?? "",
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, initial]);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedCategory = categories.find((c) => c._id === form.category);
  const variantSuggestions = getVariantSuggestions(selectedCategory?.name);

  const validate = () => {
    const next = {};
    if (!form.category) next.category = "Choose a category";
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.variantName.trim()) next.variantName = "Variant is required";
    if (form.costPrice === "" || isNaN(form.costPrice) || Number(form.costPrice) <= 0)
      next.costPrice = "Enter a cost price greater than 0";
    if (form.sellingPrice === "" || isNaN(form.sellingPrice) || Number(form.sellingPrice) <= 0)
      next.sellingPrice = "Enter a selling price greater than 0";
    if (form.stock !== "" && (isNaN(form.stock) || Number(form.stock) < 0))
      next.stock = "Stock can't be negative";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        name: form.name.trim(),
        variantName: form.variantName.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: form.stock === "" ? 0 : Number(form.stock),
      };
      if (mode === "edit") {
        await api(`/${initial._id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Product updated");
      } else {
        await api("/", { method: "POST", body: JSON.stringify(payload) });
        showToast("Product added");
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message, "rust");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#1C2B33]/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#F7F5F0] border-l border-[#E4E0D6] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] px-6 py-5">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2F6F63]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {mode === "edit" ? "Edit item" : "New item"}
              </p>
              <h2
                className="text-lg font-semibold text-[#1C2B33]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {mode === "edit" ? initial?.name : "Add a product"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-[#5C6B73] hover:bg-[#E4E0D6]/70 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <Field label="Category" error={errors.category}>
              <CategorySelect
                categories={categories}
                value={form.category}
                onChange={(id) => setForm((f) => ({ ...f, category: id }))}
                error={errors.category}
              />
            </Field>

            <Field label="Product name" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="e.g. Cotton T-Shirt"
                className={inputClass(errors.name)}
              />
            </Field>

            <Field label="Variant" error={errors.variantName}>
              <input
                type="text"
                value={form.variantName}
                onChange={update("variantName")}
                placeholder={
                  selectedCategory ? `e.g. ${variantSuggestions[0]}` : "e.g. Blue / Medium"
                }
                className={inputClass(errors.variantName)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variantSuggestions.map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setForm((f) => ({ ...f, variantName: v }))}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      form.variantName === v
                        ? "border-[#2F6F63] bg-[#2F6F63]/10 text-[#2F6F63]"
                        : "border-[#E4E0D6] text-[#5C6B73] hover:border-[#2F6F63]/50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-[#5C6B73]">
                {selectedCategory
                  ? `Suggested for ${selectedCategory.name} — tap one or type your own.`
                  : "Pick a category to see common variants, or type your own."}
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cost price" error={errors.costPrice}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6B73] text-sm">
                    PKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={update("costPrice")}
                    placeholder="0.00"
                    className={`${inputClass(errors.costPrice)} pl-12`}
                  />
                </div>
              </Field>
              <Field label="Selling price" error={errors.sellingPrice}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-[#5C6B73] text-sm">
                    PKR 
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={update("sellingPrice")}
                    placeholder="0.00"
                    className={`${inputClass(errors.sellingPrice)} pl-12`}
                  />
                </div>
              </Field>
            </div>

            <Field label="Stock on hand" error={errors.stock}>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clamped = raw !== "" && Number(raw) < 0 ? "0" : raw;
                  setForm((f) => ({ ...f, stock: clamped }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                placeholder="0"
                className={inputClass(errors.stock)}
              />
            </Field>

            {mode === "edit" && (
              <div className="rounded border border-[#E4E0D6] bg-white/50 px-3 py-2 text-xs text-[#5C6B73]">
                SKU <span className="font-medium text-[#1C2B33]">{initial?.sku}</span> stays
                fixed once an item is created.
              </div>
            )}
          </form>

          <div className="flex items-center justify-end gap-2 border-t border-[#E4E0D6] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm font-medium text-[#5C6B73] hover:bg-[#E4E0D6]/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-[#1C2B33] px-4 py-2 text-sm font-semibold text-[#F7F5F0] hover:bg-[#0f1a20] transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Save changes" : "Add product"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#5C6B73]">{label}</span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-xs text-[#B23A34]">
          <AlertTriangle className="h-3 w-3" /> {error}
        </span>
      )}
    </label>
  );
}

function inputClass(error) {
  return `w-full rounded-md border bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none transition-colors focus:ring-2 focus:ring-[#2F6F63]/30 ${
    error ? "border-[#B23A34]" : "border-[#E4E0D6] focus:border-[#2F6F63]"
  }`;
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, icon: Icon, tone }) {
  const toneHex = { ink: "#1C2B33", teal: "#2F6F63", amber: "#C77D22", rust: "#B23A34" }[tone];
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#E4E0D6] bg-white/60 px-3 py-3 sm:px-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${toneHex}1A`, color: toneHex }}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-wide text-[#5C6B73]">{label}</p>
        <p
          className="truncate text-base font-semibold text-[#1C2B33] tabular-nums sm:text-lg"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
          title={String(value)}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile card (responsive stand-in for a table row)                  */
/* ------------------------------------------------------------------ */
function ProductCard({ p, onEdit, onDelete }) {
  return (
    <div className="w-full min-w-0 p-4">
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[#1C2B33]">{p.name}</p>
          <p className="truncate text-xs text-[#5C6B73]">{p.variantName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(p)}
            className="rounded p-2 text-[#5C6B73] hover:bg-[#2F6F63]/10 hover:text-[#2F6F63] transition-colors"
            aria-label={`Edit ${p.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(p)}
            className="rounded p-2 text-[#5C6B73] hover:bg-[#B23A34]/10 hover:text-[#B23A34] transition-colors"
            aria-label={`Delete ${p.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex w-full flex-wrap items-center gap-1.5">
        <SkuTag sku={p.sku} />
        <span className="truncate text-xs text-[#5C6B73]">{p.category?.name || "—"}</span>
      </div>

      <div className="mt-3 flex w-full items-center justify-between gap-2 border-t border-[#E4E0D6] pt-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[#5C6B73]">Stock</p>
          <StockGauge stock={p.stock} compact />
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[10px] uppercase tracking-wide text-[#5C6B73]">Cost / Price</p>
          <p className="text-xs text-[#5C6B73]">{currency(p.costPrice)}</p>
          <p
            className="text-sm font-semibold text-[#1C2B33] tabular-nums"
            style={{ fontFamily: "IBM Plex Mono, monospace" }}
          >
            {currency(p.sellingPrice)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function Product() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | low | out
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState({ open: false, mode: "add", product: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, showToast] = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(API_BASE);
      if (res.status === 404) {
        setProducts([]);
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Couldn't load products");
      } else {
        setProducts(await res.json());
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(CATEGORY_API_BASE);
      if (res.ok) setCategories(await res.json());
    } catch (_) {
      /* categories are optional for filtering to still work */
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.variantName} ${p.sku} ${p.category?.name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter && (p.category?._id || p.category) !== categoryFilter) return false;
      if (minPrice && Number(p.sellingPrice) < Number(minPrice)) return false;
      if (maxPrice && Number(p.sellingPrice) > Number(maxPrice)) return false;
      if (statusFilter === "low") {
        const s = Number(p.stock) || 0;
        if (!(s > 0 && s <= LOW_STOCK_THRESHOLD)) return false;
      }
      if (statusFilter === "out" && Number(p.stock) !== 0) return false;
      return true;
    });
  }, [products, search, categoryFilter, minPrice, maxPrice, statusFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const value = products.reduce((sum, p) => sum + Number(p.sellingPrice) * Number(p.stock || 0), 0);
    const low = products.filter((p) => {
      const s = Number(p.stock) || 0;
      return s > 0 && s <= LOW_STOCK_THRESHOLD;
    }).length;
    const out = products.filter((p) => Number(p.stock) === 0).length;
    return { total, value, low, out };
  }, [products]);

  const hasActiveFilters = categoryFilter || minPrice || maxPrice || statusFilter !== "all";

  const clearFilters = () => {
    setCategoryFilter("");
    setMinPrice("");
    setMaxPrice("");
    setStatusFilter("all");
  };

  const openAdd = () => setDrawer({ open: true, mode: "add", product: null });
  const openEdit = (p) => setDrawer({ open: true, mode: "edit", product: p });
  const closeDrawer = () => setDrawer((d) => ({ ...d, open: false }));

  const requestDelete = (p) => setConfirmDelete(p);
  const performDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api(`/${confirmDelete._id}`, { method: "DELETE" });
      showToast(`"${confirmDelete.name}" removed`);
      setConfirmDelete(null);
      loadProducts();
    } catch (err) {
      showToast(err.message, "rust");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[#F7F5F0]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2F6F63]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Inventory
            </p>
            <h1
              className="text-2xl font-bold text-[#1C2B33]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Product ledger
            </h1>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-md bg-[#1C2B33] px-4 py-2.5 text-sm font-semibold text-[#F7F5F0] shadow-sm hover:bg-[#0f1a20] transition-colors"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total items" value={stats.total} icon={Package} tone="ink" />
          <StatCard label="Inventory value" value={currency(stats.value)} icon={Package} tone="teal" />
          <StatCard label="Low stock" value={stats.low} icon={AlertTriangle} tone="amber" />
          <StatCard label="Out of stock" value={stats.out} icon={CircleSlash} tone="rust" />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6B73]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, variant, SKU or category…"
              className="w-full rounded-md border border-[#E4E0D6] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/20"
            />
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors ${
              filtersOpen || hasActiveFilters
                ? "border-[#2F6F63] bg-[#2F6F63]/10 text-[#2F6F63]"
                : "border-[#E4E0D6] bg-white text-[#5C6B73] hover:border-[#2F6F63]/50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2F6F63] text-[10px] font-bold text-white">
                •
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {filtersOpen && (
          <div className="mb-6 flex flex-wrap items-end gap-4 rounded-md border border-[#E4E0D6] bg-white/60 p-4">
            <div className="min-w-[180px]">
              <span className="mb-1.5 block text-xs font-medium text-[#5C6B73]">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#5C6B73]">Min price</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-28 rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm outline-none focus:border-[#2F6F63]"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#5C6B73]">Max price</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className="w-28 rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm outline-none focus:border-[#2F6F63]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[#5C6B73]">Stock level</span>
              <div className="flex gap-1.5">
                {[
                  { key: "all", label: "All" },
                  { key: "low", label: "Low" },
                  { key: "out", label: "Out" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === s.key
                        ? "bg-[#1C2B33] text-white"
                        : "bg-[#E4E0D6]/60 text-[#5C6B73] hover:bg-[#E4E0D6]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[#B23A34] hover:underline"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-hidden rounded-md border border-[#E4E0D6] bg-white/60">
          {loading ? (
            <SkeletonRows />
          ) : loadError ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <AlertTriangle className="h-6 w-6 text-[#B23A34]" />
              <p className="text-sm font-medium text-[#1C2B33]">{loadError}</p>
              <button
                onClick={loadProducts}
                className="mt-2 rounded-md border border-[#E4E0D6] px-3 py-1.5 text-xs font-medium text-[#5C6B73] hover:border-[#2F6F63]"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters || !!search} onAdd={openAdd} onClear={() => { clearFilters(); setSearch(""); }} />
          ) : (
            <>
              {/* Mobile: stacked cards (below md) */}
              <div className="divide-y divide-[#E4E0D6] md:hidden">
                {filtered.map((p) => (
                  <ProductCard key={p._id} p={p} onEdit={openEdit} onDelete={requestDelete} />
                ))}
              </div>

              {/* Desktop/tablet: table (md and up) */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-[#E4E0D6] bg-[#1C2B33]/[0.03] text-left text-[11px] uppercase tracking-wide text-[#5C6B73]">
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Cost</th>
                      <th className="px-4 py-3 font-medium text-right">Price</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr
                        key={p._id}
                        className="border-b border-[#E4E0D6] last:border-0 hover:bg-[#2F6F63]/[0.04] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1C2B33]">{p.name}</p>
                          <p className="text-xs text-[#5C6B73]">{p.variantName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <SkuTag sku={p.sku} />
                        </td>
                        <td className="px-4 py-3 text-[#5C6B73]">{p.category?.name || "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#5C6B73]">
                          {currency(p.costPrice)}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums font-medium text-[#1C2B33]"
                          style={{ fontFamily: "IBM Plex Mono, monospace" }}
                        >
                          {currency(p.sellingPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <StockGauge stock={p.stock} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(p)}
                              className="rounded p-1.5 text-[#5C6B73] hover:bg-[#2F6F63]/10 hover:text-[#2F6F63] transition-colors"
                              aria-label={`Edit ${p.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(p)}
                              className="rounded p-1.5 text-[#5C6B73] hover:bg-[#B23A34]/10 hover:text-[#B23A34] transition-colors"
                              aria-label={`Delete ${p.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {!loading && !loadError && filtered.length > 0 && (
          <p className="mt-3 text-xs text-[#5C6B73]">
            Showing {filtered.length} of {products.length} products
          </p>
        )}
      </div>

      <ProductDrawer
        open={drawer.open}
        mode={drawer.mode}
        initial={drawer.product}
        categories={categories}
        onClose={closeDrawer}
        onSaved={loadProducts}
        showToast={showToast}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this product?"
        body={`"${confirmDelete?.name}" (${confirmDelete?.variantName}) will be permanently deleted from your inventory. This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty & loading states                                             */
/* ------------------------------------------------------------------ */
function EmptyState({ hasFilters, onAdd, onClear }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E4E0D6]/60 text-[#5C6B73]">
        <Package className="h-5 w-5" />
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-[#1C2B33]">No products match these filters</p>
          <p className="text-xs text-[#5C6B73]">Try widening your search or clearing filters.</p>
          <button
            onClick={onClear}
            className="mt-1 rounded-md border border-[#E4E0D6] px-3 py-1.5 text-xs font-medium text-[#5C6B73] hover:border-[#2F6F63]"
          >
            Clear search &amp; filters
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-[#1C2B33]">Your ledger is empty</p>
          <p className="text-xs text-[#5C6B73]">Add your first product to start tracking stock.</p>
          <button
            onClick={onAdd}
            className="mt-1 inline-flex items-center gap-2 rounded-md bg-[#1C2B33] px-3.5 py-2 text-xs font-semibold text-[#F7F5F0] hover:bg-[#0f1a20]"
          >
            <Plus className="h-3.5 w-3.5" /> Add product
          </button>
        </>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-[#E4E0D6]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-3.5 w-40 animate-pulse rounded bg-[#E4E0D6]" />
          <div className="h-3.5 w-20 animate-pulse rounded bg-[#E4E0D6]" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-[#E4E0D6]" />
          <div className="ml-auto h-3.5 w-16 animate-pulse rounded bg-[#E4E0D6]" />
        </div>
      ))}
    </div>
  );
}