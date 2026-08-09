
import React, { useEffect, useMemo, useState } from "react";
import Modal, { formatCurrency } from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import { inventoryApi } from "../../src/api/inventoryApi";

export default function EditProductModal({
  open,
  product,
  categories,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        category: product.category?._id || product.category || "",
        name: product.name || "",
        variantName: product.variantName || "",
        petPrice: product.petPrice ?? "",
        sellingPrice: product.sellingPrice ?? "",
        itemsPerPet: product.itemsPerPet ?? "",
      });
      setError("");
    }
  }, [product]);

  const unitPrice = useMemo(() => {
    if (!form) return 0;

    const petPrice = Number(form.petPrice);
    const items = Number(form.itemsPerPet);

    return petPrice > 0 && items > 0 ? petPrice / items : 0;
  }, [form]);

  const profitPerItem = useMemo(() => {
    if (!form) return 0;

    const sellingPrice = Number(form.sellingPrice);

    return sellingPrice > 0 && unitPrice > 0
      ? sellingPrice - unitPrice
      : 0;
  }, [form, unitPrice]);

  if (!open || !form) return null;

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) setError("");
  }

  function validate() {
    if (!form.category) return "Please choose a category.";

    if (!form.name.trim()) return "Please enter a product name.";

    if (!form.variantName.trim()) return "Please enter a variant name.";

    if (!(Number(form.petPrice) > 0)) {
      return "Enter a valid pet/carton price.";
    }

    if (!(Number(form.itemsPerPet) > 0)) {
      return "Enter a valid items-per-pet count.";
    }

    if (!(Number(form.sellingPrice) > 0)) {
      return "Enter a valid selling price.";
    }

    if (Number(form.sellingPrice) < unitPrice) {
      return "Selling price can't be less than the per-item cost.";
    }

    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSaving(true);

    try {
      const res = await inventoryApi.updateProduct(product._id, form);

      onUpdated?.(res.updatedProduct);
      setConfirmOpen(false);
      onClose();
    } catch (e) {
      setConfirmOpen(false);
      setError(e.message || "Could not update product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Edit product"
        subtitle="Update product information and pricing"
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Product Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                Product information
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Basic information used to identify this product.
              </p>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Category
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">Select category</option>

                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Name + Variant */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Product name
                    <span className="ml-1 text-rose-500">*</span>
                  </span>

                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Coca Cola"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Variant name
                    <span className="ml-1 text-rose-500">*</span>
                  </span>

                  <input
                    value={form.variantName}
                    onChange={(e) =>
                      update("variantName", e.target.value)
                    }
                    placeholder="e.g. 500ml"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                Pricing
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Set your purchase price and selling price.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Pet Price */}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Pet / Carton price
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.petPrice}
                    onChange={(e) => update("petPrice", e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Total cost of one pet/carton
                </p>
              </label>

              {/* Items Per Pet */}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Items per pet
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.itemsPerPet}
                  onChange={(e) => update("itemsPerPet", e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  Number of individual items inside one pet/carton
                </p>
              </label>

              {/* Selling Price */}
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Selling price per item
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    update("sellingPrice", e.target.value)
                  }
                  placeholder="0.00"
                  className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-4 ${
                    Number(form.sellingPrice) > 0 &&
                    Number(form.sellingPrice) >= unitPrice
                      ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-50"
                      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-50"
                  }`}
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  Price customers pay for one individual item
                </p>
              </label>
            </div>

            {/* Calculated values */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4">
                <p className="text-xs font-medium text-indigo-600">
                  Cost per item
                </p>

                <p className="mt-1 text-xl font-bold text-indigo-900">
                  {formatCurrency(unitPrice)}
                </p>

                <p className="mt-1 text-[11px] text-indigo-600">
                  Automatically calculated from pet price
                </p>
              </div>

              <div
                className={`rounded-xl border px-4 py-4 ${
                  profitPerItem >= 0
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-rose-100 bg-rose-50"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    profitPerItem >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  Profit per item
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${
                    profitPerItem >= 0
                      ? "text-emerald-900"
                      : "text-rose-900"
                  }`}
                >
                  {formatCurrency(profitPerItem)}
                </p>

                <p
                  className={`mt-1 text-[11px] ${
                    profitPerItem >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  Selling price − cost per item
                </p>
              </div>
            </div>
          </section>

          {/* Stock information */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5">
            <div className="mt-0.5 text-amber-600">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Stock quantity isn't edited here
              </p>

              <p className="mt-0.5 text-xs leading-5 text-amber-700">
                Use <span className="font-semibold">Manage Stock</span> to
                add stock in or remove stock out.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>

              <p className="text-sm font-medium text-rose-700">
                {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Save these changes?"
        message="This updates the product's details. Existing stock quantities won't change."
        confirmLabel="Save changes"
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

