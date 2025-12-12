import React from "react";

export default function DateFilter({ start, end, onChange }) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: 20 }}>
      <div>
        <label>Dari:</label><br />
        <input
          type="date"
          value={start}
          onChange={(e) => onChange("start", e.target.value)}
        />
      </div>

      <div>
        <label>Sampai:</label><br />
        <input
          type="date"
          value={end}
          onChange={(e) => onChange("end", e.target.value)}
        />
      </div>
    </div>
  );
}
