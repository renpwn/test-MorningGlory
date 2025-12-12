// InventoryManager.js
import EventEmitter from 'events';
import Database from 'better-sqlite3';

export class AppError extends Error {
  constructor(message, code = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export default class InventoryManager extends EventEmitter {
  constructor(dbPath = './inventory.db') {
    super();
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    // prepared statements
    this.stmts = {
      addProduct: this.db.prepare('INSERT INTO products (id,name,price,stock,category,min_stock) VALUES (@id,@name,@price,@stock,@category,@min_stock)'),
      getProduct: this.db.prepare('SELECT * FROM products WHERE id = ?'),
      updateProduct: this.db.prepare('UPDATE products SET name=@name, price=@price, stock=@stock, category=@category, min_stock=@min_stock WHERE id=@id'),
      updateStock: this.db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?'),
      createTransaction: this.db.prepare(`INSERT INTO transactions (id,product_id,quantity,type,customer_id,supplier_id,price_at_time,discount,timestamp) VALUES (@id,@product_id,@quantity,@type,@customer_id,@supplier_id,@price_at_time,@discount,@timestamp)`),
      getTransactionsByProduct: this.db.prepare('SELECT * FROM transactions WHERE product_id = ? ORDER BY timestamp DESC'),
      getAllProductsPage: (limit, offset) => this.db.prepare(`SELECT * FROM products ORDER BY name LIMIT ${limit} OFFSET ${offset}`),
      countProducts: this.db.prepare('SELECT COUNT(*) as c FROM products'),
      productsByCategory: this.db.prepare('SELECT * FROM products WHERE category = ?'),
      inventoryValue: this.db.prepare('SELECT SUM(price * stock) as value FROM products'),
      lowStock: this.db.prepare('SELECT * FROM products WHERE stock <= min_stock'),
      logTransaction: this.db.prepare('INSERT INTO transaction_logs (transaction_id,message,timestamp) VALUES (?,?,?)'),
      findDiscounts: this.db.prepare('SELECT * FROM discounts WHERE (category = @category OR category IS NULL) AND (customer_group = @group OR customer_group IS NULL) AND min_qty <= @qty ORDER BY percent DESC'),
    };
  }

  addProduct(productId, name, price, stock = 0, category = null, min_stock = 0) {
    if (!productId || !name) throw new AppError('productId and name required', 400);
    if (price < 0 || stock < 0) throw new AppError('price and stock must be non-negative', 400);
    const info = { id: productId, name, price, stock, category, min_stock };
    try {
      this.stmts.addProduct.run(info);
      return info;
    } catch (err) {
      throw new AppError(err.message, 500);
    }
  }

  getProduct(productId) {
    const p = this.stmts.getProduct.get(productId);
    if (!p) throw new AppError('Product not found', 404);
    return p;
  }

  updateProduct(productId, { name, price, stock, category, min_stock }) {
    const existing = this.stmts.getProduct.get(productId);
    if (!existing) throw new AppError('Product not found', 404);
    const data = {
      id: productId,
      name: name ?? existing.name,
      price: (price !== undefined ? price : existing.price),
      stock: (stock !== undefined ? stock : existing.stock),
      category: category ?? existing.category,
      min_stock: (min_stock !== undefined ? min_stock : existing.min_stock)
    };
    if (data.price < 0 || data.stock < 0) throw new AppError('price and stock must be non-negative', 400);
    this.stmts.updateProduct.run(data);
    return this.stmts.getProduct.get(productId);
  }

  updateStock(productId, quantity, transactionType = 'purchase') {
    if (!productId) throw new AppError('productId required', 400);
    if (!Number.isInteger(quantity) || quantity <= 0) throw new AppError('quantity must be positive integer', 400);
    const product = this.stmts.getProduct.get(productId);
    if (!product) throw new AppError('Product not found', 404);

    // sale reduces stock
    const delta = (transactionType === 'sale') ? -quantity : quantity;
    const newStock = product.stock + delta;
    if (newStock < 0) throw new AppError('Stock cannot go negative', 400);

    const info = this.stmts.updateStock.run(delta, productId);
    // check low stock
    if (newStock <= product.min_stock) {
      this.emit('lowStock', { productId, name: product.name, stock: newStock, min_stock: product.min_stock });
    }
    return this.stmts.getProduct.get(productId);
  }

  createTransaction(transactionId, productId, quantity, type = 'sale', customerId = null, supplierId = null) {
    if (!transactionId || !productId || !quantity) throw new AppError('transactionId, productId, quantity required', 400);
    if (!['sale','purchase'].includes(type)) throw new AppError('type must be sale or purchase', 400);
    const product = this.stmts.getProduct.get(productId);
    if (!product) throw new AppError('Product not found', 404);
    if (!Number.isInteger(quantity) || quantity <= 0) throw new AppError('quantity must be positive integer', 400);

    // compute discount if any (based on category or customer group)
    // fetch customer group if customer exists
    let custGroup = null;
    if (customerId) {
      const row = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
      if (row) custGroup = row.group_type;
    }
    const possible = this.stmts.findDiscounts.all({ category: product.category, group: custGroup, qty: quantity });
    const bestDiscount = possible.length ? possible[0].percent : 0;

    // price at time
    const price_at_time = product.price;
    const discount_value = (bestDiscount/100) * price_at_time * quantity;

    // ensure stock rules: sale reduces stock
    this.db.transaction(() => {
      if (type === 'sale') {
        if (product.stock < quantity) throw new AppError('Not enough stock', 400);
        this.stmts.updateStock.run(-quantity, productId);
      } else {
        // purchase increases stock
        this.stmts.updateStock.run(quantity, productId);
      }
      const ts = new Date().toISOString();
      this.stmts.createTransaction.run({
        id: transactionId,
        product_id: productId,
        quantity,
        type,
        customer_id: customerId,
        supplier_id: supplierId,
        price_at_time,
        discount: bestDiscount,
        timestamp: ts
      });
      this.stmts.logTransaction.run(transactionId, `${type} ${quantity} x ${productId} @${price_at_time} discount:${bestDiscount}%`, new Date().toISOString());
    })();

    // after transaction, check current stock and emit if low
    const updated = this.stmts.getProduct.get(productId);
    if (updated.stock <= updated.min_stock) {
      this.emit('lowStock', { productId, name: updated.name, stock: updated.stock, min_stock: updated.min_stock });
    }

    return { transactionId, productId, quantity, type, discountPercent: bestDiscount };
  }

  getProductsByCategory(category) {
    return this.stmts.productsByCategory.all(category);
  }

  getInventoryValue() {
    const row = this.stmts.inventoryValue.get();
    return row.value || 0;
  }

  getProductHistory(productId) {
    return this.stmts.getTransactionsByProduct.all(productId);
  }

  // pagination: page (1-based) & limit
  listProducts({ page = 1, limit = 10 }) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);
    const offset = (page - 1) * limit;
    const rows = this.stmts.getAllProductsPage(limit, offset).all();
    const total = this.stmts.countProducts.get().c;
    return { data: rows, page, limit, total };
  }

  getLowStock() {
    return this.stmts.lowStock.all();
  }

  // utility: close db
  close() {
    this.db.close();
  }
}
