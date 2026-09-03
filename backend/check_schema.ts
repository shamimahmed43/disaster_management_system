import { query, initDB } from './src/config/db';

async function checkSchema() {
  try {
    await initDB();
    const res = await query("SELECT column_name FROM user_tab_columns WHERE table_name = 'DISASTER_EVENT'");
    console.log("DISASTER_EVENT columns:", res);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkSchema();
