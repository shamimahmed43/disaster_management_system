import { query, initDB } from './src/config/db'; async function run() { await initDB(); const rows = await query('SELECT email, role FROM APP_USER'); console.log(rows); process.exit(0); } run();  
