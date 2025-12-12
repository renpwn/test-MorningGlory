import React from "react";
import { Doughnut } from "react-chartjs-2";

export default function SalesPerCategoryChart({ data }) {
  return (
    <div style={{ width: 400, marginBottom: 40 }}>
      <h3>Penjualan per Kategori</h3>
      <Doughnut 
        data={{
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data)
          }]
        }}
      />
    </div>
  );
}
