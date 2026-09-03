import { query } from './src/config/db';

async function testTriggers() {
  try {
    console.log('Testing trg_shelter_status_update...');

    // 1. Create a dummy disaster event
    const disasterId = `TEST-DIS-${Date.now()}`;
    await query(
      `INSERT INTO DISASTER_EVENT (disaster_id, disaster_name, disaster_type, division, district, start_date, severity_level, status)
       VALUES (:id, 'Test Disaster', 'Flood', 'Dhaka', 'Dhaka', SYSDATE, 'High', 'Active')`,
      [disasterId]
    );

    // 2. Create a dummy shelter with capacity 1
    const shelterId = `TEST-SHELTER-${Date.now()}`;
    await query(
      `INSERT INTO SHELTER (shelter_id, shelter_name, capacity, shelter_status)
       VALUES (:id, 'Test Shelter', 1, 'Open')`,
      [shelterId]
    );

    // 3. Create a dummy victim
    const victimId = `TEST-VICTIM-${Date.now()}`;
    await query(
      `INSERT INTO VICTIM (victim_id, household_head_name, disaster_id)
       VALUES (:id, 'Test Victim', :disasterId)`,
      [victimId, disasterId]
    );

    // 4. Check initial status
    let res = await query(`SELECT shelter_status FROM SHELTER WHERE shelter_id = :id`, [shelterId]);
    console.log('Initial shelter status:', res[0].SHELTER_STATUS);

    // 5. Check in the victim to the shelter (Capacity is 1, so it should become Full)
    await query(
      `INSERT INTO RESIDES_IN (victim_id, shelter_id, checkin_date)
       VALUES (:vid, :sid, SYSDATE)`,
      [victimId, shelterId]
    );

    // 6. Check updated status
    res = await query(`SELECT shelter_status FROM SHELTER WHERE shelter_id = :id`, [shelterId]);
    console.log('After check-in shelter status:', res[0].SHELTER_STATUS);

    if (res[0].SHELTER_STATUS === 'Full') {
      console.log('SUCCESS: trg_shelter_status_update is working correctly.');
    } else {
      console.error('FAILED: trg_shelter_status_update did not change status to Full.');
    }

    // Cleanup
    await query(`DELETE FROM RESIDES_IN WHERE shelter_id = :id`, [shelterId]);
    await query(`DELETE FROM VICTIM WHERE victim_id = :id`, [victimId]);
    await query(`DELETE FROM SHELTER WHERE shelter_id = :id`, [shelterId]);
    await query(`DELETE FROM DISASTER_EVENT WHERE disaster_id = :id`, [disasterId]);
    console.log('Cleanup done.');

  } catch (e) {
    console.error('Error during trigger test:', e);
  } finally {
    process.exit(0);
  }
}

testTriggers();
