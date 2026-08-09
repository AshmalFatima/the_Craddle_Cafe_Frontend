
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryApi } from "../../src/api/inventoryApi";
import { formatCurrency, formatNumber } from "./Modal";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import StockManageModal from "./StockManageModal";
import ConfirmDialog from "./ConfirmDialog";
import Sidebar from "../components/Sidebar";

export default function Product() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [variantFilter, setVariantFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    try {
      const [productData, categoryData] = await Promise.all([
        inventoryApi.listProducts(),
        inventoryApi.listCategories().catch(() => []),
      ]);

      setProducts(productData || []);
      setCategories(categoryData || []);
    } catch (e) {
      setLoadError(e.message || "Could not load products");
    } finally {
      setLoading(false);
    }
  }

  const variantOptions = useMemo(
    () =>
      [...new Set(products.map((p) => p.variantName).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.variantName} ${p.sku} ${
          p.category?.name || ""
        }`.toLowerCase();

        if (!hay.includes(q)) return false;
      }

      if (
        categoryFilter &&
        (p.category?._id || p.category) !== categoryFilter
      ) {
        return false;
      }

      if (variantFilter && p.variantName !== variantFilter) {
        return false;
      }

      if (minPrice && p.sellingPrice < Number(minPrice)) {
        return false;
      }

      if (maxPrice && p.sellingPrice > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [
    products,
    search,
    categoryFilter,
    variantFilter,
    minPrice,
    maxPrice,
  ]);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setVariantFilter("");
    setMinPrice("");
    setMaxPrice("");
  }

  const hasFilters =
    search ||
    categoryFilter ||
    variantFilter ||
    minPrice ||
    maxPrice;

  function upsertProduct(updated) {
    if (!updated) return;

    setProducts((prev) => {
      const exists = prev.some((p) => p._id === updated._id);

      return exists
        ? prev.map((p) => (p._id === updated._id ? updated : p))
        : [updated, ...prev];
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await inventoryApi.deleteProduct(deleteTarget._id);

      setProducts((prev) =>
        prev.filter((p) => p._id !== deleteTarget._id)
      );

      setDeleteTarget(null);
    } catch (e) {
      setLoadError(e.message || "Could not delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    /*
      IMPORTANT:
      Sidebar and page are siblings.

      Desktop:
      flex-row -> sidebar left + content right

      Mobile:
      flex-col -> sidebar top bar + content below
    */
    <div className="min-h-screen bg-slate-50 md:flex">

      {/* ================= SIDEBAR ================= */}
      <Sidebar
        activeKey="products"
        onNavigate={(item) => navigate(item.href)}
        user={{ name: "Admin user", email: "admin@example.com" }}
        onLogout={() => {
          // Put your logout logic here
          console.log("Logout");
        }}
      />

      {/* ================= PAGE CONTENT ================= */}
      <main className="min-w-0 flex-1">

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">

            {/* ================= HEADER ================= */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m3 7 9-4 9 4-9 4-9-4Z" />
                      <path d="m3 7 9 4 9-4" />
                      <path d="M3 7v10l9 4 9-4V7" />
                      <path d="M12 11v10" />
                    </svg>
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      Products
                    </h1>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Manage products, pricing and inventory.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    strokeLinecap="round"
                  />
                </svg>

                Add product
              </button>
            </div>

            {/* ================= SUMMARY ================= */}
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Total products"
                value={products.length}
                icon="box"
              />

              <SummaryCard
                label="Showing"
                value={filtered.length}
                icon="filter"
              />

              <SummaryCard
                label="Categories"
                value={categories.length}
                icon="category"
              />
            </div>

            {/* ================= SEARCH & FILTERS ================= */}
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Find a product
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Search or narrow the list using filters.
                  </p>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="self-start text-xs font-semibold text-indigo-600 hover:text-indigo-700 sm:self-auto"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* SEARCH */}
              <div className="relative mb-4">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product name, variant, SKU or category..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* FILTERS */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <FilterField label="Category">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">All categories</option>

                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Variant">
                  <select
                    value={variantFilter}
                    onChange={(e) => setVariantFilter(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">All variants</option>

                    {variantOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Minimum selling price">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="No minimum"
                    className="filter-input"
                  />
                </FilterField>

                <FilterField label="Maximum selling price">
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="No maximum"
                    className="filter-input"
                  />
                </FilterField>
              </div>

              {hasFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <span className="text-xs font-medium text-slate-500">
                    Active filters:
                  </span>

                  {search && (
                    <FilterBadge label={`Search: ${search}`} />
                  )}

                  {categoryFilter && (
                    <FilterBadge label="Category selected" />
                  )}

                  {variantFilter && (
                    <FilterBadge label={`Variant: ${variantFilter}`} />
                  )}

                  {minPrice && (
                    <FilterBadge
                      label={`Min: ${formatCurrency(Number(minPrice))}`}
                    />
                  )}

                  {maxPrice && (
                    <FilterBadge
                      label={`Max: ${formatCurrency(Number(maxPrice))}`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* ================= ERROR ================= */}
            {loadError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>

                <div>
                  <p className="font-semibold">
                    Something went wrong
                  </p>

                  <p className="mt-0.5 text-xs">
                    {loadError}
                  </p>
                </div>
              </div>
            )}

            {/* ================= TABLE ================= */}
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Product inventory
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {loading
                      ? "Loading products..."
                      : `${filtered.length} product${
                          filtered.length === 1 ? "" : "s"
                        } displayed`}
                  </p>
                </div>

                {!loading && products.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {filtered.length} / {products.length}
                  </span>
                )}
              </div>

              {/* 
                IMPORTANT FOR MOBILE:
                Only the table itself scrolls horizontally.
                The page does NOT become wider than the viewport.
              */}
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">

                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Product
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Category
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        SKU
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Pet stock
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Unit stock
                      </th>

                      <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Cost / item
                      </th>

                      <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Sell / item
                      </th>

                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                            <p className="mt-3 text-sm font-medium text-slate-500">
                              Loading products...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                              <svg
                                width="25"
                                height="25"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-4-4" />
                              </svg>
                            </div>

                            <p className="mt-4 font-semibold text-slate-800">
                              {products.length === 0
                                ? "No products yet"
                                : "No matching products"}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {products.length === 0
                                ? "Add your first product to start managing your inventory."
                                : "Try changing your search or clearing the filters."}
                            </p>

                            {products.length === 0 && (
                              <button
                                type="button"
                                onClick={() => setAddOpen(true)}
                                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                Add your first product
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => {
                        const lowStock =
                          Number(p.unitStock) > 0 &&
                          Number(p.unitStock) <= 10;

                        const outOfStock =
                          Number(p.unitStock) === 0;

                        return (
                          <tr
                            key={p._id}
                            className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                                  {p.name?.charAt(0)?.toUpperCase() || "P"}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {p.name}
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {p.variantName || "No variant"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {p.category?.name || "—"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">
                                {p.sku || "—"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span className="font-semibold text-slate-700">
                                {formatNumber(p.petStock)}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span
                                className={`inline-flex min-w-[58px] justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                  outOfStock
                                    ? "bg-rose-50 text-rose-700"
                                    : lowStock
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {formatNumber(p.unitStock)}
                              </span>

                              <p
                                className={`mt-1 text-[10px] font-medium ${
                                  outOfStock
                                    ? "text-rose-500"
                                    : lowStock
                                    ? "text-amber-500"
                                    : "text-emerald-500"
                                }`}
                              >
                                {outOfStock
                                  ? "Out of stock"
                                  : lowStock
                                  ? "Low stock"
                                  : "In stock"}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <span className="font-medium text-slate-600">
                                {formatCurrency(p.unitPrice)}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <span className="text-base font-bold text-slate-900">
                                {formatCurrency(p.sellingPrice)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <ActionButton
                                  label="Stock"
                                  onClick={() => setStockProduct(p)}
                                  tone="indigo"
                                />

                                <ActionButton
                                  label="Edit"
                                  onClick={() => setEditProduct(p)}
                                  tone="slate"
                                />

                                <ActionButton
                                  label="Delete"
                                  onClick={() => setDeleteTarget(p)}
                                  tone="rose"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!loading && products.length > 0 && (
              <p className="mt-3 px-1 text-xs text-slate-400">
                Showing {filtered.length} of {products.length} products
              </p>
            )}
          </div>
        </div>
      </main>

      {/* ================= MODALS ================= */}

      <AddProductModal
        open={addOpen}
        categories={categories}
        onClose={() => setAddOpen(false)}
        onCreated={(p) => upsertProduct(p)}
      />

      <EditProductModal
        open={!!editProduct}
        product={editProduct}
        categories={categories}
        onClose={() => setEditProduct(null)}
        onUpdated={(p) => upsertProduct(p)}
      />

      <StockManageModal
        open={!!stockProduct}
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onStockChanged={(p) => {
          upsertProduct(p);
          setStockProduct(p);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this product?"
        message={
          deleteTarget
            ? `"${deleteTarget.name} — ${deleteTarget.variantName}" and its stock history will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon === "box" && (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 7 9-4 9 4-9 4-9-4Z" />
              <path d="M3 7v10l9 4 9-4V7" />
              <path d="M12 11v10" />
            </svg>
          )}

          {icon === "filter" && (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
          )}

          {icon === "category" && (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER FIELD
========================================================= */

function FilterField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   FILTER BADGE
========================================================= */

function FilterBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700">
      {label}
    </span>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({ label, onClick, tone }) {
  const tones = {
    indigo:
      "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",

    slate:
      "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",

    rose:
      "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-slate-100 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

