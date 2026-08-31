import React, { useState, useEffect, useCallback, useMemo } from "react";
import SidebarLayout from "../components/SidebarLayout"; // adjust path to match your project structure
import {
  Search,
  X,
  Plus,
  Check,
  AlertCircle,
  Package,
  Inbox,
} from "lucide-react";

/**
 * Returns Ledger — product return history + a "Return Product" flow.
 *
 * Backend contract assumed (adjust paths to match your app):
 *   GET  /api/products?search=<q>   -> [{ _id, name, variantName, sku,
 *                                          unitStock, petStock, unitPrice,
 *                                          petPrice, itemsPerPet }]
 *   GET  /api/returns/returns       -> { returns: [ProductReturn...] }
 *   POST /api/returns/return        -> { returnEntry, ... }
 *        body: { productId, quantity, returnType, purchasePrice,
 *                 returnAmount, reason, note }
 *
 * Auth is assumed to ride on an httpOnly cookie (credentials: 'include').
 * If your app uses a bearer token instead, add an Authorization header
 * in `apiFetch` below.
 */

const RETURNS_API = "https://the-craddle-cafe-backend.vercel.app/api/returns";
const PRODUCTS_API = "https://the-craddle-cafe-backend.vercel.app/api/products";

const REASONS = ["Damaged", "Expired", "Wrong item", "Quality issue", "Overstock", "Other"];

