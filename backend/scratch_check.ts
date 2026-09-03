import { initDB, query } from './src/config/db';

async function run() {
  await initDB();

  const tables = ['SHELTER', 'VICTIM', 'DISASTER_EVENT', 'VEHICLE', 'DONATION', 'RESIDES_IN', 'DISTRIBUTION', 'VOLUNTEER'];
  for (const t of tables) {
    const cols = await query(`SELECT column_name, data_type, data_length, nullable FROM user_tab_columns WHERE table_name = '${t}' ORDER BY column_id`);
    console.log(`\n=== ${t} ===`);
    cols.forEach((c: any) => console.log(`  ${c.COLUMN_NAME} ${c.DATA_TYPE}(${c.DATA_LENGTH}) ${c.NULLABLE}`));
  }
  process.exit(0);
}
run().catch(console.error);
