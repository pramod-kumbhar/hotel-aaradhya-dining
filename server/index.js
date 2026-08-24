import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { getDb, initDb, executeWithRetry } from './db.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Lazy DB initialization middleware for Vercel Serverless Functions
let isDbInitStarted = false;
app.use(async (req, res, next) => {
  if (!isDbInitStarted) {
    isDbInitStarted = true;
    initDb().catch((err) => {
      console.error('Lazy DB Init Error:', err.message);
    });
  }
  next();
});

// Root API Health & Status Check Route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    service: 'Hotel Aaradhya Dining API',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL === '1' ? 'Vercel Serverless' : 'Node.js Local Server'
  });
});

const PORT = process.env.PORT || 5000;

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// Create SMTP Nodemailer Transporter with Port 465/587 Auto Fallback & Clean Password Handling
const createTransporter = (forceTls = false) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = forceTls ? 587 : parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = !forceTls && (process.env.SMTP_SECURE === 'true' || port === 465);
  const user = (process.env.SMTP_USER || process.env.VITE_OWNER_EMAIL || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim(); // Remove spaces from 16-char app password

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// ===================================================
// REAL AUDIO SPEECH SYNTHESIS STREAMING API (FOR BACKGROUND SOUNDBOX ON MOBILE)
// ===================================================
app.get('/api/tts', async (req, res) => {
  const text = (req.query.text || '').trim();
  const lang = req.query.lang || 'mr';
  if (!text) return res.status(400).send('Text query is required');

  try {
    const encodedText = encodeURIComponent(text);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;

    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`TTS Upstream Error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });

    res.send(buffer);
  } catch (error) {
    console.error('TTS endpoint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===================================================
// TURSO DATABASE REST API ENDPOINTS (WITH RETRY & FALLBACK)
// ===================================================

// 1. Get All Production Orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM orders ORDER BY timestamp DESC');
    const orders = result.rows.map(row => ({
      id: row.id,
      tableNo: row.table_no,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      items: safeJsonParse(row.items, []),
      specialNotes: row.special_notes || '',
      itemTotal: Number(row.item_total || 0),
      extraThaliTotal: Number(row.extra_thali_total || 0),
      grandTotal: Number(row.grand_total),
      paymentMethod: row.payment_method,
      udharStatus: row.udhar_status || 'none',
      status: row.status,
      timestamp: row.timestamp,
      settledAt: row.settled_at
    }));
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Save New Order to Turso DB
app.post('/api/orders', async (req, res) => {
  const {
    id,
    tableNo,
    customerName,
    customerPhone,
    items,
    specialNotes,
    itemTotal,
    extraThaliTotal,
    grandTotal,
    paymentMethod,
    udharStatus,
    status,
    timestamp,
    settledAt
  } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO orders (id, table_no, customer_name, customer_phone, items, special_notes, item_total, extra_thali_total, grand_total, payment_method, udhar_status, status, timestamp, settled_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              table_no = excluded.table_no,
              customer_name = excluded.customer_name,
              customer_phone = excluded.customer_phone,
              items = excluded.items,
              special_notes = excluded.special_notes,
              item_total = excluded.item_total,
              extra_thali_total = excluded.extra_thali_total,
              grand_total = excluded.grand_total,
              payment_method = excluded.payment_method,
              udhar_status = excluded.udhar_status,
              status = excluded.status,
              timestamp = excluded.timestamp,
              settled_at = excluded.settled_at`,
      args: [
        id,
        tableNo,
        customerName || '',
        customerPhone || '',
        JSON.stringify(items || []),
        specialNotes || '',
        Number(itemTotal || 0),
        Number(extraThaliTotal || 0),
        Number(grandTotal || 0),
        paymentMethod || 'Cash',
        udharStatus || 'none',
        status || 'pending',
        timestamp || new Date().toISOString(),
        settledAt || null
      ]
    });
    res.json({ success: true, message: 'Order saved to Turso DB!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update Order Status / Settlement / Full Edit
app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { tableNo, status, paymentMethod, customerName, customerPhone, items, specialNotes, itemTotal, extraThaliTotal, grandTotal, udharStatus, settledAt } = req.body;
  try {
    const existing = await executeWithRetry({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [id]
    });

    if (!existing.rows.length) {
      // Order not in DB yet - insert with new data
      await executeWithRetry({
        sql: `INSERT INTO orders (id, table_no, customer_name, customer_phone, timestamp, status, items, special_notes, payment_method, item_total, extra_thali_total, grand_total, udhar_status, settled_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          tableNo || req.body.tableNo || 'Table 1',
          customerName || '',
          customerPhone || '',
          req.body.timestamp || new Date().toISOString(),
          status || 'pending',
          JSON.stringify(items || []),
          specialNotes || '',
          paymentMethod || 'Cash',
          Number(itemTotal || 0),
          Number(extraThaliTotal || 0),
          Number(grandTotal || 0),
          udharStatus || 'none',
          settledAt || null
        ]
      });
      return res.json({ success: true, message: 'Order inserted with updated data!' });
    }

    const current = existing.rows[0];
    await executeWithRetry({
      sql: `UPDATE orders SET
              table_no = ?,
              status = ?,
              payment_method = ?,
              customer_name = ?,
              customer_phone = ?,
              items = ?,
              special_notes = ?,
              item_total = ?,
              extra_thali_total = ?,
              grand_total = ?,
              udhar_status = ?,
              settled_at = ?
            WHERE id = ?`,
      args: [
        tableNo !== undefined ? tableNo : (current.table_no || 'Table 1'),
        status !== undefined ? status : current.status,
        paymentMethod || current.payment_method || 'Cash',
        customerName !== undefined ? customerName : (current.customer_name || ''),
        customerPhone !== undefined ? customerPhone : (current.customer_phone || ''),
        JSON.stringify(items !== undefined ? (typeof items === 'string' ? safeJsonParse(items, []) : items) : safeJsonParse(current.items, [])),
        specialNotes !== undefined ? specialNotes : (current.special_notes ?? ''),
        itemTotal !== undefined ? Number(itemTotal) : (current.item_total ?? 0),
        extraThaliTotal !== undefined ? Number(extraThaliTotal) : (current.extra_thali_total ?? 0),
        grandTotal !== undefined ? Number(grandTotal) : (current.grand_total ?? 0),
        udharStatus !== undefined ? udharStatus : (current.udhar_status ?? 'none'),
        settledAt !== undefined ? settledAt : (current.settled_at ?? null),
        id
      ]
    });
    res.json({ success: true, message: 'Order updated in DB!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Safe Day Transition (Preserves Historical Orders in Database)
app.delete('/api/orders', async (req, res) => {
  // Prevent accidental complete table purge - historical records are permanently preserved
  res.json({ success: true, message: 'Historical orders safely preserved in database!' });
});

app.post('/api/orders/clear-all', async (req, res) => {
  // Prevent accidental complete table purge - historical records are permanently preserved
  res.json({ success: true, message: 'Historical orders safely preserved in database!' });
});

// 5. Delete Single Order Permanently from Database (When Order is Cancelled)
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeWithRetry({
      sql: 'DELETE FROM orders WHERE id = ?',
      args: [id]
    });
    res.json({ success: true, message: 'Order permanently deleted from DB' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================
// STAFF MANAGEMENT API ENDPOINTS (Clean Rebuild)
// ===================================================

// 1. Get All Staff Members
app.get('/api/staff', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM staff ORDER BY rowid DESC');
    const staff = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone,
      monthlySalary: Number(row.monthly_salary || 0),
      dailyRate: Number(row.daily_rate || 0),
      joiningDate: row.joining_date
    }));
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Add / Update Staff Member
app.post('/api/staff', async (req, res) => {
  const { id, name, role, phone, monthlySalary, dailyRate, joiningDate } = req.body;
  if (!id || !name) {
    return res.status(400).json({ success: false, error: 'Staff ID and Name are required' });
  }

  try {
    await executeWithRetry({
      sql: `INSERT INTO staff (id, name, role, phone, monthly_salary, daily_rate, joining_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              role = excluded.role,
              phone = excluded.phone,
              monthly_salary = excluded.monthly_salary,
              daily_rate = excluded.daily_rate,
              joining_date = excluded.joining_date`,
      args: [
        id,
        name,
        role || 'Staff',
        phone || '',
        monthlySalary || 0,
        dailyRate || 0,
        joiningDate || new Date().toISOString().split('T')[0]
      ]
    });
    res.json({ success: true, message: 'Staff member saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Delete Specific Staff Member (With cascading removal of linked attendance/salaries)
app.delete('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeWithRetry({
      sql: `DELETE FROM staff WHERE id = ?`,
      args: [id]
    });
    await executeWithRetry({
      sql: `DELETE FROM attendance WHERE staff_id = ?`,
      args: [id]
    }).catch(() => {});
    await executeWithRetry({
      sql: `DELETE FROM salary_advances WHERE staff_id = ?`,
      args: [id]
    }).catch(() => {});
    await executeWithRetry({
      sql: `DELETE FROM salary_payments WHERE staff_id = ?`,
      args: [id]
    }).catch(() => {});
    res.json({ success: true, message: 'Staff member permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Clear All Staff Members (Full Wipe)
app.delete('/api/staff', async (req, res) => {
  try {
    await executeWithRetry(`DELETE FROM staff`);
    await executeWithRetry(`DELETE FROM attendance`).catch(() => {});
    await executeWithRetry(`DELETE FROM salary_advances`).catch(() => {});
    await executeWithRetry(`DELETE FROM salary_payments`).catch(() => {});
    res.json({ success: true, message: 'All staff records wiped' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get All Menu Items from Turso DB
app.get('/api/menu', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM menu_items ORDER BY category, id');
    const menuItems = result.rows.map(row => ({
      id: row.id,
      nameMr: row.name_mr,
      nameEn: row.name_en,
      category: row.category,
      price: Number(row.price),
      isThali: Boolean(row.is_thali),
      available: Boolean(row.available),
      descMr: row.desc_mr,
      descEn: row.desc_en,
      spicyLevel: row.spicy_level,
      isSpecial: Boolean(row.is_special)
    }));
    res.json({ success: true, menuItems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Bulk Seed / Save Menu Items to Turso DB
app.post('/api/seed-menu', async (req, res) => {
  const { items } = req.body;
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid items array' });
    }

    for (const item of items) {
      await executeWithRetry({
        sql: `INSERT INTO menu_items (id, name_mr, name_en, category, price, is_thali, available, desc_mr, desc_en, spicy_level, is_special)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name_mr = excluded.name_mr,
                name_en = excluded.name_en,
                category = excluded.category,
                price = excluded.price,
                is_thali = excluded.is_thali,
                available = excluded.available,
                desc_mr = excluded.desc_mr,
                desc_en = excluded.desc_en,
                spicy_level = excluded.spicy_level,
                is_special = excluded.is_special`,
        args: [
          item.id,
          item.nameMr,
          item.nameEn,
          item.category,
          item.price,
          item.isThali ? 1 : 0,
          item.available !== false ? 1 : 0,
          item.descMr || '',
          item.descEn || '',
          item.spicyLevel || 'Medium',
          item.isSpecial ? 1 : 0
        ]
      });
    }

    res.json({ success: true, count: items.length, message: `✅ ${items.length} Menu items saved to Turso DB!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Attendance Records
app.get('/api/attendance', async (req, res) => {
  try {
    const [attendance, submitted] = await Promise.all([
      executeWithRetry('SELECT * FROM attendance'),
      executeWithRetry({
        sql: `SELECT config_key, config_value FROM owner_config WHERE config_key LIKE ?`,
        args: ['attendance_submitted_%']
      })
    ]);

    const attendanceRecords = {};
    attendance.rows.forEach((row) => {
      attendanceRecords[`${row.date_key}_${row.staff_id}`] = row.status;
    });

    const submittedAttendanceDates = {};
    submitted.rows.forEach((row) => {
      const dateKey = row.config_key.replace('attendance_submitted_', '');
      submittedAttendanceDates[dateKey] = row.config_value === 'true';
    });

    res.json({ success: true, attendanceRecords, submittedAttendanceDates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { dateKey, staffId, status } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO attendance (date_key, staff_id, status)
            VALUES (?, ?, ?)
            ON CONFLICT(date_key, staff_id) DO UPDATE SET status = excluded.status`,
      args: [dateKey, staffId, status]
    });
    res.json({ success: true, message: 'Attendance saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/attendance/submitted', async (req, res) => {
  const { dateKey, submitted = true } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO owner_config (config_key, config_value)
            VALUES (?, ?)
            ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value`,
      args: [`attendance_submitted_${dateKey}`, submitted ? 'true' : 'false']
    });
    res.json({ success: true, message: 'Attendance lock saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/attendance/submitted/:dateKey', async (req, res) => {
  try {
    await executeWithRetry({
      sql: 'DELETE FROM owner_config WHERE config_key = ?',
      args: [`attendance_submitted_${req.params.dateKey}`]
    });
    res.json({ success: true, message: 'Attendance lock removed!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Salary Advances and Payments
app.get('/api/salary-advances', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM salary_advances ORDER BY date DESC');
    const advances = result.rows.map((row) => ({
      id: row.id,
      staffId: row.staff_id,
      amount: Number(row.amount),
      notes: row.notes || '',
      date: row.date
    }));
    res.json({ success: true, advances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/salary-advances', async (req, res) => {
  const { id, staffId, amount, notes, date } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO salary_advances (id, staff_id, amount, notes, date)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              staff_id = excluded.staff_id,
              amount = excluded.amount,
              notes = excluded.notes,
              date = excluded.date`,
      args: [id, staffId, Number(amount || 0), notes || '', date || new Date().toISOString()]
    });
    res.json({ success: true, message: 'Salary advance saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/salary-payments', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM salary_payments ORDER BY paid_date DESC');
    const salaryPayments = {};
    result.rows.forEach((row) => {
      salaryPayments[`${row.month_key}_${row.staff_id}`] = {
        amount: Number(row.amount),
        paidAt: row.paid_date
      };
    });
    res.json({ success: true, salaryPayments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/salary-payments', async (req, res) => {
  const { staffId, amount, monthKey, paidAt } = req.body;
  const paidDate = paidAt || new Date().toISOString();
  try {
    await executeWithRetry({
      sql: `INSERT INTO salary_payments (id, staff_id, month_key, amount, paid_date)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              staff_id = excluded.staff_id,
              month_key = excluded.month_key,
              amount = excluded.amount,
              paid_date = excluded.paid_date`,
      args: [`${monthKey}_${staffId}`, staffId, monthKey, Number(amount || 0), paidDate]
    });
    res.json({ success: true, message: 'Salary payment saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Custom Tables
app.get('/api/custom-tables', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT table_name FROM custom_tables ORDER BY created_at ASC');
    res.json({ success: true, customTables: result.rows.map((row) => row.table_name) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/custom-tables', async (req, res) => {
  const { tableName } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO custom_tables (table_name, created_at)
            VALUES (?, ?)
            ON CONFLICT(table_name) DO UPDATE SET table_name = excluded.table_name`,
      args: [tableName, new Date().toISOString()]
    });
    res.json({ success: true, message: 'Custom table saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/custom-tables/:tableName', async (req, res) => {
  try {
    await executeWithRetry({
      sql: 'DELETE FROM custom_tables WHERE table_name = ?',
      args: [decodeURIComponent(req.params.tableName)]
    });
    res.json({ success: true, message: 'Custom table removed!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Menu Categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM categories ORDER BY id');
    const categories = result.rows.map((row) => ({
      id: row.id,
      nameMr: row.name_mr,
      nameEn: row.name_en,
      icon: row.icon,
      color: row.color
    }));
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. Hotel Rules
app.get('/api/hotel-rules', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM hotel_rules ORDER BY id');
    const rules = result.rows.map((row) => ({
      id: row.id,
      mr: row.mr,
      en: row.en
    }));
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 14. Udhar Settlement Ledger
app.get('/api/udhar-ledger', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM udhar_ledger ORDER BY settled_at DESC');
    const ledger = result.rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      amount: Number(row.amount),
      paymentMethod: row.payment_method,
      settledAt: row.settled_at
    }));
    res.json({ success: true, ledger });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/udhar-ledger', async (req, res) => {
  const { id, orderId, customerName, customerPhone, amount, paymentMethod, settledAt } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO udhar_ledger (id, order_id, customer_name, customer_phone, amount, payment_method, settled_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              order_id = excluded.order_id,
              customer_name = excluded.customer_name,
              customer_phone = excluded.customer_phone,
              amount = excluded.amount,
              payment_method = excluded.payment_method,
              settled_at = excluded.settled_at`,
      args: [
        id || `${orderId}_${settledAt || Date.now()}`,
        orderId,
        customerName || '',
        customerPhone || '',
        Number(amount || 0),
        paymentMethod || 'Cash',
        settledAt || new Date().toISOString()
      ]
    });
    res.json({ success: true, message: 'Udhar ledger saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/udhar-ledger/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    await executeWithRetry({
      sql: 'DELETE FROM udhar_ledger WHERE order_id = ? OR id = ?',
      args: [orderId, orderId]
    });
    res.json({ success: true, message: 'Udhar record removed from DB!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15. End-of-Day Reports
app.get('/api/eod-reports', async (req, res) => {
  try {
    const result = await executeWithRetry('SELECT * FROM eod_reports ORDER BY closed_at DESC');
    const reports = result.rows.map((row) => ({
      id: row.id,
      dateKey: row.date_key,
      totalRevenue: Number(row.total_revenue),
      totalOrders: Number(row.total_orders),
      cashTotal: Number(row.cash_total),
      upiTotal: Number(row.upi_total),
      udharTotal: Number(row.udhar_total),
      vegCount: Number(row.veg_count || 0),
      nonVegCount: Number(row.non_veg_count || 0),
      thaliCount: Number(row.thali_count || 0),
      plateCount: Number(row.plate_count || 0),
      extrasCount: Number(row.extras_count || 0),
      parcelCount: Number(row.parcel_count || 0),
      parcelTotal: Number(row.parcel_total || 0),
      topDishes: safeJsonParse(row.top_dishes, []),
      closedAt: row.closed_at
    }));
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/eod-reports', async (req, res) => {
  const { id, dateKey, totalRevenue, totalOrders, cashTotal, upiTotal, udharTotal, vegCount, nonVegCount, thaliCount, plateCount, extrasCount, parcelCount, parcelTotal, topDishes, closedAt } = req.body;
  try {
    await executeWithRetry({
      sql: `INSERT INTO eod_reports (id, date_key, total_revenue, total_orders, cash_total, upi_total, udhar_total, veg_count, non_veg_count, thali_count, plate_count, extras_count, parcel_count, parcel_total, top_dishes, closed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              date_key = excluded.date_key,
              total_revenue = excluded.total_revenue,
              total_orders = excluded.total_orders,
              cash_total = excluded.cash_total,
              upi_total = excluded.upi_total,
              udhar_total = excluded.udhar_total,
              veg_count = excluded.veg_count,
              non_veg_count = excluded.non_veg_count,
              thali_count = excluded.thali_count,
              plate_count = excluded.plate_count,
              extras_count = excluded.extras_count,
              parcel_count = excluded.parcel_count,
              parcel_total = excluded.parcel_total,
              top_dishes = excluded.top_dishes,
              closed_at = excluded.closed_at`,
      args: [
        id || `eod-${dateKey || new Date().toISOString().split('T')[0]}`,
        dateKey || new Date().toISOString().split('T')[0],
        Number(totalRevenue || 0),
        Number(totalOrders || 0),
        Number(cashTotal || 0),
        Number(upiTotal || 0),
        Number(udharTotal || 0),
        Number(vegCount || 0),
        Number(nonVegCount || 0),
        Number(thaliCount || 0),
        Number(plateCount || 0),
        Number(extrasCount || 0),
        Number(parcelCount || 0),
        Number(parcelTotal || 0),
        JSON.stringify(topDishes || []),
        closedAt || new Date().toISOString()
      ]
    });
    res.json({ success: true, message: 'EOD report saved!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

import fs from 'fs';

// Save & Update SMTP Credentials Endpoint (Directly from UI)
app.post('/api/save-smtp-config', async (req, res) => {
  const { smtpUser, smtpPass, ownerEmail } = req.body;

  try {
    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ success: false, message: '❌ Gmail ID व १६-अंकी App Password आवश्यक आहे!' });
    }

    const cleanPass = smtpPass.replace(/\s+/g, '').trim();
    const cleanUser = smtpUser.trim();
    const cleanOwnerEmail = (ownerEmail || cleanUser).trim();

    process.env.SMTP_USER = cleanUser;
    process.env.SMTP_PASS = cleanPass;
    process.env.VITE_OWNER_EMAIL = cleanOwnerEmail;

    // Update .env file on disk
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    const updateOrAddKey = (content, key, val) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${val}`);
      }
      return content + `\n${key}=${val}`;
    };

    envContent = updateOrAddKey(envContent, 'SMTP_USER', cleanUser);
    envContent = updateOrAddKey(envContent, 'SMTP_PASS', cleanPass);
    envContent = updateOrAddKey(envContent, 'VITE_OWNER_EMAIL', cleanOwnerEmail);

    fs.writeFileSync(envPath, envContent, 'utf8');

    // Verify SMTP connection immediately
    let transporter = createTransporter(false);
    try {
      await transporter.verify();
    } catch (err465) {
      transporter = createTransporter(true);
      await transporter.verify();
    }

    res.json({
      success: true,
      message: '✅ SMTP Credentials सेव्ह & व्हेरीफाय झाले!',
      user: cleanUser
    });
  } catch (error) {
    console.error('Save SMTP Error:', error.message);
    const isBadCredentials = error.message?.includes('535-5.7.8') || error.message?.includes('BadCredentials');
    res.status(500).json({
      success: false,
      message: isBadCredentials ? '❌ Google App Password अमान्य आहे! (Bad Credentials)' : '❌ SMTP सेव्ह व्हेरीफिकेशन अयशस्वी',
      error: error.message,
      guide: 'कृपया https://myaccount.google.com/apppasswords वरून 16-character App Password तयार करा.'
    });
  }
});

// Verify SMTP Connection Endpoint
app.get('/api/verify-smtp', async (req, res) => {
  try {
    let transporter = createTransporter(false);
    try {
      await transporter.verify();
    } catch (err465) {
      transporter = createTransporter(true);
      await transporter.verify();
    }

    res.json({
      success: true,
      message: '✅ Google SMTP कनेक्शन यशस्वीरित्या व्हेरीफाय झाले!',
      user: process.env.SMTP_USER || process.env.VITE_OWNER_EMAIL
    });
  } catch (error) {
    console.error('SMTP Verification Error:', error.message);
    const isBadCredentials = error.message?.includes('535-5.7.8') || error.message?.includes('BadCredentials');
    res.status(500).json({
      success: false,
      message: isBadCredentials ? '❌ Google SMTP पासवर्ड अमान्य आहे! (Invalid App Password)' : '❌ SMTP Verification Failed',
      error: error.message,
      guide: isBadCredentials ? 'गूगलने नियमित पासवर्ड बंद केला आहे. कृपया https://myaccount.google.com/apppasswords वरून १६-अंकी App Password तयार करा.' : 'नेटवर्क तपासा.'
    });
  }
});

// Send EOD Sales HTML Email Endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, htmlBody, textBody } = req.body;

  try {
    let transporter = createTransporter(false);
    try {
      await transporter.verify();
    } catch (err465) {
      transporter = createTransporter(true);
      await transporter.verify();
    }

    const rawTo = to || process.env.VITE_OWNER_EMAIL || process.env.SMTP_USER || '';
    const recipientList = Array.isArray(rawTo)
      ? rawTo
      : rawTo.split(',').map((e) => e.trim()).filter(Boolean);

    const info = await transporter.sendMail({
      from: `"हॉटेल आराध्या डायनिंग POS" <${process.env.SMTP_USER || process.env.VITE_OWNER_EMAIL}>`,
      to: recipientList,
      subject: subject || '🚩 [हॉटेल आराध्या] दैनिक विक्री अहवाल',
      text: textBody,
      html: htmlBody
    });

    console.log('✅ SMTP Email Sent Successfully to', recipientList.join(', '), '. Message ID:', info.messageId);

    res.json({
      success: true,
      message: '✅ Verified Real-World SMTP Email Sent Successfully!',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('❌ Failed to Send SMTP Email:', error.message);
    const isBadCredentials = error.message?.includes('535-5.7.8') || error.message?.includes('BadCredentials');
    res.status(500).json({
      success: false,
      message: isBadCredentials ? '❌ Google SMTP पासवर्ड अमान्य आहे! (Invalid App Password)' : '❌ Failed to Send Verified Email via SMTP',
      error: error.message,
      guide: isBadCredentials ? 'कृपया Google २-Step Verification ऑन करा आणि https://myaccount.google.com/apppasswords वरून 16-character App Password तयार करा.' : ''
    });
  }
});

// 404 Fallback JSON Handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: `API route '${req.originalUrl}' not found.` });
  }
  next();
});

const startServer = async () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🚀 Turso DB & SMTP Express Server Running on Port ${PORT}`);
    console.log(`📧 SMTP Verification URL: http://localhost:${PORT}/api/verify-smtp`);
    console.log(`=================================================`);
  });
  initDb().catch((err) => {
    console.error('⚠️ DB Init Warning:', err.message);
  });
  // Keep Node.js process alive indefinitely
  setInterval(() => {}, 1000 * 60 * 60);
};

if (process.env.VERCEL === '1') {
  initDb().catch((error) => {
    console.error('Database initialization failed on Vercel:', error.message);
  });
} else {
  startServer();
}

export default app;
