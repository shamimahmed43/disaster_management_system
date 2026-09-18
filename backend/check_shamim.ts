import { query, initDB } from './src/config/db';
async function run() {
  await initDB();
  const rows = await query("SELECT email, role, full_name FROM APP_USER WHERE email = 'shamimahmed10920@gmail.com'");
  console.log(rows);
  process.exit(0);
}
run();
