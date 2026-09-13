import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Oracle connection pool
let pool: oracledb.Pool | null = null;
let dbConnected = false;

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool || !dbConnected) {
    throw new Error('Database not connected. Start Oracle DB and restart backend.');
  }
  return await pool.getConnection();
}

export async function initDB(): Promise<void> {
  try {
    try {
      oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
      console.log('✅ Oracle DB thick mode enabled.');
    } catch (e) {
      console.log('⚠️ Could not enable thick mode, using thin mode.', e);
    }
    
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
    dbConnected = true;
    console.log('✅ Oracle DB connection pool created successfully.');
    await ensureSchemaUpdates();
  } catch (err) {


    // Graceful degradation: log error but DO NOT exit.
    // Backend will start normally; all DB routes will return 503.
    console.error('⚠️  Oracle DB connection failed. Backend running without DB.', err);
    console.error('   → Set DB_USER, DB_PASSWORD, DB_CONNECTION_STRING in backend/.env');
    console.error('   → All API routes will return 503 until DB is connected.');
    dbConnected = false;
  }
}

export function isDBConnected(): boolean {
  return dbConnected;
}

// Execute a SQL query with optional bind parameters
// Returns empty array [] if DB is not connected (graceful degradation)
export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = [],
  options: oracledb.ExecuteOptions = {}
): Promise<T[]> {
  if (!pool || !dbConnected) {
    throw new Error('Database not connected. Start Oracle DB and restart backend.');
  }
  let conn: oracledb.Connection | undefined;
  try {
    conn = await pool.getConnection();
    const result = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });
    return (result.rows as T[]) ?? [];
  } catch (err) {
    console.error('[DB Query Error]', err);
    throw err;
  } finally {
    if (conn) {
      try { await conn.close(); } catch (_) {}
    }
  }
}

// Execute INSERT/UPDATE/DELETE (returns rowsAffected)
export async function execute(
  sql: string,
  binds: oracledb.BindParameters = []
): Promise<number> {
  if (!pool || !dbConnected) {
    throw new Error('Database not connected. Start Oracle DB and restart backend.');
  }
  let conn: oracledb.Connection | undefined;
  try {
    conn = await pool.getConnection();
    const result = await conn.execute(sql, binds, { autoCommit: true });
    return result.rowsAffected ?? 0;
  } catch (err) {
    console.error('[DB Execute Error]', err);
    throw err;
  } finally {
    if (conn) {
      try { await conn.close(); } catch (_) {}
    }
  }
}

async function ensureSchemaUpdates(): Promise<void> {
  // 1. Ensure PURPOSE column exists in DONATION table
  try {
    const cols = await query<{ COLUMN_NAME: string }>(
      `SELECT column_name FROM user_tab_columns WHERE table_name = 'DONATION' AND column_name = 'PURPOSE'`
    );
    if (cols.length === 0) {
      await query(`ALTER TABLE DONATION ADD (purpose VARCHAR2(200))`);
      console.log('✅ Added PURPOSE column to DONATION table.');
    }
  } catch (err: any) {
    // Ignore
  }

  // 2. Ensure DONATION_SUPPLY table exists
  try {
    const tabs = await query<{ TABLE_NAME: string }>(
      `SELECT table_name FROM user_tables WHERE table_name = 'DONATION_SUPPLY'`
    );
    if (tabs.length === 0) {
      await query(`
        CREATE TABLE DONATION_SUPPLY (
          supply_id        VARCHAR2(50) PRIMARY KEY,
          donation_id      VARCHAR2(50) NOT NULL,
          warehouse_id     VARCHAR2(50) NOT NULL,
          supplied_amount  NUMBER NOT NULL,
          supply_date      DATE NOT NULL,
          item_details     VARCHAR2(255),
          FOREIGN KEY (donation_id) REFERENCES DONATION(donation_id),
          FOREIGN KEY (warehouse_id) REFERENCES WAREHOUSE(warehouse_id)
        )
      `);
      console.log('✅ DONATION_SUPPLY table created.');
    }
  } catch (err: any) {
    // Ignore
  }

  // 3. Backfill DONATION_SUPPLY if empty
  try {
    await query(`
      INSERT INTO DONATION_SUPPLY (supply_id, donation_id, warehouse_id, supplied_amount, supply_date, item_details)
      SELECT
        'SUP-' || donation_id,
        donation_id,
        warehouse_id,
        NVL(amount_or_value, 0),
        donation_date,
        'Initial Donation Allocation'
      FROM DONATION D
      WHERE D.warehouse_id IS NOT NULL
        AND NVL(D.amount_or_value, 0) > 0
        AND NOT EXISTS (
          SELECT 1 FROM DONATION_SUPPLY S WHERE S.donation_id = D.donation_id
        )
    `);
  } catch (err: any) {
    // Ignore
  }
}



