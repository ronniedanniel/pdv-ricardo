// GERENCIADOR DE BANCO DE DADOS - SUPABASE & INDEXEDDB FALLBACK
const DB_NAME = 'pdv_bar_db';
const DB_VERSION = 3;
let db = null;
let isSupabaseActive = false;
let supabaseClient = null;

async function initDB() {
  const disabled = localStorage.getItem('supabase_disabled') === 'true';
  let url = localStorage.getItem('supabase_url');
  let key = localStorage.getItem('supabase_key');
  
  if (!url || !key) {
    if (disabled) {
      await initIndexedDB();
      return;
    }
    url = 'https://muhpcowyjzsfmxzeprva.supabase.co';
    key = 'sb_publishable_MuD6E_cwyJhJcX9Alz4zxw_qgY_40Cp';
  }
  
  if (url && key) {
    try {
      // 1. Carregar script do Supabase se não estiver carregado
      await new Promise((resolve, reject) => {
        if (typeof supabase !== 'undefined') {
          resolve();
        } else {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Erro ao carregar SDK do Supabase'));
          document.head.appendChild(script);
        }
      });
      
      // 2. Inicializar cliente
      supabaseClient = supabase.createClient(url, key);
      
      // 3. Testar a conexão com uma query rápida na tabela settings
      const { error } = await supabaseClient.from('settings').select().limit(1);
      if (error) throw error;
      
      isSupabaseActive = true;
      console.log('Conectado ao Supabase com sucesso.');
      
      // Alimentar dados padrão na nuvem caso estejam em branco
      await seedInitialDataSupabase();
      return;
    } catch (err) {
      console.error('Falha ao conectar ao Supabase. Caindo de volta para o IndexedDB local:', err);
      isSupabaseActive = false;
    }
  }
  
  // Se não houver chaves configuradas ou a rede falhar, usa IndexedDB
  await initIndexedDB();
}

// --- INDEXEDDB LOCAL IMPLEMENTATION ---
async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('categories')) {
        d.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
      }
      if (!d.objectStoreNames.contains('products')) {
        const s = d.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_category', 'categoryId');
      }
      if (!d.objectStoreNames.contains('tables')) {
        d.createObjectStore('tables', { keyPath: 'id', autoIncrement: true });
      }
      if (!d.objectStoreNames.contains('orders')) {
        const s = d.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_table', 'tableId');
        s.createIndex('by_status', 'status');
      }
      if (!d.objectStoreNames.contains('order_items')) {
        const s = d.createObjectStore('order_items', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_order', 'orderId');
      }
      if (!d.objectStoreNames.contains('sales')) {
        const s = d.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_date', 'createdAt');
      }
      if (!d.objectStoreNames.contains('sale_items')) {
        const s = d.createObjectStore('sale_items', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_sale', 'saleId');
        s.createIndex('by_product', 'productId');
      }
      if (!d.objectStoreNames.contains('stock_movements')) {
        const s = d.createObjectStore('stock_movements', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_product', 'productId');
        s.createIndex('by_date', 'date');
        s.createIndex('by_type', 'type');
      }
      if (!d.objectStoreNames.contains('cash_sessions')) {
        const s = d.createObjectStore('cash_sessions', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_status', 'status');
      }
      if (!d.objectStoreNames.contains('settings')) {
        d.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!d.objectStoreNames.contains('customers')) {
        const s = d.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_name', 'name');
      }
      if (!d.objectStoreNames.contains('fiado')) {
        const s = d.createObjectStore('fiado', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_customer', 'customerId');
        s.createIndex('by_paid', 'paid');
      }
      if (!d.objectStoreNames.contains('users')) {
        const s = d.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_username', 'username', { unique: true });
      }
    };
  });
}

function dbGetIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName).objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAllIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName).objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetByIndexIndexedDB(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName).objectStore(storeName).index(indexName).getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbAddIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readwrite').objectStore(storeName).add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbPutIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readwrite').objectStore(storeName).put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbDeleteIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- DYNAMIC DATABASE ROUTER ---
function mapIndexToColumn(storeName, indexName) {
  switch (indexName) {
    case 'by_category': return 'categoryId';
    case 'by_table': return 'tableId';
    case 'by_status': return 'status';
    case 'by_order': return 'orderId';
    case 'by_date': return storeName === 'sales' ? 'createdAt' : 'date';
    case 'by_sale': return 'saleId';
    case 'by_product': return 'productId';
    case 'by_type': return 'type';
    case 'by_name': return 'name';
    case 'by_customer': return 'customerId';
    case 'by_paid': return 'paid';
    case 'by_username': return 'username';
    default: return indexName;
  }
}

