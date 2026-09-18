import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  const cols = await query("SELECT column_name FROM user_tab_columns WHERE table_name = 'VOLUNTEER'");
  console.log('Columns in VOLUNTEER:', cols);
  process.exit(0);
}
run();
