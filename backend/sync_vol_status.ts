import { query, initDB, execute } from './src/config/db';

async function run() {
  await initDB();
  try {
    const rowsAffected = await execute(`
      UPDATE VOLUNTEER v
      SET availability_status = CASE
        WHEN EXISTS (SELECT 1 FROM DEPLOYED_AT d WHERE d.person_id = v.person_id) THEN 'Deployed'
        ELSE 'Available'
      END
    `);
    console.log('Updated deployed statuses for existing volunteers:', rowsAffected);
  } catch(e: any) {
    console.error('Error updating:', e.message);
  }
  process.exit(0);
}
run();
