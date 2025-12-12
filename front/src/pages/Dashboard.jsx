import React, { useEffect, useState } from "react";
import { getProducts } from "../api/inventoryApi";

import DateFilter from "../components/DateFilter";
import SalesPerMonthChart from "../components/SalesPerMonthChart";
import SalesPerCategoryChart from "../components/SalesPerCategoryChart";
import TopProductsChart from "../components/TopProductsChart";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [start, setStart] = useState("2025-01-01");
  const [end, setEnd] = useState("2025-12-31");

  // Load product + transaction history
  useEffect(() => {
    async function load() {
      const p = await getProducts();
      const list = p.data.data || [];
      setProducts(list);

      let trx = [];
      for (let product of list) {
        const r = await fetch(`http://localhost:3000/products/${product.id}/history`);
        const json = await r.json();

        // JSON backend: { productId, history: [...] }
        if (json.history) {
          trx.push(...json.history.map(t => ({
            id: t.id,
            productId: t.product_id,
            quantity: t.quantity,
            type: t.type,
            customer_id: t.customer_id,
            price_at_time: t.price_at_time,
            timestamp: t.timestamp
          })));
        }
      }

      setTransactions(trx);
    }

    load();
  }, []);

  // Filter transaksi berdasarkan tanggal
  const filtered = transactions.filter((t) => {
    const ts = new Date(t.timestamp);
    return ts >= new Date(start) && ts <= new Date(end);
  });

  // -------------------------------------------------------------------------
  // 1. SALES PER MONTH
  // -------------------------------------------------------------------------
  const salesPerMonth = {};

  filtered.forEach((t) => {
    if (t.type !== "sale") return;

    const date = new Date(t.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    salesPerMonth[key] = (salesPerMonth[key] || 0) + t.quantity * t.price_at_time;
  });

  // -------------------------------------------------------------------------
  // 2. SALES PER CATEGORY
  // -------------------------------------------------------------------------
  const salesPerCategory = {};

  filtered.forEach((t) => {
    if (t.type !== "sale") return;

    const product = products.find((p) => p.id === t.productId);
    if (!product) return;

    const category = product.category || "Others";

    salesPerCategory[category] =
      (salesPerCategory[category] || 0) + t.quantity * t.price_at_time;
  });

  // -------------------------------------------------------------------------
  // 3. TOP 10 BEST SELLING PRODUCTS
  // -------------------------------------------------------------------------
  const productSales = {};

  filtered.forEach((t) => {
    if (t.type !== "sale") return;

    productSales[t.productId] =
      (productSales[t.productId] || 0) + t.quantity * t.price_at_time;
  });

  const top10 = Object.entries(productSales)
    .map(([id, value]) => ({
      id,
      name: products.find((p) => p.id === id)?.name || id,
      totalValue: value,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return (
    <div style={{ padding: 30 }}>
      <h1>Dashboard Inventory</h1>

      <DateFilter start={start} end={end} onChange={(t, v) => {
        if (t === "start") setStart(v);
        if (t === "end") setEnd(v);
      }} />

      <SalesPerMonthChart data={salesPerMonth} />
      <SalesPerCategoryChart data={salesPerCategory} />
      <TopProductsChart data={top10} />
    </div>
  );
}
