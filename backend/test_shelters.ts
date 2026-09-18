import { query, initDB } from './src/config/db';

async function run() {
  await initDB();
  try {
    const cols = await query(`
      SELECT
        SH.shelter_id,
        SH.shelter_name,
        SH.current_status AS shelter_status,
        SH.current_status AS current_status,
        SH.contact_person_name,
        SH.contact_person_phone,
        SH.address_line,
        SH.longitude,
        SH.latitude,
        SH.capacity,
        SH.disaster_name,
        COUNT(R.victim_id) AS current_occupancy,
        (SH.capacity - COUNT(R.victim_id)) AS available_capacity,
        (SELECT COUNT(*) FROM DEPLOYED_AT DA WHERE DA.shelter_id = SH.shelter_id) AS deployed_volunteers
      FROM SHELTER SH
      LEFT JOIN RESIDES_IN R ON SH.shelter_id = R.shelter_id AND R.checkout_date IS NULL
      GROUP BY
        SH.shelter_id, SH.shelter_name, SH.current_status,
        SH.contact_person_name, SH.contact_person_phone, SH.address_line, SH.longitude, SH.latitude,
        SH.capacity, SH.disaster_name
      ORDER BY SH.shelter_name
    `);
    console.log('Success Shelters:', cols.length);
  } catch (e: any) {
    console.error('Error Shelters:', e.message);
  }
  process.exit(0);
}
run();
