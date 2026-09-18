import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  const cols = await query("SELECT column_name FROM user_tab_columns WHERE table_name = 'MEDICAL_STAFF'");
  console.log('Columns in MEDICAL_STAFF:', cols);
  process.exit(0);
}
run();
