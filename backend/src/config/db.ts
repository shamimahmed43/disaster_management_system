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
