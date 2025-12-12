import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

export default function SalesPerMonthChart({ data }) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  return (
    <div style={{ marginBottom: 40 }}>
      <h3>Penjualan per Bulan</h3>
      <Bar 
        data={{
          labels,
          datasets: [{
            label: "Total Penjualan",
            data: values
          }]
        }}
      />
    </div>
  );
}
