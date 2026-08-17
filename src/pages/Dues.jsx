import React, { useEffect, useState, useCallback } from 'react';
import SidebarLayout from '../components/SidebarLayout';

const API_BASE = 'https://the-craddle-cafe-backend.vercel.app/api';

function authHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const currency = (n) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const statusOf = (due) => {
  if (due.remaining === 0) return 'paid';
  if (due.paid === 0) return 'unpaid';
  return 'partial';
};

const STATUS_STYLES = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
};

function StatusBadge({ due }) {
  const status = statusOf(due);

  const label =
    status === 'paid'
      ? 'Paid'
      : status === 'unpaid'
        ? 'Unpaid'
        : 'Partial';

  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClasses = {
    total: 'text-slate-900',
    paid: 'text-emerald-600',
    remaining: 'text-rose-600',
    count: 'text-slate-900',
  };

  const isCount = tone === 'count';

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5 min-w-0">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-xl sm:text-2xl font-semibold truncate ${toneClasses[tone]}`}>
        {isCount ? value : currency(value)}
      </p>
    </div>
  );
}

// ---------- Customer picker ----------
// ---------- Add Customer Modal ----------
function AddCustomerModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const newErrors = {};

    const cleanName = name.trim();
    const cleanContact = contact.trim();

    // Name validation
    if (!cleanName) {
      newErrors.name = 'Customer name is required';
    } else if (cleanName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (cleanName.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    } else if (!/^[A-Za-zÀ-ÿ.' -]+$/.test(cleanName)) {
      newErrors.name =
        'Name can only contain letters, spaces, dots, apostrophes and hyphens';
    }

    // Contact validation
    if (!cleanContact) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^03\d{9}$/.test(cleanContact)) {
      newErrors.contact =
        'Enter a valid Pakistani mobile number (03XXXXXXXXX)';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e) => {
    const value = e.target.value;

    // Don't allow more than 50 characters
    if (value.length <= 50) {
      setName(value);

      if (errors.name) {
        setErrors((prev) => ({
          ...prev,
          name: '',
        }));
      }
    }
  };

  const handleContactChange = (e) => {
    // Only digits
    const value = e.target.value.replace(/\D/g, '');

    // Maximum 11 digits
    if (value.length <= 11) {
      setContact(value);

      if (errors.contact) {
        setErrors((prev) => ({
          ...prev,
          contact: '',
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError('');

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Could not add customer'
        );
      }

      const createdCustomer =
        data.customer || data;

      onCreated(createdCustomer);
    } catch (err) {
      setServerError(
        err.message || 'Could not add customer'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Add customer
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Enter the customer's basic information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="px-5 py-5 space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Customer name
              <span className="text-rose-500 ml-1">*</span>
            </label>

            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Ali Khan"
              autoFocus
              disabled={saving}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                errors.name
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-100'
              }`}
            />

            <div className="mt-1 flex justify-between">
              <div>
                {errors.name && (
                  <p className="text-xs text-rose-600">
                    {errors.name}
                  </p>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contact number
              <span className="text-rose-500 ml-1">*</span>
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={contact}
              onChange={handleContactChange}
              placeholder="03XXXXXXXXX"
              disabled={saving}
              maxLength={11}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                errors.contact
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-100'
              }`}
            />

            {errors.contact ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.contact}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Enter 11 digits, e.g. 03001234567
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <p className="text-sm text-rose-700">
                {serverError}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ---------- Customer Picker ----------
function CustomerPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [showAddCustomer, setShowAddCustomer] =
    useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          search: query.trim(),
        });

        const res = await fetch(
          `${API_BASE}/customers?${params.toString()}`,
          {
            headers: authHeaders(),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || 'Could not search customers'
          );
        }

        setResults(
          Array.isArray(data)
            ? data
            : data.customers || []
        );
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Customer already selected
  if (value) {
    return (
      <>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {value.name}
            </p>

            <p className="text-xs text-slate-500 truncate">
              {value.contact}
            </p>
          </div>

          <button
            type="button"
            className="shrink-0 text-xs text-slate-500 hover:text-slate-800 underline"
            onClick={() => onChange(null)}
          >
            Change
          </button>
        </div>

        {showAddCustomer && (
          <AddCustomerModal
            onClose={() =>
              setShowAddCustomer(false)
            }
            onCreated={(customer) => {
              onChange(customer);
              setShowAddCustomer(false);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative min-w-0">
        <input
          type="text"
          placeholder="Search customer by name or contact..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
            {/* Search results */}
            {query.trim() && (
              <div className="max-h-48 overflow-auto">
                {results.length > 0 ? (
                  results.map((customer) => (
                    <button
                      type="button"
                      key={customer._id}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      onClick={() => {
                        onChange(customer);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      <p className="font-medium text-slate-900">
                        {customer.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {customer.contact}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-slate-500">
                    No customer found.
                  </div>
                )}
              </div>
            )}

            {/* Add customer */}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 border-t border-slate-100"
              onClick={() => {
                setShowAddCustomer(true);
                setOpen(false);
              }}
            >
              <span className="text-lg leading-none">
                +
              </span>

              <span>Add new customer</span>
            </button>
          </div>
        )}
      </div>

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() =>
            setShowAddCustomer(false)
          }
          onCreated={(customer) => {
            onChange(customer);
            setShowAddCustomer(false);
            setQuery('');
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

// ---------- Product search relevance ----------
// Ranks a product against the typed query so the best match (by name,
// variant, or SKU) always sorts first, and unrelated products are dropped
// entirely instead of being shown alongside real matches.
function rankProductMatch(product, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
    
  if (!q) return null;

  const name = (product.name || '').toLowerCase();
  const variant = (product.variantName || '').toLowerCase();
  const sku = (product.sku || product.SKU || '').toLowerCase();

  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (sku === q) return 2;
  if (variant === q) return 2;
  if (sku.startsWith(q)) return 3;
  if (variant.startsWith(q)) return 3;
  if (name.includes(q)) return 4;
  if (variant.includes(q) || sku.includes(q)) return 5;

  return null; // no real match — exclude from results
}

function filterAndRankProducts(products, query) {
  return products
    .map((p) => ({ product: p, rank: rankProductMatch(p, query) }))
    .filter((entry) => entry.rank !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return (a.product.name || '').localeCompare(b.product.name || '');
    })
    .map((entry) => entry.product);
}

// ---------- Product line items ----------
function ProductLines({ lines, onChange }) {
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);

  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          search: productQuery.trim(),
        });

        const res = await fetch(
          `${API_BASE}/products?${params.toString()}`,
          {
            headers: authHeaders(),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Could not search products');
        }

        const rawResults = data.products || data || [];

        // Defensive client-side filter/sort: only show products that
        // actually match the typed name/variant/SKU, best match first.
        setProductResults(
          filterAndRankProducts(rawResults, productQuery)
        );
      } catch {
        setProductResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [productQuery]);

  const addLine = (product) => {
    // Price always comes from the product's selling price — never editable
    // by hand, so the line total stays accurate to the catalog.
    const unitPrice = Number(
      product.sellingPrice ?? product.price ?? 0
    );

    onChange([
      ...lines,
      {
        product: product._id,
        name: product.name,
        variant: product.variantName,
        quantity: 1,
        price: unitPrice,
      },
    ]);

    setProductQuery('');
    setProductResults([]);
  };

  const updateQuantity = (index, value) => {
    const next = [...lines];

    const qty = Math.max(1, Number(value) || 1);

    next[index] = {
      ...next[index],
      quantity: qty,
    };

    onChange(next);
  };

  const removeLine = (index) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  const total = lines.reduce(
    (sum, l) => sum + l.quantity * l.price,
    0
  );

  return (
    <div className="min-w-0">
      <div className="relative min-w-0">
        <input
          type="text"
          placeholder="Search product to add..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
        />

        {productQuery.trim() && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-56 overflow-auto">
            {productResults.length > 0 ? (
              productResults.map((p) => {
                const unitPrice = Number(
                  p.sellingPrice ?? p.price ?? 0
                );

                return (
                  <button
                    type="button"
                    key={p._id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    onClick={() => addLine(p)}
                  >
                    <span className="font-medium text-slate-900">
                      {p.name}
                    </span>

                    
                      <span className="text-slate-500">
                        {' '}
                        ({p.variantName})
                      </span>
                   

                    <span className="text-slate-500">
                      {' '}
                      — {currency(unitPrice)}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-sm text-slate-500">
                No matching product found.
              </div>
            )}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <div className="mt-3 border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">
                  Product
                </th>

                <th className="text-right px-3 py-2 w-20">
                  Qty
                </th>

                <th className="text-right px-3 py-2 w-28">
                  Unit price
                </th>

                <th className="text-right px-3 py-2 w-28">
                  Total
                </th>

                <th className="w-8"></th>
              </tr>
            </thead>

            <tbody>
              {lines.map((l, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-100"
                >
                  <td className="px-3 py-2">
                    {l.name}

                    {l.variantName && (
                      <span className="text-slate-500">
                        {' '}
                        ({l.variantName || l.variant   })
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      className="w-16 text-right rounded border border-slate-300 px-1.5 py-1"
                      value={l.quantity}
                      onChange={(e) =>
                        updateQuantity(i, e.target.value)
                      }
                    />
                  </td>

                  <td className="px-3 py-2 text-right text-slate-600">
                    {currency(l.price)}
                  </td>

                  <td className="px-3 py-2 text-right font-medium">
                    {currency(l.quantity * l.price)}
                  </td>

                  <td className="px-1 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end px-3 py-2 bg-slate-50 border-t border-slate-100 text-sm font-semibold">
            Total: {currency(total)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Add due modal ----------
function AddDueModal({ onClose, onCreated }) {
  const [customer, setCustomer] = useState(null);
  const [lines, setLines] = useState([]);
  const [paid, setPaid] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = lines.reduce(
    (sum, l) => sum + l.quantity * l.price,
    0
  );

  const handlePaidChange = (e) => {
    const raw = e.target.value;

    // Allow the field to be freely rewritten, but never let it go negative.
    if (raw === '') {
      setPaid('');
      return;
    }

    const value = Number(raw);

    if (Number.isNaN(value)) {
      return;
    }

    setPaid(String(Math.max(0, value)));
  };

  const handleSubmit = async () => {
    setError('');

    if (!customer) {
      return setError('Select or add a customer first');
    }

    if (!lines.length) {
      return setError('Add at least one product');
    }

    const paidValue = Math.max(0, Number(paid) || 0);

    if (paidValue > total) {
      return setError('Paid amount cannot exceed total');
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/dues`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          customer: customer._id,
          products: lines.map((l) => ({
            product: l.product,
            quantity: l.quantity,
            price: l.price,
          })),
          paid: paidValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Could not create due'
        );
      }

      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create due');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Add due
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Customer
            </label>

            <CustomerPicker
              value={customer}
              onChange={setCustomer}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Products
            </label>

            <ProductLines
              lines={lines}
              onChange={setLines}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Amount paid now
            </label>

            <input
              type="number"
              min="0"
              max={total}
              step="1"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={paid}
              onChange={handlePaidChange}
              onBlur={() => {
                if (paid === '') setPaid('0');
              }}
            />

            <p className="mt-1 text-xs text-slate-500">
              Remaining will be{' '}
              {currency(
                total - Math.max(0, Number(paid) || 0)
              )}
            </p>
          </div>

          {error && (
            <p className="text-sm text-rose-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-slate-900 text-white text-sm font-medium py-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save due'}
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 text-sm px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Record payment modal ----------
function RecordPaymentModal({
  due,
  onClose,
  onUpdated,
}) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    const value = Number(amount);

    if (!value || value <= 0) {
      return setError('Enter a valid amount');
    }

    if (value > due.remaining) {
      return setError(
        'Amount exceeds remaining balance'
      );
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE}/dues/${due._id}/payment`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            amount: value,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Could not record payment'
        );
      }

      onUpdated(data);
      onClose();
    } catch (err) {
      setError(
        err.message || 'Could not record payment'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Record payment
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-slate-600">
            Remaining balance:{' '}
            <span className="font-medium text-slate-900">
              {currency(due.remaining)}
            </span>
          </p>

          <input
            type="number"
            min="0"
            max={due.remaining}
            placeholder="Amount"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {error && (
            <p className="text-sm text-rose-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-slate-900 text-white text-sm font-medium py-2 disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : 'Confirm payment'}
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 text-sm px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Due detail modal ----------
function DueDetailModal({
  dueId,
  onClose,
  onUpdated,
}) {
  const [due, setDue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDue = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(
          `${API_BASE}/dues/${dueId}`,
          {
            headers: authHeaders(),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || 'Could not load due'
          );
        }

        if (active) {
          setDue(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Could not load due'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDue();

    return () => {
      active = false;
    };
  }, [dueId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Due detail
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Loading...
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-rose-600">
            {error}
          </div>
        ) : !due ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Due not found.
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {due.customer?.name}
                  </p>

                  <p className="text-xs text-slate-500 truncate">
                    {due.customer?.contact}
                  </p>
                </div>

                <StatusBadge due={due} />
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">
                        Product
                      </th>

                      <th className="text-right px-3 py-2">
                        Qty
                      </th>

                      <th className="text-right px-3 py-2">
                        Price
                      </th>

                      <th className="text-right px-3 py-2">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {due.products?.map((p, i) => (
                      <tr
                        key={i}
                        className="border-t border-slate-100"
                      >
                        <td className="px-3 py-2">
                          {p.product?.name ||
                            'Product removed'}

                          {p.product?.variantName && (
                            <span className="text-slate-500">
                              {' '}
                              ({p.product.variantName})
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2 text-right">
                          {p.quantity}
                        </td>

                        <td className="px-3 py-2 text-right">
                          {currency(p.price)}
                        </td>

                        <td className="px-3 py-2 text-right font-medium">
                          {currency(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2 min-w-0">
                  <p className="text-xs text-slate-500">
                    Total
                  </p>

                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {currency(due.totalAmount)}
                  </p>
                </div>

                <div className="rounded-lg bg-emerald-50 px-3 py-2 min-w-0">
                  <p className="text-xs text-emerald-700">
                    Paid
                  </p>

                  <p className="text-sm font-semibold text-emerald-700 truncate">
                    {currency(due.paid)}
                  </p>
                </div>

                <div className="rounded-lg bg-rose-50 px-3 py-2 min-w-0">
                  <p className="text-xs text-rose-700">
                    Remaining
                  </p>

                  <p className="text-sm font-semibold text-rose-700 truncate">
                    {currency(due.remaining)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowPayment(true)}
                disabled={due.remaining === 0}
                className="flex-1 rounded-lg bg-slate-900 text-white text-sm font-medium py-2 disabled:opacity-50"
              >
                Record payment
              </button>

              <button
                onClick={onClose}
                className="rounded-lg border border-slate-300 text-sm px-4 py-2"
              >
                Close
              </button>
            </div>
          </>
        )}

        {showPayment && due && (
          <RecordPaymentModal
            due={due}
            onClose={() => setShowPayment(false)}
            onUpdated={(updated) => {
              setDue(updated);
              onUpdated(updated);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Main page ----------
function Dues() {
  const [dues, setDues] = useState([]);

  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedDueId, setSelectedDueId] =
    useState(null);

  const [showAddDue, setShowAddDue] =
    useState(false);

  const fetchDues = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      if (status !== 'all') {
        params.append('status', status);
      }

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${API_BASE}/dues?${queryString}`
        : `${API_BASE}/dues`;

      const res = await fetch(url, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Could not load dues'
        );
      }

      setDues(data.dues || []);

      setSummary(
        data.summary || {
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
        }
      );
    } catch (err) {
      setError(
        err.message || 'Could not load dues'
      );

      setDues([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, startDate, endDate]);

  useEffect(() => {
    const timeout = setTimeout(
      fetchDues,
      300
    );

    return () => clearTimeout(timeout);
  }, [fetchDues]);

  return (
    <SidebarLayout activeKey="dues">
      <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">
            Dues
          </h1>

          <button
            onClick={() => setShowAddDue(true)}
            className="shrink-0 rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
          >
            + Add due
          </button>
        </div>

        {/* Summary: 2 cards per row on mobile, 4 in a row on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            label="Total dues"
            value={summary.totalAmount}
            tone="total"
          />

          <SummaryCard
            label="Total paid"
            value={summary.totalPaid}
            tone="paid"
          />

          <SummaryCard
            label="Total remaining"
            value={summary.totalRemaining}
            tone="remaining"
          />

          <SummaryCard
            label="Total records"
            value={dues.length}
            tone="count"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Search customer
            </label>

            <input
              type="text"
              placeholder="Name or contact..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Status
            </label>

            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              From
            </label>

            <input
              type="date"
              className="w-full max-w-[150px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              To
            </label>

            <input
              type="date"
              className="w-full max-w-[150px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />
          </div>

          {(search ||
            status !== 'all' ||
            startDate ||
            endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setStatus('all');
                setStartDate('');
                setEndDate('');
              }}
              className="shrink-0 text-sm text-slate-500 hover:text-slate-800 underline pb-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table — the only part of the page allowed to scroll horizontally */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">
                  Customer
                </th>

                <th className="text-left px-4 py-3">
                  Contact
                </th>

                <th className="text-left px-4 py-3">
                  Date
                </th>

                <th className="text-right px-4 py-3">
                  Total
                </th>

                <th className="text-right px-4 py-3">
                  Paid
                </th>

                <th className="text-right px-4 py-3">
                  Remaining
                </th>

                <th className="text-left px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-rose-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No dues found.
                  </td>
                </tr>
              ) : (
                dues.map((due) => (
                  <tr
                    key={due._id}
                    onClick={() =>
                      setSelectedDueId(due._id)
                    }
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {due.customer?.name || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {due.customer?.contact || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {due.createdAt
                        ? new Date(
                            due.createdAt
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {currency(due.totalAmount)}
                    </td>

                    <td className="px-4 py-3 text-right text-emerald-600">
                      {currency(due.paid)}
                    </td>

                    <td className="px-4 py-3 text-right text-rose-600">
                      {currency(due.remaining)}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge due={due} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedDueId && (
          <DueDetailModal
            dueId={selectedDueId}
            onClose={() =>
              setSelectedDueId(null)
            }
            onUpdated={fetchDues}
          />
        )}

        {showAddDue && (
          <AddDueModal
            onClose={() => setShowAddDue(false)}
            onCreated={fetchDues}
          />
        )}
      </div>
    </SidebarLayout>
  );
}

export default Dues;