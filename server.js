// server.js
import http from 'http';
import InventoryManager, { AppError } from './InventoryManager.js';
import fs from 'fs';
import url from 'url';

const PORT = process.env.PORT || 3000;
const manager = new InventoryManager('./inventory.db');

// subscribe to low stock event
manager.on('lowStock', info => {
  console.warn('LOW STOCK ALERT:', info);
  // could push to websocket, email, or other real-notification
});

// simple JSON body parser (promise)
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new AppError('Invalid JSON body', 400));
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  const method = req.method;

  // CORS simple handling for frontend use
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    // POST /products
    if (method === 'POST' && path === '/products') {
      const body = await parseBody(req);
      const { id, name, price, stock, category, min_stock } = body;
      const added = manager.addProduct(id, name, Number(price), Number(stock || 0), category || null, Number(min_stock || 0));
      return sendJSON(res, 201, { success: true, product: added });
    }

    // GET /products (with pagination & optional category filter & search)
    if (method === 'GET' && path === '/products') {
      const { page = 1, limit = 10, category, q } = parsed.query;
      if (category) {
        const data = manager.getProductsByCategory(category);
        return sendJSON(res, 200, { data });
      }
      // page pagination
      const list = manager.listProducts({ page: Number(page), limit: Number(limit) });
      // optional search by q
      if (q) {
        list.data = list.data.filter(p => p.name.toLowerCase().includes(String(q).toLowerCase()));
      }
      return sendJSON(res, 200, list);
    }

    // PUT /products/:id
    if (method === 'PUT' && path.startsWith('/products/')) {
      const productId = path.split('/')[2];
      const body = await parseBody(req);
      const updated = manager.updateProduct(productId, body);
      return sendJSON(res, 200, { success: true, product: updated });
    }

    // POST /transactions
    if (method === 'POST' && path === '/transactions') {
      const body = await parseBody(req);
      const { id, productId, quantity, type, customerId, supplierId } = body;
      const tx = manager.createTransaction(id, productId, Number(quantity), type, customerId || null, supplierId || null);
      return sendJSON(res, 201, { success: true, transaction: tx });
    }

    // GET /reports/inventory
    if (method === 'GET' && path === '/reports/inventory') {
      const value = manager.getInventoryValue();
      return sendJSON(res, 200, { inventoryValue: value });
    }

    // GET /reports/low-stock
    if (method === 'GET' && path === '/reports/low-stock') {
      const items = manager.getLowStock();
      return sendJSON(res, 200, { lowStock: items });
    }

    // GET /products/:id/history
    if (method === 'GET' && path.startsWith('/products/') && path.endsWith('/history')) {
      const productId = path.split('/')[2];
      const history = manager.getProductHistory(productId);
      return sendJSON(res, 200, { productId, history });
    }

    // fallback: simple index or docs
    if (method === 'GET' && path === '/') {
      const readme = fs.readFileSync('./README.md', 'utf8');
      res.writeHead(200, {'Content-Type':'text/markdown'});
      return res.end(readme);
    }

    sendJSON(res, 404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof AppError) {
      return sendJSON(res, err.code || 400, { error: err.message });
    }
    console.error('Unhandled error', err);
    return sendJSON(res, 500, { error: 'Internal server error', detail: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Inventory API listening on http://localhost:${PORT}`);
});
