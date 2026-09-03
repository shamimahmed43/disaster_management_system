const oracledb = require('oracledb');
try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
  console.log('Thick mode OK');
} catch (e) {
  console.log('Thick mode ERROR:', e);
}