const money = (n) => {
  const num = Number(n) || 0;
  return `Rs ${num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

/* -------------------------------- theme --------------------------------
   Matches the app's existing palette (see SidebarLayout):
   ink #1C2B33, muted #5C6B73, teal accent #2F6F63, cream #F7F5F0,
   border #E4E0D6, danger #B23A34
-------------------------------------------------------------------------- */

export default function ReturnProduct() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await apiFetch(`${RETURNS_API}`);
      setHistory(Array.isArray(data.returns) ? data.returns : []);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const totals = history.reduce(
    (acc, r) => {
      const cost = (Number(r.purchasePrice) || 0) * (Number(r.quantity) || 0);
      const net = (Number(r.returnAmount) || 0) - cost;
      acc.count += 1;
      acc.refunded += Number(r.returnAmount) || 0;
      acc.net += net;
      return acc;
    },
    { count: 0, refunded: 0, net: 0 }
  );

  return (
    <SidebarLayout activeKey="stock">
      <div style={{ fontFamily: "Inter, sans-serif" }}>
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5C6B73]">
              Inventory
            </p>
            <h1
              className="mt-1 text-2xl font-semibold text-[#1C2B33]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Product Returns
            </h1>
            <p className="mt-1 text-sm text-[#5C6B73]">
              Track stock sent back to suppliers and the refunds received for each.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-md bg-[#2F6F63] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#26594F] focus:outline-none focus:ring-2 focus:ring-[#2F6F63]/40"
          >
            <Plus className="h-4 w-4" />
            Return product
          </button>
        </div>

        {/* stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Total returns" value={loadingHistory ? "—" : String(totals.count)} />
          <Stat label="Refunded to date" value={loadingHistory ? "—" : money(totals.refunded)} />
          <Stat
            label="Net position"
            value={loadingHistory ? "—" : money(totals.net)}
            tone={totals.net > 0 ? "good" : totals.net < 0 ? "bad" : "neutral"}
          />
        </div>

        {/* history table */}
        <div className="mt-6 overflow-hidden rounded-lg border border-[#E4E0D6]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E4E0D6] bg-[#F7F5F0] text-left text-xs font-semibold uppercase tracking-wide text-[#5C6B73]">
                  <Th>Date</Th>
                  <Th>Product</Th>
                  <Th>Type</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Cost basis</Th>
                  <Th align="right">Returned</Th>
                  <Th align="right">Net</Th>
                  <Th>Reason</Th>
                  <Th>Returned by</Th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#5C6B73]">
                      Loading returns…
                    </td>
                  </tr>
                )}

                {!loadingHistory && historyError && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10">
                      <div className="flex flex-col items-center gap-2 text-center text-sm text-[#5C6B73]">
                        <AlertCircle className="h-5 w-5 text-[#B23A34]" />
                        <span>Couldn't load the return history. {historyError}</span>
                        <button
                          onClick={loadHistory}
                          className="mt-1 text-xs font-medium text-[#2F6F63] underline underline-offset-2"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingHistory && !historyError && history.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-14">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Inbox className="h-6 w-6 text-[#B7AF9E]" />
                        <p className="text-sm text-[#5C6B73]">No returns recorded yet.</p>
                        <button
                          onClick={() => setDialogOpen(true)}
                          className="mt-1 text-xs font-medium text-[#2F6F63] underline underline-offset-2"
                        >
                          Log your first return
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingHistory &&
                  !historyError &&
                  history.map((r) => {
                    const cost = (Number(r.purchasePrice) || 0) * (Number(r.quantity) || 0);
                    const net = (Number(r.returnAmount) || 0) - cost;
                    return (
                      <tr key={r._id} className="border-b border-[#E4E0D6] last:border-0 hover:bg-[#F7F5F0]/60">
                        <Td className="text-[#5C6B73]">{fmtDate(r.returnDate || r.createdAt)}</Td>
                        <Td>
                          <div className="font-medium text-[#1C2B33]">
                            {r.product?.name || "Deleted product"}
                          </div>
                          {r.product?.variantName && (
                            <div className="text-xs text-[#5C6B73]">{r.product.variantName}</div>
                          )}
                        </Td>
                        <Td>
                          <span className="inline-block rounded border border-[#E4E0D6] bg-[#F7F5F0] px-1.5 py-0.5 text-[11px] font-medium capitalize text-[#5C6B73]">
                            {r.returnType}
                          </span>
                        </Td>
                        <Td align="right">{r.quantity}</Td>
                        <Td align="right" className="text-[#5C6B73]">
                          {money(cost)}
                        </Td>
                        <Td align="right">{money(r.returnAmount)}</Td>
                        <Td
                          align="right"
                          className={`font-semibold ${net >= 0 ? "text-[#2F6F63]" : "text-[#B23A34]"}`}
                        >
                          {net >= 0 ? "+" : ""}
                          {money(net)}
                        </Td>
                        <Td>{r.reason}</Td>
                        <Td className="text-[#5C6B73]">
                          {r.returnedBy?.name || r.returnedBy?.username || "—"}
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {dialogOpen && (
        <ReturnDialog
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            loadHistory();
          }}
        />
      )}
    </SidebarLayout>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const toneColor = tone === "good" ? "text-[#2F6F63]" : tone === "bad" ? "text-[#B23A34]" : "text-[#1C2B33]";
  return (
    <div className="rounded-lg border border-[#E4E0D6] bg-[#F7F5F0] px-4 py-3.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#5C6B73]">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneColor}`} style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return <th className={`px-4 py-3 font-semibold ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, align = "left", className = "" }) {
  return (
    <td className={`px-4 py-3 text-[#1C2B33] ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      {children}
    </td>
  );
}

/* ----------------------------- return dialog ---------------------------- */

