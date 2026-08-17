const BASE_URL = import.meta.env?.VITE_API_URL || "https://the-craddle-cafe-backend.vercel.app/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const inventoryApi = {
  // Products
  listProducts: () =>
    fetch(`${BASE_URL}/products`, { headers: authHeaders() }).then(handle),

  createProduct: (payload) =>
    fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  updateProduct: (id, payload) =>
    fetch(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  deleteProduct: (id) =>
    fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),

  // Categories
  listCategories: () =>
    fetch(`${BASE_URL}/categories`, { headers: authHeaders() }).then(handle),

  // Stock
  stockIn: (payload) =>
    fetch(`${BASE_URL}/stock/in`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  stockOut: (payload) =>
    fetch(`${BASE_URL}/stock/out`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  stockHistory: (productId, filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    );
    const qs = params.toString();
    return fetch(`${BASE_URL}/stock/history/${productId}${qs ? `?${qs}` : ""}`, {
      headers: authHeaders(),
    }).then(handle);
  },
  // Dashboard
  dashboard: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    );
    const qs = params.toString();
    return fetch(`${BASE_URL}/dashboard${qs ? `?${qs}` : ""}`, {
      headers: authHeaders(),
    }).then(handle);
  },
};