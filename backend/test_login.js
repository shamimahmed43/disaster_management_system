const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function test() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING
    });
    const result = await conn.execute(
      SELECT user_id, email, password_hash, full_name, role, is_verified, person_id 
       FROM APP_USER WHERE email = :email AND role != 'victim',
      ['admin@dms.gov.bd'],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(result.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}
test();
