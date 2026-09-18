async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/internal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dms.gov.bd', password: 'Admin@2026' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed:', loginRes.status, await loginRes.text());
      return;
    }

    const setCookieHeader = loginRes.headers.get('set-cookie');
    const cookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
    
    console.log('Login successful, got cookie:', cookie);

    const endpoints = ['/api/personnel', '/api/personnel/volunteers', '/api/personnel/medical'];
    for (const ep of endpoints) {
      const res = await fetch('http://localhost:5000' + ep, {
        headers: { 'Cookie': cookie }
      });
      const json = await res.json();
      console.log('Endpoint', ep, 'status:', res.status, 'data rows:', json.data ? json.data.length : 'error');
    }
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}
run();