async function dbGet(storeName, id) {
  if (isSupabaseActive) {
    const pk = storeName === 'settings' ? 'key' : 'id';
    const { data, error } = await supabaseClient.from(storeName).select().eq(pk, id).maybeSingle();
    if (error) throw error;
    return data;
  } else {
    return dbGetIndexedDB(storeName, id);
  }
}

async function dbGetAll(storeName) {
  if (isSupabaseActive) {
    const { data, error } = await supabaseClient.from(storeName).select();
    if (error) throw error;
    return data || [];
  } else {
    return dbGetAllIndexedDB(storeName);
  }
}

async function dbGetByIndex(storeName, indexName, value) {
  if (isSupabaseActive) {
    const col = mapIndexToColumn(storeName, indexName);
    const { data, error } = await supabaseClient.from(storeName).select().eq(col, value);
    if (error) throw error;
    return data || [];
  } else {
    return dbGetByIndexIndexedDB(storeName, indexName, value);
  }
}

let warnedActiveColumn = false;
function showActiveColumnWarning() {
  if (warnedActiveColumn) return;
  warnedActiveColumn = true;
  setTimeout(() => {
    alert("AVISO IMPORTANTE:\n\nA coluna 'active' não foi encontrada na tabela 'customers' do seu Supabase. O sistema salvou o cliente sem essa informação para não travar.\n\nPara que o recurso de desativar clientes funcione corretamente, vá ao SQL Editor do seu painel Supabase e execute a linha:\n\nALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;");
  }, 500);
}

async function dbAdd(storeName, data) {
  if (isSupabaseActive) {
    const copy = { ...data };
    if (!copy.id) delete copy.id;
    
    // Mapeia customerName para tableName na tabela sales se tableName não estiver preenchido
    if (storeName === 'sales') {
      if (!copy.tableName && copy.customerName) {
        copy.tableName = copy.customerName;
      }
    }
    
    while (true) {
      try {
        const { data: inserted, error } = await supabaseClient.from(storeName).insert(copy).select().single();
        if (error) throw error;
        return inserted.id;
      } catch (err) {
        const isColumnError = err.code === '42703' || 
                              (err.message && (
                                err.message.includes('column') ||
                                err.message.includes('schema cache')
                              ));
        if (isColumnError) {
          let col = null;
          const matchCache = err.message.match(/find the '([^']+)' column/);
          const matchExist = err.message.match(/column [^\s]+\.([^\s]+) does not exist/);
          
          if (matchCache) col = matchCache[1];
          else if (matchExist) col = matchExist[1];
          
          if (col && col in copy) {
            console.warn(`A coluna '${col}' não existe na tabela '${storeName}'. Removendo do insert e tentando novamente...`);
            delete copy[col];
            if (col === 'active') showActiveColumnWarning();
            continue; // Tenta novamente
          }
        }
        throw err;
      }
    }
  } else {
    return dbAddIndexedDB(storeName, data);
  }
}

async function dbPut(storeName, data) {
  if (isSupabaseActive) {
    const copy = { ...data };
    
    // Mapeia customerName para tableName na tabela sales se tableName não estiver preenchido
    if (storeName === 'sales') {
      if (!copy.tableName && copy.customerName) {
        copy.tableName = copy.customerName;
      }
    }
    
    while (true) {
      try {
        const { data: upserted, error } = await supabaseClient.from(storeName).upsert(copy).select().single();
        if (error) throw error;
        const pk = storeName === 'settings' ? upserted.key : upserted.id;
        return pk;
      } catch (err) {
        const isColumnError = err.code === '42703' || 
                              (err.message && (
                                err.message.includes('column') ||
                                err.message.includes('schema cache')
                              ));
        if (isColumnError) {
          let col = null;
          const matchCache = err.message.match(/find the '([^']+)' column/);
          const matchExist = err.message.match(/column [^\s]+\.([^\s]+) does not exist/);
          
          if (matchCache) col = matchCache[1];
          else if (matchExist) col = matchExist[1];
          
          if (col && col in copy) {
            console.warn(`A coluna '${col}' não existe na tabela '${storeName}'. Removendo do upsert e tentando novamente...`);
            delete copy[col];
            if (col === 'active') showActiveColumnWarning();
            continue; // Tenta novamente
          }
        }
        throw err;
      }
    }
  } else {
    return dbPutIndexedDB(storeName, data);
  }
}

