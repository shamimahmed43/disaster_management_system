import { initDB, query } from './src/config/db';

async function investigate() {
  await initDB();
  const admins = await query("SELECT user_id, email, full_name, role, person_id FROM APP_USER WHERE role IN ('admin', 'pending', 'staff')");
  console.log("Found admins/staff/pending:");
  console.log(JSON.stringify(admins, null, 2));

  // Check related personnel if any
  for (const admin of admins as any[]) {
    if (admin.PERSON_ID) {
      const person = await query("SELECT * FROM PERSONNEL WHERE person_id = :id", [admin.PERSON_ID]);
      console.log(`Personnel details for ${admin.PERSON_ID}:`);
      console.log(JSON.stringify(person, null, 2));
    }
  }

  process.exit(0);
}

investigate();
