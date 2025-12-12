# Inventory Manager API (Node.js no framework)

## Ringkasan

Implementasi backend Inventory Manager sesuai soal — menggunakan Node.js built-in `http` module dan SQLite (via `better-sqlite3`). Fitur:

* ES6 class `InventoryManager`
* Produk, transaksi, customers, suppliers, discounts
* Validasi input & mencegah stok negatif
* Pagination pada GET /products
* EventEmitter untuk notifikasi low-stock
* Custom `AppError` class
* Logging transaksi ke table `transaction_logs`

---

## Persiapan

1. Pastikan Node.js >= 14 terpasang.
2. Install dependencies:

```bash
npm install
```

---

## 📄 Contoh Soal

* [📄 Test Programmer Fullstack (PDF)](./Test%20Programmer%20Fullstack.pdf)

> Pastikan file PDF berada di root folder, atau sesuaikan path link jika berbeda.

---

## 🔧 Menjalankan Server

Jalankan server dengan:

```bash
node server.js
```

Server akan berjalan di `http://localhost:3000`.

---

## Struktur Proyek

```
test-MorningGlory-main/
│
├── InventoryManager.js              # Class utama untuk operasi inventory
├── server.js                        # HTTP server (tanpa framework)
├── init_db.js                       # Script inisialisasi database SQLite
├── init_db.sql                      # SQL raw untuk generate tabel
├── inventory.db                     # Database SQLite
├── package.json                     # Dependensi server/backend
├── package-lock.json
├── README.md                        # Dokumentasi proyek
├── .gitattributes
│
├── Test Programmer Fullstack.pdf    # Soal yang diberikan (PDF)
│
└── front/                           # Frontend sederhana (React + Vite)
    ├── index.html                   # Entry HTML
    ├── package.json
    ├── package-lock.json
    ├── src/
    │   ├── main.jsx                 # Entry JS
    │   ├── App.jsx                  # Root component
    │   ├── styles.css               # Styling
    │   │
    │   ├── api/
    │   │   └── inventoryApi.js      # API calls ke backend
    │   │
    │   ├── components/              # Komponen UI
    │   │   ├── DateFilter.jsx
    │   │   ├── SalesPerCategoryChart.jsx
    │   │   ├── SalesPerMonthChart.jsx
    │   │   └── TopProductsChart.jsx
    │   │
    │   └── pages/
    │       └── Dashboard.jsx        # Halaman dashboard
    │
    └── src/assets (jika ditambahkan nanti)

```

---

## ⚙️ Fitur API

* **GET /products** – list produk dengan pagination
* **POST /products** – tambah produk baru
* **PUT /products/:id** – update produk
* **DELETE /products/:id** – hapus produk
* **POST /transactions** – buat transaksi baru
* **GET /transactions** – list transaksi
* Notifikasi low-stock via EventEmitter

---

## 🔧 Pengembangan Lebih Lanjut

* Integrasi autentikasi (JWT / OAuth)
* Integrasi API eksternal (misal supplier/ongkir)
* Optimasi query SQLite untuk data besar
* Unit test menggunakan Jest atau Mocha