async function dbDelete(storeName, id) {
  if (isSupabaseActive) {
    const pk = storeName === 'settings' ? 'key' : 'id';
    const { error } = await supabaseClient.from(storeName).delete().eq(pk, id);
    if (error) throw error;
  } else {
    return dbDeleteIndexedDB(storeName, id);
  }
}

async function dbGetSetting(key, defaultValue = null) {
  const r = await dbGet('settings', key);
  return r ? r.value : defaultValue;
}

async function dbSetSetting(key, value) {
  await dbPut('settings', { key, value });
}

// --- INITIAL DATA SEEDERS ---
async function seedInitialData() {
  if (isSupabaseActive) {
    // Semeado em initDB() para o Supabase
    return;
  } else {
    await seedInitialDataIndexedDB();
  }
}

async function seedInitialDataIndexedDB() {
  const tables = await dbGetAllIndexedDB('tables');
  const hasBalcao = tables.some(t => t.number === 0);
  if (!hasBalcao) {
    await dbAddIndexedDB('tables', { number: 0, capacity: 1, status: 'free', label: 'Balcão / Venda Rápida', type: 'table' });
  }

  const users = await dbGetAllIndexedDB('users');
  if (users.length === 0) {
    await dbAddIndexedDB('users', {
      username: 'admin',
      password: '123',
      name: 'Administrador',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  const cats = await dbGetAllIndexedDB('categories');
  if (cats.length > 0) return;

  const categories = [
    { name: 'Cervejas',      color: '#f59e0b', icon: '🍺' },
    { name: 'Destilados',    color: '#8b5cf6', icon: '🥃' },
    { name: 'Coquetéis',    color: '#ec4899', icon: '🍹' },
    { name: 'Refrigerantes', color: '#3b82f6', icon: '🥤' },
    { name: 'Porções',       color: '#10b981', icon: '🍗' },
    { name: 'Sem Álcool',    color: '#06b6d4', icon: '💧' },
  ];
  const catIds = [];
  for (const c of categories) { catIds.push(await dbAddIndexedDB('categories', c)); }

  const products = [
    { categoryId: catIds[0], name: 'Cerveja Long Neck',    price: 10, cost: 5,  stock: 50,  minStock: 10, unit: 'un',   active: true },
    { categoryId: catIds[0], name: 'Cerveja Lata 350ml',   price: 7,  cost: 3.5,stock: 100, minStock: 20, unit: 'un',   active: true },
    { categoryId: catIds[0], name: 'Cerveja 600ml',        price: 14, cost: 7,  stock: 30,  minStock: 5,  unit: 'un',   active: true },
    { categoryId: catIds[1], name: 'Dose Cachaça',         price: 8,  cost: 3,  stock: 200, minStock: 30, unit: 'dose', active: true },
    { categoryId: catIds[1], name: 'Dose Whisky',          price: 20, cost: 10, stock: 100, minStock: 15, unit: 'dose', active: true },
    { categoryId: catIds[1], name: 'Dose Vodka',           price: 12, cost: 5,  stock: 150, minStock: 20, unit: 'dose', active: true },
    { categoryId: catIds[2], name: 'Caipirinha',           price: 18, cost: 6,  stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[2], name: 'Caipivodka',           price: 18, cost: 6,  stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[2], name: 'Batida',               price: 15, cost: 5,  stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[3], name: 'Refrigerante Lata',   price: 6,  cost: 3,  stock: 80,  minStock: 20, unit: 'un',   active: true },
    { categoryId: catIds[3], name: 'Suco de Lata',        price: 7,  cost: 3,  stock: 60,  minStock: 15, unit: 'un',   active: true },
    { categoryId: catIds[4], name: 'Porção de Fritas',    price: 25, cost: 10, stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[4], name: 'Porção Calabresa',    price: 30, cost: 12, stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[4], name: 'Porção Frango',       price: 35, cost: 15, stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[5], name: 'Água sem Gás',        price: 4,  cost: 1.5,stock: 60,  minStock: 15, unit: 'un',   active: true },
    { categoryId: catIds[5], name: 'Água com Gás',        price: 5,  cost: 2,  stock: 40,  minStock: 10, unit: 'un',   active: true },
  ];
  for (const p of products) { await dbAddIndexedDB('products', p); }

  for (let i = 1; i <= 12; i++) {
    await dbAddIndexedDB('tables', { number: i, capacity: 4, status: 'free', label: `Mesa ${i}`, type: 'table' });
  }

  await dbSetSetting('bar_name', 'Bar do Ricardo');
  await dbSetSetting('happy_hour_start', '17:00');
  await dbSetSetting('happy_hour_end', '19:00');
  await dbSetSetting('happy_hour_discount', 20);
}

async function seedInitialDataSupabase() {
  const tables = await dbGetAll('tables');
  const hasBalcao = tables.some(t => t.number === 0);
  if (!hasBalcao) {
    await dbAdd('tables', { number: 0, capacity: 1, status: 'free', label: 'Balcão / Venda Rápida', type: 'table' });
  }

  const users = await dbGetAll('users');
  if (users.length === 0) {
    await dbAdd('users', {
      username: 'admin',
      password: '123',
      name: 'Administrador',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  const cats = await dbGetAll('categories');
  if (cats.length > 0) return;

  const categories = [
    { name: 'Cervejas',      color: '#f59e0b', icon: '🍺' },
    { name: 'Destilados',    color: '#8b5cf6', icon: '🥃' },
    { name: 'Coquetéis',    color: '#ec4899', icon: '🍹' },
    { name: 'Refrigerantes', color: '#3b82f6', icon: '🥤' },
    { name: 'Porções',       color: '#10b981', icon: '🍗' },
    { name: 'Sem Álcool',    color: '#06b6d4', icon: '💧' },
  ];
  const catIds = [];
  for (const c of categories) { catIds.push(await dbAdd('categories', c)); }

  const products = [
    { categoryId: catIds[0], name: 'Cerveja Long Neck',    price: 10, cost: 5,  stock: 50,  minStock: 10, unit: 'un',   active: true },
    { categoryId: catIds[0], name: 'Cerveja Lata 350ml',   price: 7,  cost: 3.5,stock: 100, minStock: 20, unit: 'un',   active: true },
    { categoryId: catIds[0], name: 'Cerveja 600ml',        price: 14, cost: 7,  stock: 30,  minStock: 5,  unit: 'un',   active: true },
    { categoryId: catIds[1], name: 'Dose Cachaça',         price: 8,  cost: 3,  stock: 200, minStock: 30, unit: 'dose', active: true },
    { categoryId: catIds[1], name: 'Dose Whisky',          price: 20, cost: 10, stock: 100, minStock: 15, unit: 'dose', active: true },
    { categoryId: catIds[1], name: 'Dose Vodka',           price: 12, cost: 5,  stock: 150, minStock: 20, unit: 'dose', active: true },
    { categoryId: catIds[2], name: 'Caipirinha',           price: 18, cost: 6,  stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[2], name: 'Caipivodka',           price: 18, cost: 6,  stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[2], name: 'Batida',               price: 15, cost: 5,  stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[3], name: 'Refrigerante Lata',   price: 6,  cost: 3,  stock: 80,  minStock: 20, unit: 'un',   active: true },
    { categoryId: catIds[3], name: 'Suco de Lata',        price: 7,  cost: 3,  stock: 60,  minStock: 15, unit: 'un',   active: true },
    { categoryId: catIds[4], name: 'Porção de Fritas',    price: 25, cost: 10, stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[4], name: 'Porção Calabresa',    price: 30, cost: 12, stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[4], name: 'Porção Frango',       price: 35, cost: 15, stock: 999, minStock: 0,  unit: 'un',   active: true },
    { categoryId: catIds[5], name: 'Água sem Gás',        price: 4,  cost: 1.5,stock: 60,  minStock: 15, unit: 'un',   active: true },
    { categoryId: catIds[5], name: 'Água com Gás',        price: 5,  cost: 2,  stock: 40,  minStock: 10, unit: 'un',   active: true },
  ];
  for (const p of products) { await dbAdd('products', p); }

  for (let i = 1; i <= 12; i++) {
    await dbAdd('tables', { number: i, capacity: 4, status: 'free', label: `Mesa ${i}`, type: 'table' });
  }

  await dbSetSetting('bar_name', 'Bar do Ricardo');
  await dbSetSetting('happy_hour_start', '17:00');
  await dbSetSetting('happy_hour_end', '19:00');
  await dbSetSetting('happy_hour_discount', 20);
}

// --- HELPER BUSINESS LOGIC FUNCTIONS (ROUTED AUTOMATICALLY) ---
async function getProductStock(productId) {
  const product = await dbGet('products', productId);
  return product ? product.stock : 0;
}

async function updateProductStock(productId, delta, type, reason) {
  const product = await dbGet('products', productId);
  if (!product) return;
  product.stock = Math.max(0, (product.stock || 0) + delta);
  await dbPut('products', product);
  await dbAdd('stock_movements', {
    productId,
    productName: product.name,
    type,
    qty: Math.abs(delta),
    reason: reason || '',
    date: new Date().toISOString(),
  });
}

async function getLowStockProducts() {
  const products = await dbGetAll('products');
  return products.filter(p => p.active && p.minStock > 0 && p.stock <= p.minStock);
}

async function getOpenCashSession() {
  const sessions = await dbGetByIndex('cash_sessions', 'by_status', 'open');
  return sessions.length > 0 ? sessions[0] : null;
}

async function getSalesToday() {
  const all = await dbGetAll('sales');
  const today = new Date().toDateString();
  return all.filter(s => new Date(s.createdAt).toDateString() === today);
}

async function getSaleItems(saleId) {
  return dbGetByIndex('sale_items', 'by_sale', saleId);
}

async function getOrderItems(orderId) {
  return dbGetByIndex('order_items', 'by_order', orderId);
}

async function getOpenOrderByTable(tableId) {
  const orders = await dbGetByIndex('orders', 'by_table', tableId);
  return orders.find(o => o.status === 'open') || null;
}

async function findOrCreateCustomer(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const all = await dbGetAll('customers');
  const found = all.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.active !== false);
  if (found) return found;
  const id = await dbAdd('customers', { name: trimmed, phone: '', notes: '', active: true, createdAt: new Date().toISOString() });
  return dbGet('customers', id);
}

async function getCustomerFiado(customerId) {
  return dbGetByIndex('fiado', 'by_customer', customerId);
}

async function getCustomerFiadoBalance(customerId) {
  const records = await getCustomerFiado(customerId);
  return records.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0);
}

async function recordFiado(customerId, customerName, saleId, amount) {
  return dbAdd('fiado', {
    customerId,
    customerName,
    saleId,
    amount,
    date: new Date().toISOString(),
    paid: false,
    paidAt: null,
    notes: '',
  });
}

async function payFiado(fiadoId, notes) {
  const r = await dbGet('fiado', fiadoId);
  if (!r) return;
  await dbPut('fiado', { ...r, paid: true, paidAt: new Date().toISOString(), notes: notes || '' });
}

async function getAllCustomersWithBalance() {
  const customers = await dbGetAll('customers');
  const result = [];
  for (const c of customers) {
    const balance = await getCustomerFiadoBalance(c.id);
    const records = await getCustomerFiado(c.id);
    result.push({ ...c, balance, totalRecords: records.length });
  }
  return result.sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

async function dbGetAllUsers() {
  return dbGetAll('users');
}

async function dbAddUser(user) {
  const all = await dbGetAll('users');
  const duplicate = all.some(u => u.username.toLowerCase() === user.username.toLowerCase().trim());
  if (duplicate) {
    throw new Error('Nome de usuário já cadastrado');
  }
  return dbAdd('users', {
    name: user.name.trim(),
    username: user.username.toLowerCase().trim(),
    password: user.password,
    role: user.role || 'employee',
    active: true,
    createdAt: new Date().toISOString()
  });
}

async function dbDeleteUser(id) {
  return dbDelete('users', id);
}

async function dbVerifyLogin(username, password) {
  const all = await dbGetAll('users');
  const user = all.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
  return user || null;
}
