# Inventory Manager API (Node.js no framework)

## Ringkasan
Implementasi backend Inventory Manager sesuai soal — menggunakan Node.js built-in `http` module dan SQLite (via `better-sqlite3`). Fitur:
- ES6 class `InventoryManager`
- Produk, transaksi, customers, suppliers, discounts
- Validasi input & mencegah stok negatif
- Pagination pada GET /products
- EventEmitter untuk notifikasi low-stock
- Custom `AppError` class
- Logging transaksi ke table `transaction_logs`

## Persiapan
1. Pastikan Node.js >= 14 terpasang.
2. Install dependencies:
```bash
npm install
