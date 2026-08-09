
import React, { useMemo, useState } from "react";
import Modal, { formatCurrency, formatNumber } from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import { getVariantSuggestions } from "./variantSuggestions";
import { inventoryApi } from "../../src/api/inventoryApi";

const STEPS = ["Details", "Stock & Cost", "Selling Price", "Review"];

const emptyForm = {
  category: "",
  name: "",
  variantName: "",
  petPrice: "",
  itemsPerPet: "",
  petStock: "",
  sellingPrice: "",
};

export default function AddProductModal({
  open,
  categories,
  onClose,
  onCreated,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCategory = categories.find(
    (c) => c._id === form.category
  );

  const variantSuggestions = getVariantSuggestions(
    selectedCategory?.name
  );

  const unitPrice = useMemo(() => {
    const price = Number(form.petPrice);
    const items = Number(form.itemsPerPet);

    return price > 0 && items > 0 ? price / items : 0;
  }, [form.petPrice, form.itemsPerPet]);

  const totalCostingPrice = useMemo(
    () =>
      Number(form.petPrice || 0) *
      Number(form.petStock || 0),
    [form.petPrice, form.petStock]
  );

  const unitStock = useMemo(
    () =>
      Number(form.itemsPerPet || 0) *
      Number(form.petStock || 0),
    [form.itemsPerPet, form.petStock]
  );

  const totalSellingPrice = useMemo(
    () =>
      Number(form.sellingPrice || 0) *
      unitStock,
    [form.sellingPrice, unitStock]
  );

  const totalProfit = totalSellingPrice - totalCostingPrice;

  const profitPerItem =
    Number(form.sellingPrice || 0) - unitPrice;

  function reset() {
    setForm(emptyForm);
    setStep(0);
    setError("");
    setConfirmOpen(false);
    setSaving(false);
  }

  function close() {
    reset();
    onClose();
  }

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validateStep(currentStep) {
    setError("");

    if (currentStep === 0) {
      if (!form.category) {
        return "Please choose a category.";
      }

      if (!form.name.trim()) {
        return "Please enter a product name.";
      }

      if (!form.variantName.trim()) {
        return "Please enter a variant name.";
      }
    }

    if (currentStep === 1) {
      if (!(Number(form.petPrice) > 0)) {
        return "Enter a valid carton / pet price.";
      }

      if (!(Number(form.itemsPerPet) > 0)) {
        return "Enter a valid items-per-pet count.";
      }

      if (!(Number(form.petStock) > 0)) {
        return "Enter how many pets / cartons you're stocking.";
      }
    }

    if (currentStep === 2) {
      if (!(Number(form.sellingPrice) > 0)) {
        return "Enter a valid selling price.";
      }

      if (Number(form.sellingPrice) < unitPrice) {
        return "Selling price can't be less than the per-item cost.";
      }
    }

    return "";
  }

  function goNext() {
    const validationError = validateStep(step);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (step === STEPS.length - 1) {
      setConfirmOpen(true);
      return;
    }

    setStep((current) => current + 1);
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleConfirm() {
    setSaving(true);

    try {
      const res = await inventoryApi.createProduct({
        category: form.category,
        name: form.name.trim(),
        variantName: form.variantName.trim(),
        petStock: form.petStock,
        itemsPerPet: form.itemsPerPet,
        sellingPrice: form.sellingPrice,
        petPrice: form.petPrice,
      });

      onCreated?.(res.product);

      setConfirmOpen(false);
      close();
    } catch (e) {
      setConfirmOpen(false);
      setError(e.message || "Could not add product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        title="Add new product"
        subtitle={`${STEPS[step]} • Step ${step + 1} of ${STEPS.length}`}
      >
        {/* =====================================================
            PROGRESS
        ===================================================== */}
        <div className="mb-7">
          <div className="mb-4 flex items-center justify-between">
            {STEPS.map((label, index) => {
              const completed = index < step;
              const active = index === step;

              return (
                <div
                  key={label}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      completed
                        ? "bg-emerald-100 text-emerald-700"
                        : active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {completed ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  <span
                    className={`hidden text-xs font-semibold sm:block ${
                      active
                        ? "text-slate-900"
                        : completed
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>

                  {index < STEPS.length - 1 && (
                    <div
                      className={`mx-1 hidden h-px w-8 sm:block ${
                        index < step
                          ? "bg-emerald-300"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* =====================================================
            STEP 1 — DETAILS
        ===================================================== */}
        {step === 0 && (
          <div className="space-y-5">
            <SectionHeading
              title="Product details"
              description="Enter the basic information for this product."
            />

            {/* Category */}
            <Field
              label="Category"
              required
              help="Choose the category this product belongs to."
            >
              <select
                value={form.category}
                onChange={(e) =>
                  update("category", e.target.value)
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Select a category</option>

                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Product + Variant */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Product name"
                required
                help="Example: Whiskas, Surf Excel, Nestle"
              >
                <input
                  value={form.name}
                  onChange={(e) =>
                    update("name", e.target.value)
                  }
                  placeholder="Enter product name"
                  autoFocus
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field
                label="Variant name"
                required
                help="Example: Chicken, 500ml, Large"
              >
                <input
                  value={form.variantName}
                  onChange={(e) =>
                    update("variantName", e.target.value)
                  }
                  placeholder="Enter variant"
                  list="variant-suggestions"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <datalist id="variant-suggestions">
                  {variantSuggestions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </Field>
            </div>

            {/* Suggestions */}
            {form.category &&
              variantSuggestions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Suggested variants
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {variantSuggestions.map((v) => {
                      const selected =
                        form.variantName === v;

                      return (
                        <button
                          type="button"
                          key={v}
                          onClick={() =>
                            update("variantName", v)
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            selected
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Product preview */}
            {form.name && form.variantName && (
              <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500">
                  Product preview
                </p>

                <p className="mt-1 text-lg font-bold text-indigo-950">
                  {form.name}{" "}
                  <span className="font-normal text-indigo-400">
                    —
                  </span>{" "}
                  {form.variantName}
                </p>

                {selectedCategory && (
                  <p className="mt-1 text-xs font-medium text-indigo-600">
                    {selectedCategory.name}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            STEP 2 — STOCK & COST
        ===================================================== */}
        {step === 1 && (
          <div className="space-y-5">
            <SectionHeading
              title="Stock & cost"
              description="Enter your purchase cost and the opening quantity."
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Pet Price */}
              <Field
                label="Pet / carton price"
                required
                help="Cost of one complete pet or carton."
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rs.
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.petPrice}
                    onChange={(e) =>
                      update("petPrice", e.target.value)
                    }
                    placeholder="0.00"
                    autoFocus
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-4 pl-14 pr-4 text-xl font-bold text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-300 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </Field>

              {/* Items per pet */}
              <Field
                label="Items per pet"
                required
                help="Number of individual units inside one pet/carton."
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.itemsPerPet}
                  onChange={(e) =>
                    update("itemsPerPet", e.target.value)
                  }
                  placeholder="e.g. 12"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-xl font-bold text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-300 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>
            </div>

            {/* Opening Stock */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 p-5">
              <Field
                label="Opening stock"
                required
                help="How many complete pets / cartons are you adding right now?"
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.petStock}
                  onChange={(e) =>
                    update("petStock", e.target.value)
                  }
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border-2 border-indigo-200 bg-white px-4 py-4 text-2xl font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-base placeholder:font-normal placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              {unitStock > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Total individual units
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatNumber(form.petStock)} pets ×{" "}
                      {formatNumber(form.itemsPerPet)} items
                    </p>
                  </div>

                  <span className="text-xl font-bold text-indigo-700">
                    {formatNumber(unitStock)}
                  </span>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Cost summary
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <CalculationCard
                  label="Cost per item"
                  value={formatCurrency(unitPrice)}
                  primary
                />

                <CalculationCard
                  label="Total units"
                  value={formatNumber(unitStock)}
                />

                <CalculationCard
                  label="Total cost"
                  value={formatCurrency(totalCostingPrice)}
                />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 3 — SELLING PRICE
        ===================================================== */}
        {step === 2 && (
          <div className="space-y-5">
            <SectionHeading
              title="Selling price"
              description="Set the price customers will pay for one individual item."
            />

            {/* Main selling price */}
            <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-5">
              <Field
                label="Selling price per item"
                required
                help="This is the final price charged to the customer for one unit."
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    Rs.
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) =>
                      update(
                        "sellingPrice",
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                    autoFocus
                    className="w-full rounded-xl border-2 border-indigo-300 bg-white py-5 pl-14 pr-4 text-3xl font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </Field>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                <span className="text-xs font-medium text-slate-500">
                  Your cost per item
                </span>

                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(unitPrice)}
                </span>
              </div>
            </div>

            {/* Profit calculations */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Expected results
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <CalculationCard
                  label="Profit / item"
                  value={formatCurrency(
                    profitPerItem
                  )}
                  tone={
                    profitPerItem >= 0
                      ? "positive"
                      : "negative"
                  }
                />

                <CalculationCard
                  label="Total selling value"
                  value={formatCurrency(
                    totalSellingPrice
                  )}
                />

                <CalculationCard
                  label="Expected profit"
                  value={formatCurrency(totalProfit)}
                  tone={
                    totalProfit >= 0
                      ? "positive"
                      : "negative"
                  }
                />
              </div>
            </div>

            {/* Price status */}
            {Number(form.sellingPrice) > 0 &&
              unitPrice > 0 && (
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    profitPerItem >= 0
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      profitPerItem >= 0
                        ? "text-emerald-800"
                        : "text-rose-800"
                    }`}
                  >
                    {profitPerItem >= 0
                      ? "✓ Selling price is above your cost."
                      : "⚠ Selling price is below your cost."}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* =====================================================
            STEP 4 — REVIEW
        ===================================================== */}
        {step === 3 && (
          <div className="space-y-5">
            <SectionHeading
              title="Review product"
              description="Check the information below before adding the product."
            />

            {/* Product identity */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500">
                Product
              </p>

              <p className="mt-1 text-xl font-bold text-indigo-950">
                {form.name}{" "}
                <span className="font-normal text-indigo-400">
                  —
                </span>{" "}
                {form.variantName}
              </p>

              <p className="mt-1 text-sm font-medium text-indigo-700">
                {selectedCategory?.name || "No category"}
              </p>
            </div>

            {/* Stock overview */}
            <div className="grid grid-cols-2 gap-3">
              <ReviewCard
                label="Opening stock"
                value={formatNumber(form.petStock)}
                suffix="pets"
              />

              <ReviewCard
                label="Total units"
                value={formatNumber(unitStock)}
                suffix="units"
                primary
              />

              <ReviewCard
                label="Cost / item"
                value={formatCurrency(unitPrice)}
              />

              <ReviewCard
                label="Selling / item"
                value={formatCurrency(
                  form.sellingPrice
                )}
              />
            </div>

            {/* Full summary */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <SummaryRow
                label="Category"
                value={selectedCategory?.name}
              />

              <SummaryRow
                label="Pets / cartons"
                value={formatNumber(form.petStock)}
              />

              <SummaryRow
                label="Items per pet"
                value={formatNumber(form.itemsPerPet)}
              />

              <SummaryRow
                label="Total units"
                value={formatNumber(unitStock)}
                strong
              />

              <SummaryRow
                label="Cost per item"
                value={formatCurrency(unitPrice)}
              />

              <SummaryRow
                label="Selling price per item"
                value={formatCurrency(
                  form.sellingPrice
                )}
                strong
              />

              <SummaryRow
                label="Total cost"
                value={formatCurrency(
                  totalCostingPrice
                )}
              />

              <SummaryRow
                label="Total selling value"
                value={formatCurrency(
                  totalSellingPrice
                )}
              />

              <SummaryRow
                label="Expected profit"
                value={formatCurrency(totalProfit)}
                highlight={
                  totalProfit >= 0
                    ? "positive"
                    : "negative"
                }
                strong
                last
              />
            </div>

            {/* Stock notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs leading-5 text-amber-800">
                <span className="font-bold">
                  Opening stock:
                </span>{" "}
                Adding this product will create{" "}
                <span className="font-bold">
                  {formatNumber(unitStock)} units
                </span>{" "}
                in stock and record the opening stock-in
                entry.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
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

        {/* =====================================================
            ACTION BUTTONS
        ===================================================== */}
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={step === 0 ? close : goBack}
            className="rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>

          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            {step === STEPS.length - 1
              ? "Review & add product"
              : "Continue"}
          </button>
        </div>
      </Modal>

      {/* =====================================================
          CONFIRMATION
      ===================================================== */}
      <ConfirmDialog
        open={confirmOpen}
        title="Add this product?"
        message={`This creates "${form.name} — ${form.variantName}" with ${formatNumber(
          unitStock
        )} units in stock and logs the opening stock-in entry.`}
        confirmLabel="Add product"
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ title, description }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  children,
  required = false,
  help,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </span>

      {children}

      {help && (
        <p className="mt-2 text-xs leading-4 text-slate-500">
          {help}
        </p>
      )}
    </label>
  );
}

/* =========================================================
   CALCULATION CARD
========================================================= */

function CalculationCard({
  label,
  value,
  tone,
  primary = false,
}) {
  const containerClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "negative"
      ? "border-rose-200 bg-rose-50"
      : primary
      ? "border-indigo-200 bg-indigo-50"
      : "border-slate-200 bg-white";

  const labelClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-rose-600"
      : primary
      ? "text-indigo-600"
      : "text-slate-500";

  const valueClass =
    tone === "positive"
      ? "text-emerald-800"
      : tone === "negative"
      ? "text-rose-800"
      : primary
      ? "text-indigo-900"
      : "text-slate-900";

  return (
    <div
      className={`rounded-xl border-2 px-4 py-4 ${containerClass}`}
    >
      <p
        className={`text-xs font-semibold ${labelClass}`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function ReviewCard({
  label,
  value,
  suffix,
  primary = false,
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        primary
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          primary
            ? "text-indigo-600"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${
          primary
            ? "text-indigo-900"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

      {suffix && (
        <p className="text-[11px] text-slate-400">
          {suffix}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  highlight,
  strong = false,
  last = false,
}) {
  const valueClass =
    highlight === "positive"
      ? "text-emerald-600"
      : highlight === "negative"
      ? "text-rose-600"
      : "text-slate-900";

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
        !last ? "border-b border-slate-100" : ""
      }`}
    >
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-right text-sm ${
          strong ? "font-bold" : "font-semibold"
        } ${valueClass}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

