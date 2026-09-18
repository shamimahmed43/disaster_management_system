import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    await query("UPDATE VOLUNTEER SET availability_status = 'Available' WHERE availability_status IS NULL");
    console.log('Updated availability_status');
  } catch(e: any) {
    console.error('Error updating:', e.message);
  }
  process.exit(0);
}
run();
