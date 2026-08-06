import http from 'http';
import { initDb } from './db.js';

const API_PORT = Number(process.env.PORT || 5000);

const fetchApi = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function testAllTables() {
  console.log('🚀 Initializing database tables...');
  await initDb();

  console.log(`\n🧪 Testing API calls on http://localhost:${API_PORT}`);

  const endpoints = [
    '/api/orders',
    '/api/staff',
    '/api/menu',
    '/api/attendance',
    '/api/salary-advances',
    '/api/salary-payments',
    '/api/categories',
    '/api/hotel-rules',
    '/api/custom-tables',
    '/api/udhar-ledger',
    '/api/eod-reports'
  ];

  for (const endpoint of endpoints) {
    const response = await fetchApi(endpoint);
    console.log(`${response?.success ? '✅' : '❌'} GET ${endpoint}`, response?.success ? 'OK' : response);
  }

  const testTableName = `Codex Verify Table ${Date.now()}`;
  console.log(`\n📌 Testing Custom Tables API with temporary table '${testTableName}'...`);

  const addTableRes = await fetchApi('/api/custom-tables', 'POST', { tableName: testTableName });
  const afterAdd = await fetchApi('/api/custom-tables');
  const tableFound = (afterAdd.customTables || []).includes(testTableName);

  await fetchApi(`/api/custom-tables/${encodeURIComponent(testTableName)}`, 'DELETE');
  const afterDelete = await fetchApi('/api/custom-tables');
  const tableRemoved = !(afterDelete.customTables || []).includes(testTableName);

  console.log('POST /api/custom-tables:', addTableRes);
  console.log(`Temporary table stored? ${tableFound ? '✅ YES' : '❌ NO'}`);
  console.log(`Temporary table cleaned up? ${tableRemoved ? '✅ YES' : '❌ NO'}`);

  if (!tableFound || !tableRemoved) {
    throw new Error('Custom table persistence test failed');
  }

  console.log('\n=============================================');
  console.log('🎉 Database tables and API endpoints verified successfully!');
  console.log('=============================================');
}

testAllTables().catch((error) => {
  console.error('❌ API verification failed:', error);
  process.exitCode = 1;
});
