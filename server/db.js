import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let tursoClientInstance = null;
let localClientInstance = null;

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

// Get Turso Cloud DB Client
export const getTursoDb = () => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && authToken) {
    if (!tursoClientInstance) {
      tursoClientInstance = createClient({ url: tursoUrl, authToken });
    }
    return tursoClientInstance;
  }
  return getLocalDb();
};

// Get Local SQLite DB Client (Only for local development, bypassed on Vercel)
export const getLocalDb = () => {
  if (isVercel) {
    // On Vercel, read-only disk makes local file DB impossible. Return Turso client.
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (tursoUrl && authToken) {
      if (!tursoClientInstance) {
        tursoClientInstance = createClient({ url: tursoUrl, authToken });
      }
      return tursoClientInstance;
    }
  }

  if (!localClientInstance) {
    localClientInstance = createClient({ url: 'file:aaradhya_production.db' });
  }
  return localClientInstance;
};

export const getDb = (forceLocal = false) => {
  if (forceLocal && !isVercel) return getLocalDb();
  return getTursoDb();
};

// Execute statement with auto-retry for Turso cold-starts & seamless local fallback
export const executeWithRetry = async (stmt, maxRetries = 3, delayMs = 500) => {
  const sqlStr = (typeof stmt === 'string' ? stmt : stmt.sql || '').trim().toUpperCase();
  const isMutation = sqlStr.startsWith('INSERT') || sqlStr.startsWith('UPDATE') || sqlStr.startsWith('DELETE');

  const tursoClient = getTursoDb();

  // On non-Vercel environment, write to local SQLite asynchronously for offline backup
  if (isMutation && !isVercel) {
    try {
      const localClient = getLocalDb();
      if (localClient) {
        localClient.execute(stmt).catch((e) => {
          console.warn('⚠️ Local SQLite dual-write log:', e.message);
        });
      }
    } catch (e) {}
  }

  // Attempt query on Turso Cloud DB with retry logic for serverless cold-starts
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await tursoClient.execute(stmt);
      return res;
    } catch (err) {
      const is503 = err.message?.includes('503') || err.status === 503 || err.message?.includes('unavailable');
      if (is503 && attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      // On Vercel, do not attempt local SQLite disk write if Turso fails
      if (isVercel) {
        console.error(`❌ Turso query error on Vercel:`, err.message);
        if (sqlStr.startsWith('SELECT')) {
          return { rows: [], columns: [] };
        }
        throw err;
      }

      // If Turso fails locally, fallback to local SQLite DB
      console.warn(`🔄 Turso query failed (${err.message}). Using Local SQLite fallback.`);
      try {
        const localClient = getLocalDb();
        return await localClient.execute(stmt);
      } catch (localErr) {
        console.error('❌ Local SQLite query error:', localErr.message);
        if (sqlStr.startsWith('SELECT')) {
          return { rows: [], columns: [] };
        }
        throw localErr;
      }
    }
  }
};

// Initialize Production DB Tables
export const initDb = async () => {
  const client = getDb();

  const createTables = async (dbClient) => {
    if (!dbClient) return;

    // 1. Orders Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        table_no TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        items TEXT NOT NULL,
        special_notes TEXT,
        item_total REAL DEFAULT 0,
        extra_thali_total REAL DEFAULT 0,
        grand_total REAL NOT NULL,
        payment_method TEXT DEFAULT 'Cash',
        udhar_status TEXT DEFAULT 'none',
        status TEXT DEFAULT 'pending',
        timestamp TEXT NOT NULL,
        settled_at TEXT
      )
    `);

    // 2. Staff Directory Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        monthly_salary REAL DEFAULT 0,
        daily_rate REAL DEFAULT 0,
        joining_date TEXT
      )
    `);

    // 3. Daily Attendance Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        date_key TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        status TEXT NOT NULL,
        PRIMARY KEY (date_key, staff_id)
      )
    `);

    // 4. Salary Advances Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS salary_advances (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        amount REAL NOT NULL,
        notes TEXT,
        date TEXT NOT NULL
      )
    `);

    // 5. Salary Payments Ledger Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS salary_payments (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        month_key TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_date TEXT NOT NULL
      )
    `);

    // 6. Menu Items Directory Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name_mr TEXT NOT NULL,
        name_en TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        is_thali INTEGER DEFAULT 0,
        available INTEGER DEFAULT 1,
        desc_mr TEXT,
        desc_en TEXT,
        spicy_level TEXT,
        is_special INTEGER DEFAULT 0
      )
    `);

    // 7. Menu Categories Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name_mr TEXT NOT NULL,
        name_en TEXT NOT NULL,
        icon TEXT,
        color TEXT
      )
    `);

    // 8. Hotel Rules Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS hotel_rules (
        id INTEGER PRIMARY KEY,
        mr TEXT NOT NULL,
        en TEXT NOT NULL
      )
    `);

    // 9. Owner Configuration / Security Vault Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS owner_config (
        config_key TEXT PRIMARY KEY,
        config_value TEXT NOT NULL
      )
    `);

    // 10. Custom Dining Tables
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS custom_tables (
        table_name TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      )
    `);

    // 11. Udhar Settlement Ledger Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS udhar_ledger (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        settled_at TEXT NOT NULL
      )
    `);

    // 12. End-of-Day EOD Close Reports Table
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS eod_reports (
        id TEXT PRIMARY KEY,
        date_key TEXT NOT NULL,
        total_revenue REAL NOT NULL,
        total_orders INTEGER NOT NULL,
        cash_total REAL NOT NULL,
        upi_total REAL NOT NULL,
        udhar_total REAL NOT NULL,
        veg_count INTEGER DEFAULT 0,
        non_veg_count INTEGER DEFAULT 0,
        closed_at TEXT NOT NULL
      )
    `);

    const migrations = [
      `ALTER TABLE orders ADD COLUMN special_notes TEXT`,
      `ALTER TABLE orders ADD COLUMN item_total REAL DEFAULT 0`,
      `ALTER TABLE orders ADD COLUMN extra_thali_total REAL DEFAULT 0`,
      `ALTER TABLE orders ADD COLUMN udhar_status TEXT DEFAULT 'none'`,
      `ALTER TABLE orders ADD COLUMN settled_at TEXT`
    ];

    for (const sql of migrations) {
      try {
        await dbClient.execute(sql);
      } catch (error) {
        if (!String(error.message || '').toLowerCase().includes('duplicate column')) {
          throw error;
        }
      }
    }
  };

  try {
    await createTables(client);
    console.log('✅ Turso Cloud DB Tables Initialized Successfully!');
  } catch (error) {
    console.error('⚠️ Turso Cloud DB Init Warning:', error.message);
  }

  if (!isVercel) {
    try {
      const localDbClient = getDb(true);
      await createTables(localDbClient);
      console.log('✅ Local SQLite (aaradhya_production.db) Tables Initialized Successfully!');
    } catch (localErr) {
      console.error('❌ Local SQLite Init Error:', localErr.message);
    }
  }
};
