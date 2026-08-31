// Points at the same backend as the Expense page.
const API_BASE = "https://the-craddle-cafe-backend.vercel.app/api/expenses";

function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const expensesApi = {
  /**
   * Logs an expense entry.
   * type: "Cash In" | "Cash Out" | "Reinvestment"
   * paymentMethod: "Cash" | "Online"
   *
   * The Expense schema requires `title`, so callers must always pass one —
   * this deliberately does not fall back to a default, so a missing title
   * fails loudly instead of silently creating a blank-titled entry.
   */
  async create({ title, amount, type, paymentMethod, description = "" }) {
    if (!title) {
      throw new Error("Expense title is required.");
    }

    const res = await fetch(`${API_BASE}/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        title,
        amount,
        type,
        paymentMethod,
        description,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to log expense");
    }

    return data;
  },
};