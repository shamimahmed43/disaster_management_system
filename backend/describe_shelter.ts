import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    const cols = await query("SELECT column_name FROM user_tab_columns WHERE table_name = 'SHELTER'");
    console.log('Columns in SHELTER:', cols);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
run();
