import React, { useEffect, useState, useCallback } from "react";
import SidebarLayout from "../components/SidebarLayout";

// Point this at wherever your expense routes are mounted
const API_BASE = "https://the-craddle-cafe-backend.vercel.app/api/expenses";

const TYPES = {
  ALL: "all",
  CASH_IN: "Cash In",
  CASH_OUT: "Cash Out",
};

const EMPTY_FILTERS = {
  description: "",
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
};

const EMPTY_FORM = {
  amount: "",
  type: "Cash In",
  note: "",
};

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
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ------------------------------------------------------------
// Icons
// ------------------------------------------------------------

const IconPlus = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    {...props}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconSearch = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    {...props}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

const IconX = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    {...props}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const IconTrash = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    {...props}
  >
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
  </svg>
);

export default function Expense() {
  const [expenses, setExpenses] = useState([]);

  const [totals, setTotals] = useState({
    cashIn: 0,
    cashOut: 0,
    balance: 0,
  });

  const [activeFilter, setActiveFilter] = useState(TYPES.ALL);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [formError, setFormError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ------------------------------------------------------------
  // Query parameters
  // ------------------------------------------------------------

  const buildParams = useCallback(
    (base = {}) => {
      const params = new URLSearchParams();

      if (activeFilter !== TYPES.ALL) {
        params.set("type", activeFilter);
      }

      if (filters.description.trim()) {
        params.set("description", filters.description.trim());
      }

      if (filters.minAmount) {
        params.set("minAmount", filters.minAmount);
      }

      if (filters.maxAmount) {
        params.set("maxAmount", filters.maxAmount);
      }

      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      Object.entries(base).forEach(([key, value]) => {
        params.set(key, value);
      });

      return params;
    },
    [activeFilter, filters]
  );

  // ------------------------------------------------------------
  // Load expenses
  // ------------------------------------------------------------

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = buildParams();

      const res = await fetch(
        `${API_BASE}/search?${params.toString()}`,
        {
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load expenses"
        );
      }

      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while loading expenses"
      );

      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // ------------------------------------------------------------
  // Load totals
  // ------------------------------------------------------------

  const loadTotals = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      const res = await fetch(
        `${API_BASE}/total?${params.toString()}`,
        {
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load totals"
        );
      }

      setTotals(data);
    } catch {
      // Totals are supplementary.
    }
  }, [filters.startDate, filters.endDate]);

  // ------------------------------------------------------------
  // Initial loading / filter change
  // ------------------------------------------------------------

  useEffect(() => {
    loadExpenses();
    loadTotals();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  // ------------------------------------------------------------
  // Search
  // ------------------------------------------------------------

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    loadExpenses();
    loadTotals();
  };

  // ------------------------------------------------------------
  // Reset filters
  // ------------------------------------------------------------

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);

    setTimeout(() => {
      loadExpenses();
      loadTotals();
    }, 0);
  };

  // ------------------------------------------------------------
  // Form
  // ------------------------------------------------------------

  const handleFormChange = (field) => (e) => {
    setForm((current) => ({
      ...current,
      [field]: e.target.value,
    }));
  };

  // ------------------------------------------------------------
  // Add expense
  // ------------------------------------------------------------

  const handleAddExpense = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Enter an amount greater than 0");
      return;
    }

    if (!form.type) {
      setFormError("Select a type");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          amount: form.amount,
          type: form.type,
          description: form.note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to add expense"
        );
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);

      loadExpenses();
      loadTotals();
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this entry? This can't be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to delete expense"
        );
      }

      loadExpenses();
      loadTotals();
    } catch (err) {
      setError(
        err.message || "Failed to delete expense"
      );
    }
  };

  // ------------------------------------------------------------
  // Summary cards
  // ------------------------------------------------------------

  const cardMeta = [
    {
      key: TYPES.ALL,
      label: "All",
      value: formatCurrency(
        (totals.cashIn || 0) +
          (totals.cashOut || 0)
      ),
      sub: "Combined activity",
      accent: "teal",
    },
    {
      key: TYPES.CASH_IN,
      label: "Cash In",
      value: formatCurrency(totals.cashIn),
      sub: `${totals.cashInCount ?? 0} entries`,
      accent: "emerald",
    },
    {
      key: TYPES.CASH_OUT,
      label: "Cash Out",
      value: formatCurrency(totals.cashOut),
      sub: `${totals.cashOutCount ?? 0} entries`,
      accent: "rose",
    },
  ];

  const accentClasses = {
    teal: {
      ring: "ring-teal-600",
      border: "border-teal-200",
      text: "text-teal-700",
      dot: "bg-teal-600",
      bg: "bg-teal-50",
    },

    emerald: {
      ring: "ring-emerald-600",
      border: "border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-600",
      bg: "bg-emerald-50",
    },

    rose: {
      ring: "ring-rose-600",
      border: "border-rose-200",
      text: "text-rose-700",
      dot: "bg-rose-600",
      bg: "bg-rose-50",
    },
  };

  // ------------------------------------------------------------
  // USER
  // ------------------------------------------------------------

  const user = {
    name:
      localStorage.getItem("userName") ||
      "Admin user",

    contact:
      localStorage.getItem("userEmail") ||
      "admin@example.com",
  };

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <>
      {/*
        SidebarLayout owns the sidebar + responsive shell now.
        Everything below is just this page's content.
      */}
      <SidebarLayout
        activeKey="expenses"
        user={user}
        onNavigate={(item) => {
          window.location.href = item.href;
        }}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");

          window.location.href = "/signin";
        }}
      >
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Expense Manager
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Track cash in and cash out, in one place.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800"
            >
              <IconPlus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cardMeta.map((card) => {
              const a = accentClasses[card.accent];

              const isActive =
                activeFilter === card.key;

              return (
                <button
                  key={card.key}
                  onClick={() =>
                    setActiveFilter(card.key)
                  }
                  className={`rounded-xl border bg-white p-4 text-left transition-all ${
                    isActive
                      ? `${a.border} ring-2 ${a.ring} ring-offset-2 ring-offset-slate-50`
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${a.dot}`}
                    />

                    <span className="text-sm font-medium text-slate-600">
                      {card.label}
                    </span>
                  </div>

                  <div
                    className={`text-2xl font-semibold ${
                      isActive
                        ? a.text
                        : "text-slate-900"
                    }`}
                  >
                    {card.value}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {card.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ==================================================
              SEARCH / FILTER BAR
          ================================================== */}

          <form
            onSubmit={handleSearchSubmit}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Description
              </label>

              <input
                type="text"
                value={filters.description}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Search notes…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Min amount
              </label>

              <input
                type="number"
                min="0"
                value={filters.minAmount}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minAmount: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Max amount
              </label>

              <input
                type="number"
                min="0"
                value={filters.maxAmount}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxAmount: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-500">
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                To
              </label>

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    endDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <IconSearch className="h-4 w-4" />
                Search
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <IconX className="h-4 w-4" />
                Clear
              </button>
            </div>
          </form>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* ==================================================
              TABLE

              overflow-x-auto is preserved so the table
              scrolls horizontally on small screens.
          ================================================== */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">
                      Type
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      Note
                    </th>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-4 py-3">
                      Added by
                    </th>

                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Loading expenses…
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    expenses.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No expenses match your filters yet.
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    expenses.map((exp) => {
                      const isCashIn =
                        exp.type === "Cash In";

                      return (
                        <tr
                          key={exp._id}
                          className={`border-l-4 ${
                            isCashIn
                              ? "border-l-emerald-500"
                              : "border-l-rose-500"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isCashIn
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {exp.type}
                            </span>
                          </td>

                          <td
                            className={`px-4 py-3 font-medium ${
                              isCashIn
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {isCashIn ? "+" : "–"}{" "}
                            {formatCurrency(exp.amount)}
                          </td>

                          <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                            {exp.description || "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {formatDate(
                              exp.expenseDate
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {exp.addedBy?.name || "—"}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() =>
                                handleDelete(exp._id)
                              }
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Delete entry"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ========================================================
            ADD EXPENSE MODAL
        ======================================================== */}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Add Expense
                </h2>

                <button
                  onClick={() => {
                    setModalOpen(false);
                    setForm(EMPTY_FORM);
                    setFormError("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  aria-label="Close"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleAddExpense}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={handleFormChange("amount")}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Type
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {["Cash In", "Cash Out"].map(
                      (type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              type,
                            }))
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            form.type === type
                              ? type === "Cash In"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                : "border-rose-600 bg-rose-50 text-rose-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Note
                  </label>

                  <textarea
                    value={form.note}
                    onChange={handleFormChange("note")}
                    rows={3}
                    placeholder="What's this for? (optional)"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-rose-600">
                    {formError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setForm(EMPTY_FORM);
                      setFormError("");
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                  >
                    {submitting
                      ? "Saving…"
                      : 
                      type === "Cash In"
                        ? "Save Cash In"
                        : "Save Cash Out"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </SidebarLayout>
    </>
  );
}