function ReturnDialog({ onClose, onSaved }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [returnType, setReturnType] = useState("unit");
  const [quantity, setQuantity] = useState("");
  const [receivedFull, setReceivedFull] = useState(null); // true | false | null
  const [actualAmount, setActualAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // All products are loaded once when the dialog opens, then filtered
  // client-side as the person types — no per-keystroke request.
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const data = await apiFetch(PRODUCTS_API);
        if (!cancelled) setAllProducts(Array.isArray(data) ? data : data.products || []);
      } catch (err) {
        if (!cancelled) setProductsError(err.message);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || selectedProduct) return [];
    return allProducts
      .filter((p) => {
        const haystack = `${p.name || ""} ${p.variantName || ""} ${p.sku || ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 50);
  }, [searchTerm, selectedProduct, allProducts]);

  const priceForType = selectedProduct
    ? returnType === "unit"
      ? selectedProduct.unitPrice
      : selectedProduct.petPrice
    : 0;
  const availableStock = selectedProduct
    ? returnType === "unit"
      ? selectedProduct.unitStock
      : selectedProduct.petStock
    : 0;
  const qtyNum = Number(quantity) || 0;
  const expectedAmount = priceForType * qtyNum;
  const finalReason = reason === "Other" ? reasonOther.trim() : reason;

  const canSubmit =
    selectedProduct &&
    qtyNum > 0 &&
    qtyNum <= availableStock &&
    receivedFull !== null &&
    (receivedFull || (actualAmount !== "" && Number(actualAmount) >= 0)) &&
    finalReason.length > 0;

  const handlePickProduct = (p) => {
    setSelectedProduct(p);
    
    setSearchTerm(`${p.name}${p.variantName ? ` — ${p.variantName}` : ""}`);
  };

  const handleClearProduct = () => {
    setSelectedProduct(null);
    setSearchTerm("");
    setQuantity("");
    setReceivedFull(null);
    setActualAmount("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch(`${RETURNS_API}`, {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: qtyNum,
          returnType,
          purchasePrice: priceForType,
          returnAmount: receivedFull ? expectedAmount : Number(actualAmount),
          reason: finalReason,
          note: note.trim(),
        }),
      });
      onSaved();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B33]/50 px-4 py-8"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Return product"
        className="relative flex h-[85vh] max-h-[720px] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#E4E0D6] bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E4E0D6] px-8 py-4">
          <h2
            className="text-base font-semibold text-[#1C2B33]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Return a product
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[#5C6B73] transition-colors hover:bg-[#F7F5F0] hover:text-[#1C2B33]"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6">
          {/* product search */}
          <Field label="Product">
            {!selectedProduct ? (
              <div className="relative">
                <div className="flex items-center gap-2 rounded-md border border-[#E4E0D6] bg-white px-3 py-2 focus-within:border-[#2F6F63]">
                  <Search className="h-4 w-4 shrink-0 text-[#5C6B73]" />
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, variant, or SKU…"
                    className="w-full bg-transparent text-sm text-[#1C2B33] outline-none placeholder:text-[#B7AF9E]"
                  />
                </div>

                {searchTerm.trim() && (
                  <div className="absolute z-10 mt-1 max-h-[26rem] w-full overflow-y-auto rounded-md border border-[#E4E0D6] bg-white shadow-xl">
                    {loadingProducts && (
                      <div className="px-3 py-3 text-sm text-[#5C6B73]">Loading products…</div>
                    )}
                    {!loadingProducts && productsError && (
                      <div className="px-3 py-3 text-sm text-[#B23A34]">{productsError}</div>
                    )}
                    {!loadingProducts && !productsError && searchResults.length === 0 && (
                      <div className="px-3 py-3 text-sm text-[#5C6B73]">No products match "{searchTerm}"</div>
                    )}
                    {!loadingProducts &&
                      !productsError &&
                      searchResults.map((p) => (
                        <button
                          type="button"
                          key={p._id}
                          onClick={() => handlePickProduct(p)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#F7F5F0]"
                        >
                          <span>
                            <span className="font-medium text-[#1C2B33]">{p.name}</span>
                            {p.variantName && <span className="text-[#5C6B73]"> — {p.variantName}</span>}
                          </span>
                          <span className="shrink-0 text-xs text-[#5C6B73]">{p.unitStock} units</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 rounded-md border border-[#E4E0D6] bg-[#F7F5F0] px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F63]" />
                  <div>
                    <div className="text-sm font-medium text-[#1C2B33]">
                      {selectedProduct.name}
                      {selectedProduct.variantName && (
                        <span className="text-[#5C6B73]"> — {selectedProduct.variantName}</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-[#5C6B73]">
                      In stock: {selectedProduct.unitStock} units · {selectedProduct.petStock} pets
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearProduct}
                  className="shrink-0 text-xs font-medium text-[#5C6B73] underline underline-offset-2 hover:text-[#1C2B33]"
                >
                  Change
                </button>
              </div>
            )}
          </Field>

          {selectedProduct && (
            <>
              {/* return type + quantity */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label="Return as">
                  <div className="grid grid-cols-2 gap-1 rounded-md border border-[#E4E0D6] bg-[#F7F5F0] p-1">
                    {["unit", "pet"].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setReturnType(t)}
                        className={`rounded px-2 py-1.5 text-xs font-semibold capitalize transition-colors ${
                          returnType === t ? "bg-[#2F6F63] text-white" : "text-[#5C6B73] hover:text-[#1C2B33]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={`Quantity (${returnType}s)`}>
                  <input
                    type="number"
                    min="0"
                    step={returnType === "unit" ? "1" : "0.01"}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setReceivedFull(null);
                    }}
                    placeholder="0"
                    className="w-full rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
                  />
                </Field>
              </div>
              {qtyNum > availableStock && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#B23A34]">
                  <AlertCircle className="h-3.5 w-3.5" /> Only {availableStock} {returnType}s available
                </p>
              )}

              {/* expected amount + confirmation */}
              {qtyNum > 0 && qtyNum <= availableStock && (
                <div className="mt-5 rounded-md border border-[#E4E0D6] bg-[#F7F5F0] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5C6B73]">You should get back</span>
                    <span className="text-lg font-semibold text-[#2F6F63]">{money(expectedAmount)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5C6B73]">
                    {qtyNum} {returnType}(s) × {money(priceForType)} purchase price
                  </p>

                  <div className="mt-3.5 border-t border-[#E4E0D6] pt-3.5">
                    <p className="mb-2 text-sm font-medium text-[#1C2B33]">
                      Have you actually received this amount?
                    </p>
                    <div className="flex gap-2">
                      <ChoiceButton
                        active={receivedFull === true}
                        tone="good"
                        onClick={() => {
                          setReceivedFull(true);
                          setActualAmount("");
                        }}
                      >
                        Yes, received in full
                      </ChoiceButton>
                      <ChoiceButton active={receivedFull === false} tone="bad" onClick={() => setReceivedFull(false)}>
                        No, different amount
                      </ChoiceButton>
                    </div>

                    {receivedFull === false && (
                      <div className="mt-3">
                        <Field label="Amount actually received">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={actualAmount}
                            onChange={(e) => setActualAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
                          />
                        </Field>
                        {actualAmount !== "" && (
                          <p
                            className={`mt-1.5 text-xs ${
                              Number(actualAmount) - expectedAmount >= 0 ? "text-[#2F6F63]" : "text-[#B23A34]"
                            }`}
                          >
                            {Number(actualAmount) - expectedAmount >= 0 ? "+" : ""}
                            {money(Number(actualAmount) - expectedAmount)} vs. expected
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* reason + note */}
              <div className="mt-4">
                <Field label="Reason for return">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
                  >
                    <option value="" disabled>
                      Select a reason…
                    </option>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
                {reason === "Other" && (
                  <input
                    value={reasonOther}
                    onChange={(e) => setReasonOther(e.target.value)}
                    placeholder="Describe the reason"
                    className="mt-2 w-full rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
                  />
                )}
              </div>

              <div className="mt-4">
                <Field label="Note (optional)">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Any extra detail worth keeping on record"
                    className="w-full resize-none rounded-md border border-[#E4E0D6] bg-white px-3 py-2 text-sm text-[#1C2B33] outline-none focus:border-[#2F6F63]"
                  />
                </Field>
              </div>
            </>
          )}

          {formError && (
            <p className="mt-4 flex items-center gap-1.5 rounded-md border border-[#B23A34]/30 bg-[#B23A34]/5 px-3 py-2 text-xs text-[#B23A34]">
              <AlertCircle className="h-3.5 w-3.5" /> {formError}
            </p>
          )}
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#E4E0D6] bg-[#F7F5F0] px-8 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-[#5C6B73] transition-colors hover:text-[#1C2B33]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-[#2F6F63] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#26594F] disabled:cursor-not-allowed disabled:bg-[#E4E0D6] disabled:text-[#B7AF9E]"
          >
            <Check className="h-4 w-4" />
            {submitting ? "Saving…" : "Save return"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5C6B73]">{label}</span>
      {children}
    </label>
  );
}

function ChoiceButton({ active, tone, onClick, children }) {
  const activeClasses =
    tone === "good"
      ? "border-[#2F6F63] text-[#2F6F63] bg-[#2F6F63]/10"
      : "border-[#B23A34] text-[#B23A34] bg-[#B23A34]/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
        active ? activeClasses : "border-[#E4E0D6] bg-white text-[#5C6B73] hover:border-[#B7AF9E] hover:text-[#1C2B33]"
      }`}
    >
      {children}
    </button>
  );
}