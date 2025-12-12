import React from "react";
import { Bar } from "react-chartjs-2";

export default function TopProductsChart({ data }) {
  const labels = data.map(item => item.name);
  const values = data.map(item => item.totalValue);

  return (
    <div style={{ marginBottom: 40 }}>
      <h3>Top 10 Produk Terlaris</h3>
      <Bar 
        data={{
          labels,
          datasets: [{
            label: "Nilai Penjualan",
            data: values
          }]
        }}
      />
    </div>
  );
}
