import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    const cols = await query(`
      SELECT P.person_id, P.name, P.phone, P.base_location, MS.specialization, MS.since_date
      FROM MEDICAL_STAFF MS
      JOIN PERSONNEL P ON MS.person_id = P.person_id
      ORDER BY P.name
    `);
    console.log('Success Medical:', cols.length);
  } catch (e: any) {
    console.error('Error:', e.message);
  }

  try {
    const cols2 = await query(`
      SELECT P.person_id, P.name, P.phone, P.base_location,
             NVL(V.availability_status, 'Available') AS availability_status,
             V.skill,
             (SELECT S.shelter_name FROM DEPLOYED_AT DA
              JOIN SHELTER S ON DA.shelter_id = S.shelter_id
              WHERE DA.person_id = P.person_id AND ROWNUM = 1) AS deployed_shelter_name
      FROM VOLUNTEER V
      JOIN PERSONNEL P ON V.person_id = P.person_id
      ORDER BY P.name
    `);
    console.log('Success Volunteers:', cols2.length);
  } catch (e: any) {
    console.error('Error Volunteers:', e.message);
  }

  process.exit(0);
}
run();
