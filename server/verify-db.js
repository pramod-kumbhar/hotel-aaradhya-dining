import { initDb, executeWithRetry } from './db.js';

async function main() {
  console.log('🚀 Starting Turso DB Table Creation & Audit...');
  await initDb();

  const res = await executeWithRetry("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  console.log('\n=============================================');
  console.log('🎉 LIVE TURSO CLOUD DB TABLE AUDIT REPORT (Count:', res.rows.length, '):');
  res.rows.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.name}`);
  });
  console.log('=============================================\n');

  const tables = ['orders', 'staff', 'attendance', 'salary_advances', 'owner_config', 'salary_payments', 'menu_items', 'categories', 'hotel_rules', 'custom_tables', 'udhar_ledger', 'eod_reports'];
  for (const t of tables) {
    try {
      const countRes = await executeWithRetry(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`✅ Table '${t}': OK (${countRes.rows[0].cnt} records)`);
    } catch (e) {
      console.error(`❌ Table '${t}' query error:`, e.message);
    }
  }
}

main().catch(console.error);
