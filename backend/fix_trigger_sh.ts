import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    await query(`
      CREATE OR REPLACE TRIGGER trg_shelter_status_update
      AFTER INSERT OR UPDATE OR DELETE ON RESIDES_IN
      DECLARE
        PRAGMA AUTONOMOUS_TRANSACTION;
      BEGIN
        UPDATE SHELTER s
        SET current_status = CASE
          WHEN s.capacity <= (SELECT COUNT(*) FROM RESIDES_IN r WHERE r.shelter_id = s.shelter_id AND r.checkout_date IS NULL) THEN 'Full'
          ELSE 'Open'
        END;
        COMMIT;
      END;
    `);
    console.log('Recreated trigger with current_status');
  } catch(e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
run();
