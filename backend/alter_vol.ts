import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    await query('ALTER TABLE VOLUNTEER ADD (availability_status VARCHAR2(50), skill VARCHAR2(200))');
    console.log('Added columns to VOLUNTEER');
  } catch(e: any) {
    console.error('Error adding columns:', e.message);
  }
  process.exit(0);
}
run();
