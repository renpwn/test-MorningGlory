import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
});

/**
 * Fallback mock data if backend returns 404 or USE_MOCK=true
 * This keeps the dashboard usable even jika backend belum selesai
 */
const mock = {
  products: [
    { id: "P001", name: "Tinta Printer", price: 50.0, stock: 100, category: "Office", min_stock: 10 },
    { id: "P002", name: "Kertas A4", price: 3.0, stock: 500, category: "Office", min_stock: 50 },
    { id: "P003", name: "Mouse Wireless", price: 120.0, stock: 20, category: "Electronics", min_stock: 5 },
    { id: "P004", name: "Keyboard", price: 150.0, stock: 30, category: "Electronics", min_stock: 5 }
  ],
  transactions: [
    // sample sale transactions across months and categories
    { id: "T001", product_id: "P001", quantity: 10, type: "sale", price_at_time: 50.0, timestamp: "2025-01-05T10:00:00Z" },
    { id: "T002", product_id: "P002", quantity: 100, type: "sale", price_at_time: 3.0, timestamp: "2025-01-14T09:00:00Z" },
    { id: "T003", product_id: "P003", quantity: 5, type: "sale", price_at_time: 120.0, timestamp: "2025-02-12T12:00:00Z" },
    { id: "T004", product_id: "P001", quantity: 20, type: "sale", price_at_time: 50.0, timestamp: "2025-03-20T15:00:00Z" },
    { id: "T005", product_id: "P004", quantity: 8, type: "sale", price_at_time: 150.0, timestamp: "2025-03-21T11:30:00Z" },
    { id: "T006", product_id: "P002", quantity: 50, type: "sale", price_at_time: 3.0, timestamp: "2025-04-03T08:00:00Z" },
    { id: "T007", product_id: "P003", quantity: 7, type: "sale", price_at_time: 120.0, timestamp: "2025-05-10T13:00:00Z" },
    { id: "T008", product_id: "P001", quantity: 30, type: "sale", price_at_time: 50.0, timestamp: "2025-11-01T09:00:00Z" }
  ]
};

async function safeGet(path) {
  if (USE_MOCK) {
    // simulate endpoints used by frontend
    if (path.startsWith("/products/") && path.endsWith("/history")) {
      const id = path.split("/")[2];
      return { data: { productId: id, history: mock.transactions.filter(t => t.product_id === id) } };
    }
    if (path === "/products?limit=9999" || path === "/products?limit=9999&") {
      return { data: { data: mock.products } };
    }
    if (path === "/reports/inventory") {
      const val = mock.products.reduce((s,p) => s + (p.stock * p.price), 0);
      return { data: { inventoryValue: val } };
    }
    if (path === "/reports/low-stock") {
      return { data: { lowStock: mock.products.filter(p => p.stock <= p.min_stock) } };
    }
  }

  try {
    const r = await API.get(path);
    return r;
  } catch (err) {
    // if 404 or network error, try mock fallback
    if (err.response && err.response.status === 404) {
      // fallback to mock
      return safeGet(path.replace(/^\/+/, ""));
    }
    // for other errors, rethrow
    throw err;
  }
}

export async function getProducts() {
  return safeGet("/products?limit=9999");
}

export async function getProductHistory(productId) {
  return safeGet(`/products/${productId}/history`);
}

export async function getInventoryValue() {
  return safeGet("/reports/inventory");
}

export async function getLowStock() {
  return safeGet("/reports/low-stock");
}
