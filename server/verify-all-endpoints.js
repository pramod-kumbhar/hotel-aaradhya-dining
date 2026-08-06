import http from 'http';

const API_PORT = Number(process.env.PORT || 5000);

const checkEndpoint = (path) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${API_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ path, status: res.statusCode, ok: res.statusCode === 200, data });
      });
    });

    req.on('error', (err) => {
      resolve({ path, status: 'ERROR', ok: false, error: err.message });
    });
  });
};

async function verifyAllEndpoints() {
  console.log(`🚀 Testing production API endpoints on port ${API_PORT}...\n`);

  const endpoints = [
    '/api/orders',
    '/api/staff',
    '/api/menu',
    '/api/attendance',
    '/api/salary-advances',
    '/api/salary-payments',
    '/api/custom-tables',
    '/api/eod-reports',
    '/api/categories',
    '/api/hotel-rules',
    '/api/udhar-ledger'
  ];

  let passed = 0;
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    if (result.ok) {
      passed++;
      console.log(`✅ ${endpoint.padEnd(24)} -> HTTP 200 OK`);
    } else {
      console.log(`❌ ${endpoint.padEnd(24)} -> HTTP ${result.status} (${result.error || 'Failed'})`);
    }
  }

  console.log('\n=============================================');
  console.log(`🎉 Endpoint audit summary: ${passed}/${endpoints.length} endpoints operational (HTTP 200 OK)`);
  console.log('=============================================');

  if (passed !== endpoints.length) {
    process.exitCode = 1;
  }
}

verifyAllEndpoints();
