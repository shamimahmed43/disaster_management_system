import { initDB, execute, query } from './src/config/db';

async function runCleanup() {
  await initDB();
  
  console.log("Deleting test accounts...");
  const rowsAffected = await execute(
    "DELETE FROM APP_USER WHERE email IN ('saim151755@gmail.com', 'shamimlimon43@gmail.com')"
  );
  
  console.log(`Deleted ${rowsAffected} test accounts.`);

  const remainingAdmins = await query("SELECT user_id, email, full_name, role FROM APP_USER WHERE role IN ('admin', 'pending', 'staff')");
  console.log("Remaining admins/staff:");
  console.log(JSON.stringify(remainingAdmins, null, 2));

  process.exit(0);
}

runCleanup();
