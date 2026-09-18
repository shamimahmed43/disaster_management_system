import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    const cols = await query(`
      SELECT
        E.person_id,
        E.name,
        E.phone,
        E.base_location,
        E.supervisor_id,
        M.name AS supervisor_name,
        CASE WHEN V.person_id IS NOT NULL THEN 'Volunteer'
             WHEN MS.person_id IS NOT NULL THEN 'Medical Staff'
             ELSE 'Personnel' END AS personnel_type,
        NVL(V.availability_status, 'Available') AS availability_status,
        V.skill AS volunteer_skill,
        MS.specialization AS medical_specialization,
        MS.since_date AS medical_since_date,
        (SELECT S.shelter_name FROM DEPLOYED_AT DA
         JOIN SHELTER S ON DA.shelter_id = S.shelter_id
         WHERE DA.person_id = E.person_id AND ROWNUM = 1) AS deployed_shelter_name
      FROM PERSONNEL E
      LEFT JOIN PERSONNEL M ON E.supervisor_id = M.person_id
      LEFT JOIN VOLUNTEER V ON E.person_id = V.person_id
      LEFT JOIN MEDICAL_STAFF MS ON E.person_id = MS.person_id
    `);
    console.log('Success:', cols.length);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
run();
