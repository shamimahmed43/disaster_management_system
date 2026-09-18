import { query } from './src/services/db';

async function test() {
  try {
    const result = await query("SELECT email, role FROM APP_USER");
    console.log(result);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
