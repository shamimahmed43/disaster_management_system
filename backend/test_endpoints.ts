const BASE_URL = 'http://localhost:5000/api';
const jwt = require('jsonwebtoken');

async function testApi() {
  console.log('Testing /api/health...');
  const hRes = await fetch(`${BASE_URL}/health`);
  console.log(`GET /api/health -> ${hRes.status} ${hRes.statusText}`);

  const token = jwt.sign(
    { user_id: 'USR-001', email: 'admin@dms.gov.bd', role: 'admin', name: 'System Admin' },
    'amar_dms_project_2026_super_secret_key',
    { expiresIn: '1h' }
  );

  console.log('Testing with mock admin token');

  const endpoints = [
    '/dashboard',
    '/disasters',
    '/victims',
    '/shelters',
    '/warehouses',
    '/vehicles',
    '/donations',
    '/distributions',
    '/personnel'
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${BASE_URL}${ep}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      console.log(`GET ${ep} -> ${res.status} ${res.statusText}`);
      console.log(await res.text());
    } else {
      console.log(`GET ${ep} -> ${res.status} ${res.statusText}`);
    }
  }
}

testApi();
