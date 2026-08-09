import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  X,
  Trash2,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";

import SidebarLayout from "../components/SidebarLayout";

const API_BASE = "http://localhost:5000/api/stock";

const EMPTY_FILTERS = {
  search: "",
  type: "all",
  startDate: "",
  endDate: "",
};

const EMPTY_FORM = {
  product: "",
  petStock: "",
  unitStock: "",
  note: "",
};

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------
   Summary Card
------------------------------------------------------- */

function SummaryCard({
  title,
  quantity,
  amount,
  icon: Icon,
  color,
  active,
  onClick,
}) {
  const colors = {
    teal: {
      dot: "bg-[#2F6F63]",
      text: "text-[#2F6F63]",
      border: "border-[#2F6F63]/30",
      ring: "ring-[#2F6F63]/20",
      bg: "bg-[#2F6F63]/10",
    },

    emerald: {
      dot: "bg-emerald-600",
      text: "text-emerald-700",
      border: "border-emerald-200",
      ring: "ring-emerald-200",
      bg: "bg-emerald-50",
    },

    rose: {
      dot: "bg-rose-600",
      text: "text-rose-700",
      border: "border-rose-200",
      ring: "ring-rose-200",
      bg: "bg-rose-50",
    },
  };

  const c = colors[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-4 text-left transition ${
        active
          ? `${c.border} ring-2 ${c.ring} ring-offset-2 ring-offset-[#F7F5F0]`
          : "border-[#E4E0D6] hover:border-[#CFC9BC]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />

          <span className="text-sm font-medium text-[#5C6B73]">
            {title}
          </span>
        </div>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div
        className={`mt-3 text-2xl font-semibold ${
          active ? c.text : "text-[#1C2B33]"
        }`}
      >
        {quantity}
      </div>

      <div className="mt-1 text-xs text-[#8A969C]">
        Quantity
      </div>

      <div className={`mt-2 text-sm font-medium ${c.text}`}>
        {formatCurrency(amount)}
      </div>

      <div className="mt-0.5 text-xs text-[#8A969C]">
        Stock amount
      </div>
    </button>
  );
}

/* -------------------------------------------------------
   Stock Modal
------------------------------------------------------- */

function StockModal({
  open,
  mode,
  products,
  form,
  setForm,
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  const isIn = mode === "in";

  const selectedProduct = products.find(
    (product) => product._id === form.product
  );

  const handlePetChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setForm((f) => ({
        ...f,
        petStock: "",
      }));
      return;
    }

    const cleaned = value.replace(/\D/g, "");

    setForm((f) => ({
      ...f,
      petStock: cleaned,
    }));
  };

  const handleUnitChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setForm((f) => ({
        ...f,
        unitStock: "",
      }));
      return;
    }

    const cleaned = value.replace(/\D/g, "");

    setForm((f) => ({
      ...f,
      unitStock: cleaned,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C2B33]/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E4E0D6] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-[#1C2B33]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {isIn ? "Stock In" : "Stock Out"}
            </h2>

            <p className="mt-0.5 text-xs text-[#5C6B73]">
              {isIn
                ? "Add stock using whole pets / cartons."
                : "Remove stock using whole units."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-[#5C6B73] transition hover:bg-[#F7F5F0] hover:text-[#1C2B33] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Product */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1C2B33]">
              Product
            </label>

            <select
              value={form.product}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  product: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-[#E4E0D6] bg-white px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
            >
              <option value="">Select product</option>

              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                  {product.variantName
                    ? ` - ${product.variantName}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Current stock */}
          {selectedProduct && (
            <div className="rounded-lg border border-[#E4E0D6] bg-[#F7F5F0] px-3 py-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#5C6B73]">
                  Current stock
                </span>

                <span className="font-medium text-[#1C2B33]">
                  {selectedProduct.petStock ?? 0} pets /{" "}
                  {selectedProduct.unitStock ?? 0} units
                </span>
              </div>

              <div className="mt-1 flex justify-between text-xs">
                <span className="text-[#5C6B73]">
                  Items per pet
                </span>

                <span className="font-medium text-[#1C2B33]">
                  {selectedProduct.itemsPerPet ?? 1}
                </span>
              </div>
            </div>
          )}

          {/* Stock In = PETS ONLY */}
          {isIn && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1C2B33]">
                Pet Stock
              </label>

              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.petStock}
                onChange={handlePetChange}
                placeholder="Enter whole number of pets"
                className="w-full rounded-lg border border-[#E4E0D6] px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
              />

              <p className="mt-1 text-xs text-[#8A969C]">
                Only whole pets are allowed for Stock In.
              </p>
            </div>
          )}

          {/* Stock Out = UNITS ONLY */}
          {!isIn && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1C2B33]">
                Unit Stock
              </label>

              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.unitStock}
                onChange={handleUnitChange}
                placeholder="Enter whole number of units"
                className="w-full rounded-lg border border-[#E4E0D6] px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
              />

              <p className="mt-1 text-xs text-[#8A969C]">
                Only whole units are allowed for Stock Out.
              </p>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1C2B33]">
              Note
            </label>

            <textarea
              rows={3}
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  note: e.target.value,
                }))
              }
              placeholder="Optional note"
              className="w-full resize-none rounded-lg border border-[#E4E0D6] px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-[#B23A34]/20 bg-[#B23A34]/5 px-3 py-2.5 text-sm text-[#B23A34]">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-[#E4E0D6] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#5C6B73] transition hover:bg-[#F7F5F0]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
                isIn
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {submitting
                ? "Saving..."
                : isIn
                ? "Add Stock"
                : "Remove Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Main Stock Page
------------------------------------------------------- */

export default function Stock() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("in");

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [activeCard, setActiveCard] = useState("all");

  /* -------------------------------------------------------
     Load Products
  ------------------------------------------------------- */

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/products",
        {
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load products"
        );
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts([]);
    }
  }, []);

  /* -------------------------------------------------------
     Load Stock
  ------------------------------------------------------- */

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_BASE, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load stock history"
        );
      }

      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading stock:", err);

      setError(
        err.message || "Failed to load stock history"
      );

      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------------------------------------------------------
     Initial Load
  ------------------------------------------------------- */

  useEffect(() => {
    loadStock();
    loadProducts();
  }, [loadStock, loadProducts]);

  /* -------------------------------------------------------
     Filter Movements
  ------------------------------------------------------- */

  const filteredMovements = useMemo(() => {
    let result = [...movements];

    if (filters.type !== "all") {
      result = result.filter(
        (movement) => movement.type === filters.type
      );
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();

      result = result.filter((movement) => {
        const productName =
          movement.product?.name?.toLowerCase() || "";

        const variantName =
          movement.product?.variantName?.toLowerCase() || "";

        const note =
          movement.note?.toLowerCase() || "";

        return (
          productName.includes(q) ||
          variantName.includes(q) ||
          note.includes(q)
        );
      });
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);

      result = result.filter(
        (movement) =>
          new Date(movement.createdAt) >= start
      );
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter(
        (movement) =>
          new Date(movement.createdAt) <= end
      );
    }

    return result;
  }, [movements, filters]);

  /* -------------------------------------------------------
     Summary
  ------------------------------------------------------- */

  const summary = useMemo(() => {
    const stockIn = movements.filter(
      (movement) => movement.type === "in"
    );

    const stockOut = movements.filter(
      (movement) => movement.type === "out"
    );

    const inUnits = stockIn.reduce(
      (sum, movement) =>
        sum + Number(movement.unitStock || 0),
      0
    );

    const outUnits = stockOut.reduce(
      (sum, movement) =>
        sum + Number(movement.unitStock || 0),
      0
    );

    const inAmount = stockIn.reduce(
      (sum, movement) =>
        sum + Number(movement.stockCostPrice || 0),
      0
    );

    const outAmount = stockOut.reduce(
      (sum, movement) =>
        sum + Number(movement.stockSellingPrice || 0),
      0
    );

    return {
      inUnits,
      outUnits,
      inAmount,
      outAmount,
    };
  }, [movements]);

  /* -------------------------------------------------------
     Modal Helpers
  ------------------------------------------------------- */

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const openStockIn = () => {
    setModalMode("in");
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openStockOut = () => {
    setModalMode("out");
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  /* -------------------------------------------------------
     Submit Stock
  ------------------------------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.product) {
      setFormError("Please select a product.");
      return;
    }

    let url;
    let payload;

    if (modalMode === "in") {
      const pets = Number(form.petStock);

      if (
        !form.petStock ||
        !Number.isInteger(pets) ||
        pets <= 0
      ) {
        setFormError(
          "Stock In must contain a whole number of pets."
        );
        return;
      }

      url = `${API_BASE}/in`;

      payload = {
        product: form.product,
        petStock: pets,
        note: form.note.trim(),
      };
    } else {
      const units = Number(form.unitStock);

      if (
        !form.unitStock ||
        !Number.isInteger(units) ||
        units <= 0
      ) {
        setFormError(
          "Stock Out must contain a whole number of units."
        );
        return;
      }

      url = `${API_BASE}/out`;

      payload = {
        product: form.product,
        unitStock: units,
        note: form.note.trim(),
      };
    }

    setSubmitting(true);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to save stock movement"
        );
      }

      closeModal();

      await Promise.all([
        loadStock(),
        loadProducts(),
      ]);
    } catch (err) {
      console.error(err);

      setFormError(
        err.message || "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------
     Delete
  ------------------------------------------------------- */

  const handleDelete = async (movement) => {
    const confirmed = window.confirm(
      "Delete this stock movement? The product stock will be adjusted automatically."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/${movement._id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to delete stock movement"
        );
      }

      await Promise.all([
        loadStock(),
        loadProducts(),
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete stock movement"
      );
    }
  };

  /* -------------------------------------------------------
     Reset Filters
  ------------------------------------------------------- */

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActiveCard("all");
  };

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <>
      {/*
        SidebarLayout owns the sidebar + responsive shell now.
        Everything below is just this page's content.
      */}
      <SidebarLayout
        activeKey="stock"
        user={{
          name: "Admin user",
          contact: "admin@example.com",
        }}
        onNavigate={(item) => {
          window.location.href = item.href;
        }}
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/signin";
        }}
      >
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-semibold tracking-tight text-[#1C2B33]"
                style={{
                  fontFamily:
                    "Space Grotesk, sans-serif",
                }}
              >
                Stock Management
              </h1>

              <p className="mt-1 text-sm text-[#5C6B73]">
                Manage stock in, stock out and
                inventory history.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openStockIn}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Stock In
              </button>

              <button
                type="button"
                onClick={openStockOut}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Stock Out
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Stock In"
              quantity={summary.inUnits}
              amount={summary.inAmount}
              icon={ArrowDownToLine}
              color="emerald"
              active={activeCard === "in"}
              onClick={() => {
                setActiveCard("in");

                setFilters((f) => ({
                  ...f,
                  type: "in",
                }));
              }}
            />

            <SummaryCard
              title="Stock Out"
              quantity={summary.outUnits}
              amount={summary.outAmount}
              icon={ArrowUpFromLine}
              color="rose"
              active={activeCard === "out"}
              onClick={() => {
                setActiveCard("out");

                setFilters((f) => ({
                  ...f,
                  type: "out",
                }));
              }}
            />

            <SummaryCard
              title="Total Movements"
              quantity={movements.length}
              amount={
                summary.inAmount +
                summary.outAmount
              }
              icon={Package}
              color="teal"
              active={activeCard === "all"}
              onClick={() => {
                setActiveCard("all");

                setFilters((f) => ({
                  ...f,
                  type: "all",
                }));
              }}
            />
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-xl border border-[#E4E0D6] bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

              {/* Search */}
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[#5C6B73]">
                  Search
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A969C]" />

                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        search: e.target.value,
                      }))
                    }
                    placeholder="Search product or note..."
                    className="w-full rounded-lg border border-[#E4E0D6] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6B73]">
                  Type
                </label>

                <select
                  value={filters.type}
                  onChange={(e) => {
                    const value = e.target.value;

                    setFilters((f) => ({
                      ...f,
                      type: value,
                    }));

                    setActiveCard(
                      value === "in"
                        ? "in"
                        : value === "out"
                        ? "out"
                        : "all"
                    );
                  }}
                  className="w-full rounded-lg border border-[#E4E0D6] bg-white px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
                >
                  <option value="all">All</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>

              {/* From */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6B73]">
                  From
                </label>

                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[#E4E0D6] bg-white px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
                />
              </div>

              {/* To */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6B73]">
                  To
                </label>

                <input
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate || undefined}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[#E4E0D6] bg-white px-3 py-2.5 text-sm text-[#1C2B33] outline-none transition focus:border-[#2F6F63] focus:ring-2 focus:ring-[#2F6F63]/10"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E0D6] px-3.5 py-2 text-sm font-medium text-[#5C6B73] transition hover:bg-[#F7F5F0]"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-[#B23A34]/20 bg-[#B23A34]/5 px-4 py-3 text-sm text-[#B23A34]">
              <span>{error}</span>

              <button
                type="button"
                onClick={loadStock}
                className="inline-flex items-center gap-1 font-medium"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-[#E4E0D6] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full text-sm">

                <thead>
                  <tr className="border-b border-[#E4E0D6] bg-[#F7F5F0] text-left text-xs font-medium uppercase tracking-wide text-[#5C6B73]">
                    <th className="px-4 py-3">
                      Product
                    </th>

                    <th className="px-4 py-3">
                      Type
                    </th>

                    <th className="px-4 py-3">
                      Quantity
                    </th>

                    <th className="px-4 py-3">
                      Unit Price
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      Profit
                    </th>

                    <th className="px-4 py-3">
                      Note
                    </th>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E4E0D6]">

                  {/* Loading */}
                  {loading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-[#8A969C]"
                      >
                        Loading stock history...
                      </td>
                    </tr>
                  )}

                  {/* Empty */}
                  {!loading &&
                    filteredMovements.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-10 text-center text-[#8A969C]"
                        >
                          No stock movements found.
                        </td>
                      </tr>
                    )}

                  {/* Rows */}
                  {!loading &&
                    filteredMovements.map(
                      (movement) => {
                        const isIn =
                          movement.type === "in";

                        return (
                          <tr
                            key={movement._id}
                            className={`border-l-4 ${
                              isIn
                                ? "border-l-emerald-500"
                                : "border-l-rose-500"
                            } transition hover:bg-[#F7F5F0]/60`}
                          >
                            {/* Product */}
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#1C2B33]">
                                {movement.product
                                  ?.name || "—"}
                              </div>

                              {movement.product
                                ?.variantName && (
                                <div className="mt-0.5 text-xs text-[#8A969C]">
                                  {
                                    movement
                                      .product
                                      .variantName
                                  }
                                </div>
                              )}
                            </td>

                            {/* Type */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                  isIn
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {isIn
                                  ? "Stock In"
                                  : "Stock Out"}
                              </span>
                            </td>

                            {/* Quantity */}
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#1C2B33]">
                                {isIn
                                  ? `${Math.round(
                                      Number(
                                        movement.petStock ||
                                          0
                                      )
                                    )} pets`
                                  : `${Math.round(
                                      Number(
                                        movement.unitStock ||
                                          0
                                      )
                                    )} units`}
                              </div>

                              <div className="mt-0.5 text-xs text-[#8A969C]">
                                {isIn
                                  ? `${Math.round(
                                      Number(
                                        movement.unitStock ||
                                          0
                                      )
                                    )} units`
                                  : `${Number(
                                      movement.petStock ||
                                        0
                                    ).toFixed(4)} pets`}
                              </div>
                            </td>

                            {/* Unit Price */}
                            <td className="px-4 py-3 text-[#5C6B73]">
                              {formatCurrency(
                                movement.unitPrice
                              )}
                            </td>

                            {/* Amount */}
                            <td
                              className={`px-4 py-3 font-medium ${
                                isIn
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {formatCurrency(
                                isIn
                                  ? movement.stockCostPrice
                                  : movement.stockSellingPrice
                              )}
                            </td>

                            {/* Profit */}
                            <td className="px-4 py-3 text-[#5C6B73]">
                              {formatCurrency(
                                movement.profit
                              )}
                            </td>

                            {/* Note */}
                            <td className="max-w-xs truncate px-4 py-3 text-[#5C6B73]">
                              {movement.note || "—"}
                            </td>

                            {/* Date */}
                            <td className="whitespace-nowrap px-4 py-3 text-[#5C6B73]">
                              {formatDate(
                                movement.createdAt
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      movement
                                    )
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8A969C] transition hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Delete stock movement"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!loading && (
              <div className="border-t border-[#E4E0D6] px-4 py-3 text-xs text-[#8A969C]">
                Showing{" "}
                {filteredMovements.length} of{" "}
                {movements.length} movements
              </div>
            )}
          </div>
        </div>

        {/* Stock Modal */}
        <StockModal
          open={modalOpen}
          mode={modalMode}
          products={products}
          form={form}
          setForm={setForm}
          submitting={submitting}
          error={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </SidebarLayout>
    </>
  );
}