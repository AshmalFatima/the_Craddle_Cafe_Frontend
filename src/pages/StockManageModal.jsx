
import React, { useEffect, useMemo, useState } from "react";
import Modal, { formatCurrency, formatNumber } from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import { inventoryApi } from "../../src/api/inventoryApi";

export default function StockManageModal({ open, product, onClose, onStockChanged }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });
  const [search, setSearch] = useState("");

  const [movement, setMovement] = useState(null);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && product) {
      loadHistory();
      setMovement(null);
      setQty("");
      setNote("");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?._id]);

  async function loadHistory(customFilters = filters) {
    if (!product) return;

    setLoadingHistory(true);

    try {
      const data = await inventoryApi.stockHistory(product._id, customFilters);
      setHistory(data || []);
    } catch (e) {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  const filteredHistory = useMemo(() => {
    if (!search.trim()) return history;

    const q = search.trim().toLowerCase();

    return history.filter(
      (h) =>
        (h.note || "").toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        new Date(h.createdAt)
          .toLocaleDateString()
          .toLowerCase()
          .includes(q)
    );
  }, [history, search]);

  if (!open || !product) return null;

  const itemsPerPet = product.itemsPerPet;

  const unitStockValue = product.unitStock * product.sellingPrice;
  const unitStockCost = product.unitStock * product.unitPrice;
  const currentProfitPotential = unitStockValue - unitStockCost;

  // Stock in uses pets/cartons; stock out uses individual units.
  const enteredQty = Number(qty) || 0;

  const unitsForQty =
    movement?.direction === "out"
      ? enteredQty
      : enteredQty * itemsPerPet;

  const petsForQty =
    movement?.direction === "out"
      ? enteredQty / itemsPerPet
      : enteredQty;

  function openMovement(direction) {
    setMovement({ direction });
    setQty("");
    setNote("");
    setError("");
  }

  function handleMovementSubmit(e) {
    e.preventDefault();

    if (!Number.isInteger(enteredQty) || enteredQty <= 0) {
      setError(
        `Enter a whole number of ${
          movement.direction === "in" ? "pets/cartons" : "units"
        } greater than 0.`
      );
      return;
    }

    if (
      movement.direction === "out" &&
      enteredQty > product.unitStock
    ) {
      setError(
        `Only ${formatNumber(product.unitStock)} units (${formatNumber(
          product.petStock
        )} pets) available.`
      );
      return;
    }

    setError("");
    setConfirming(true);
  }

  async function confirmMovement() {
    setSaving(true);

    try {
      const payload =
        movement.direction === "in"
          ? {
              product: product._id,
              petStock: enteredQty,
              note,
            }
          : {
              product: product._id,
              unitStock: enteredQty,
              note,
            };

      const res =
        movement.direction === "in"
          ? await inventoryApi.stockIn(payload)
          : await inventoryApi.stockOut(payload);

      onStockChanged?.(res.product);

      setConfirming(false);
      setMovement(null);
      setQty("");
      setNote("");

      loadHistory();
    } catch (e) {
      setConfirming(false);
      setError(e.message || "Could not update stock");
    } finally {
      setSaving(false);
    }
  }

  function applyFilters(next) {
    const merged = {
      ...filters,
      ...next,
    };

    if (
      merged.startDate &&
      merged.endDate &&
      merged.startDate >= merged.endDate
    ) {
      setError("Start date must be before the end date.");
      return;
    }

    setError("");
    setFilters(merged);
    loadHistory(merged);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Manage stock"
        subtitle={`${product.name} — ${product.variantName}`}
        maxWidth="max-w-2xl"
      >
        {/* Current stock & pricing */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
          <Stat
            label="Pets / cartons"
            value={formatNumber(product.petStock)}
          />

          <Stat
            label="Units in stock"
            value={formatNumber(product.unitStock)}
          />

          <Stat
            label="Cost per item"
            value={formatCurrency(product.unitPrice)}
          />

          <Stat
            label="Selling price / item"
            value={formatCurrency(product.sellingPrice)}
          />

          <Stat
            label="Cost value of stock"
            value={formatCurrency(unitStockCost)}
          />

          <Stat
            label="Selling value of stock"
            value={formatCurrency(unitStockValue)}
          />

          <Stat
            label="Profit potential"
            value={formatCurrency(currentProfitPotential)}
            tone={
              currentProfitPotential >= 0
                ? "positive"
                : "negative"
            }
          />

          <Stat
            label="Units per pet"
            value={formatNumber(product.itemsPerPet)}
          />
        </div>

        {/* Stock actions */}
        {!movement ? (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => openMovement("in")}
              className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              + Stock in
            </button>

            <button
              onClick={() => openMovement("out")}
              className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              − Stock out
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleMovementSubmit}
            className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="mb-4 text-sm font-semibold text-slate-800">
              {movement.direction === "in"
                ? "Stock in — add stock"
                : "Stock out — remove stock"}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Quantity */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {movement.direction === "in"
                    ? "Pets / cartons"
                    : "Units"}
                </span>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) =>
                      setQty(
                        e.target.value.replace(/[^0-9]/g, "")
                      )
                    }
                    placeholder={
                      movement.direction === "in"
                        ? "e.g. 10"
                        : "e.g. 25"
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    autoFocus
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {movement.direction === "in"
                      ? "pets"
                      : "units"}
                  </span>
                </div>

                <span className="mt-1.5 block text-xs text-slate-500">
                  {movement.direction === "in"
                    ? `Adds ${formatNumber(
                        unitsForQty
                      )} units (${formatNumber(
                        itemsPerPet
                      )} units per pet/carton)`
                    : `Available: ${formatNumber(
                        product.unitStock
                      )} units`}
                </span>
              </label>

              {/* Note */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Note{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </span>

                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    movement.direction === "in"
                      ? "e.g. New delivery"
                      : "e.g. Sale"
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>
            </div>

            {error && (
              <p className="mt-3 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMovement(null);
                  setQty("");
                  setNote("");
                  setError("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  movement.direction === "in"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                {movement.direction === "in"
                  ? "Add stock"
                  : "Remove stock"}
              </button>
            </div>
          </form>
        )}

        {/* History */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Stock history
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Filter movements by type or date range.
              </p>
            </div>
          </div>

          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex flex-wrap items-end gap-2">
              

              {/* Type */}
              <select
                value={filters.type}
                onChange={(e) =>
                  applyFilters({
                    type: e.target.value,
                  })
                }
                className="input w-auto"
              >
                <option value="">All types</option>
                <option value="in">Stock in</option>
                <option value="out">Stock out</option>
              </select>

              {/* Start date */}
              <label className="flex min-w-[145px] flex-1 flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  From
                </span>

                <input
                  type="date"
                  value={filters.startDate}
                  max={
                    filters.endDate
                      ? new Date(
                          new Date(
                            filters.endDate
                          ).getTime() - 86400000
                        )
                          .toISOString()
                          .slice(0, 10)
                      : undefined
                  }
                  onChange={(e) =>
                    applyFilters({
                      startDate: e.target.value,
                    })
                  }
                  className="input w-full"
                />
              </label>

              {/* End date */}
              <label className="flex min-w-[145px] flex-1 flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  To
                </span>

                <input
                  type="date"
                  value={filters.endDate}
                  min={
                    filters.startDate
                      ? new Date(
                          new Date(
                            filters.startDate
                          ).getTime() + 86400000
                        )
                          .toISOString()
                          .slice(0, 10)
                      : undefined
                  }
                  onChange={(e) =>
                    applyFilters({
                      endDate: e.target.value,
                    })
                  }
                  className="input w-full"
                />
              </label>
            </div>

            {!movement && error && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {error}
              </p>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {loadingHistory ? (
              <p className="p-4 text-sm text-slate-400">
                Loading history…
              </p>
            ) : filteredHistory.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                No stock movements match these filters.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left">
                      Type
                    </th>
                    <th className="px-3 py-2 text-right">
                      Pets
                    </th>
                    <th className="px-3 py-2 text-right">
                      Units
                    </th>
                    <th className="px-3 py-2 text-left">
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((h) => (
                    <tr
                      key={h._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-2 text-slate-600">
                        {new Date(
                          h.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            h.type === "in"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {h.type === "in"
                            ? "Stock in"
                            : "Stock out"}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatNumber(h.petStock)}
                      </td>

                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatNumber(h.unitStock)}
                      </td>

                      <td className="px-3 py-2 text-slate-500">
                        {h.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirming}
        title={
          movement?.direction === "in"
            ? "Add this stock?"
            : "Remove this stock?"
        }
        message={`${
          movement?.direction === "in"
            ? "Adding"
            : "Removing"
        } ${formatNumber(unitsForQty)} units (${formatNumber(
          petsForQty
        )} pets/cartons) ${
          movement?.direction === "in" ? "to" : "from"
        } ${product.name} — ${product.variantName}.`}
        confirmLabel={
          movement?.direction === "in"
            ? "Add stock"
            : "Remove stock"
        }
        tone={
          movement?.direction === "in"
            ? "primary"
            : "danger"
        }
        loading={saving}
        onConfirm={confirmMovement}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

function Stat({ label, value, tone }) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-rose-600"
      : "text-slate-900";

  return (
    <div>
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`text-sm font-semibold ${toneClass}`}
      >
        {value}
      </p>
    </div>
  );
}

