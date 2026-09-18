import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  
  try {
    await query('DROP TRIGGER trg_volunteer_status_update');
    console.log('Dropped trg_volunteer_status_update');
  } catch (e) {}

  await query(`
    CREATE OR REPLACE TRIGGER trg_volunteer_status_update
    AFTER INSERT OR UPDATE OR DELETE ON DEPLOYED_AT
    DECLARE
      PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
      UPDATE VOLUNTEER v
      SET availability_status = CASE
        WHEN EXISTS (SELECT 1 FROM DEPLOYED_AT d WHERE d.person_id = v.person_id) THEN 'Deployed'
        ELSE 'Available'
      END;
      COMMIT;
    END;
  `);
  console.log('Created trg_volunteer_status_update');

  try {
    await query('DROP TRIGGER trg_shelter_status_update');
    console.log('Dropped trg_shelter_status_update');
  } catch (e) {}

  await query(`
    CREATE OR REPLACE TRIGGER trg_shelter_status_update
    AFTER INSERT OR UPDATE OR DELETE ON RESIDES_IN
    DECLARE
      PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
      UPDATE SHELTER s
      SET shelter_status = CASE
        WHEN s.capacity <= (SELECT COUNT(*) FROM RESIDES_IN r WHERE r.shelter_id = s.shelter_id AND r.checkout_date IS NULL) THEN 'Full'
        ELSE 'Open'
      END;
      COMMIT;
    END;
  `);
  console.log('Created trg_shelter_status_update');

  console.log('Fixed triggers successfully');
  process.exit(0);
}

run();
