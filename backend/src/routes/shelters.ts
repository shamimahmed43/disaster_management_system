import oracledb from 'oracledb';
import { Router } from 'express';
import { query, getConnection } from '../config/db';
import { requireRole, requireAnyAuth, requireVictimOwnership } from '../middleware/auth';

const router = Router();

// GET /api/shelters/alerts - Task 2: Procedure with Cursor & Exception Handling
router.get('/alerts', requireRole(['admin', 'staff']), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `BEGIN sp_get_shelter_alerts(:cursor); END;`,
      {
        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const resultSet = (result.outBinds as any)?.cursor;
    const rows = [];
    let row;
    while ((row = await resultSet.getRow())) {
      // Row is returned as an array or object depending on outFormat. By default it's an array if outFormat is ARRAY, but we can assume array or object. Let's map it.
      // Usually outFormat = oracledb.OUT_FORMAT_OBJECT is set globally in this project's db.ts
      rows.push(row);
    }
    await resultSet.close();
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch shelter alerts';
    res.status(500).json({ error: msg });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) {}
    }
  }
});

// POST /api/shelters/checkin
router.post('/checkin', requireRole(['admin', 'staff']), async (req, res) => {
  const { victim_id, shelter_id, checkin_date } = req.body;
  if (!victim_id || !shelter_id) return res.status(422).json({ error: 'Missing required fields' });
  try {
    const date = checkin_date || new Date().toISOString().slice(0, 10);
    await query(
      `INSERT INTO RESIDES_IN (victim_id, shelter_id, checkin_date)
       VALUES (:victim_id, :shelter_id, TO_DATE(:checkin_date, 'YYYY-MM-DD'))`,
      [victim_id, shelter_id, date]
    );
    res.status(201).json({ message: 'Victim checked in', victim_id, shelter_id });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Victim already checked into this shelter' });
    res.status(500).json({ error: 'Failed to check in victim' });
  }
});

// POST /api/shelters/checkout
router.post('/checkout', requireRole(['admin', 'staff']), async (req, res) => {
  const { victim_id, shelter_id, checkout_date } = req.body;
  if (!victim_id || !shelter_id) return res.status(422).json({ error: 'Missing required fields' });
  try {
    const date = checkout_date || new Date().toISOString().slice(0, 10);
    await query(
      `UPDATE RESIDES_IN
       SET checkout_date = TO_DATE(:checkout_date, 'YYYY-MM-DD')
       WHERE victim_id = :victim_id AND shelter_id = :shelter_id AND checkout_date IS NULL`,
      [date, victim_id, shelter_id]
    );
    res.json({ message: 'Victim checked out' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check out victim' });
  }
});

// GET /api/shelters/stays/:victim_id
router.get('/stays/:victim_id', requireVictimOwnership, async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        R.victim_id,
        R.shelter_id,
        R.checkin_date,
        R.checkout_date,
        S.shelter_name,
        S.current_status,
        S.address_line,
        S.contact_person_name,
        S.latitude,
        S.longitude
      FROM RESIDES_IN R
      JOIN SHELTER S ON R.shelter_id = S.shelter_id
      WHERE R.victim_id = :victim_id
      ORDER BY R.checkin_date DESC
    `, [req.params.victim_id]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shelter stays' });
  }
});

// GET /api/shelters
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
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
        (SH.capacity - COUNT(R.victim_id)) AS available_capacity
      FROM SHELTER SH
      LEFT JOIN RESIDES_IN R ON SH.shelter_id = R.shelter_id AND R.checkout_date IS NULL
      GROUP BY
        SH.shelter_id, SH.shelter_name, SH.current_status,
        SH.contact_person_name, SH.contact_person_phone, SH.address_line, SH.longitude, SH.latitude,
        SH.capacity, SH.disaster_name
      ORDER BY SH.shelter_name
    `);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch shelters';
    res.status(500).json({ error: msg });
  }
});

// GET /api/shelters/:id
router.get('/:id', async (req, res) => {
  try {
    const [shelter] = await query(
      `SELECT SH.shelter_id, SH.shelter_name, SH.current_status AS shelter_status, SH.current_status AS current_status,
              SH.contact_person_name, SH.contact_person_phone, SH.address_line,
              SH.longitude, SH.latitude, SH.capacity, SH.disaster_name,
              (SH.capacity - NVL((SELECT COUNT(*) FROM RESIDES_IN R WHERE R.shelter_id = SH.shelter_id AND R.checkout_date IS NULL), 0)) AS available_capacity
       FROM SHELTER SH
       WHERE SH.shelter_id = :id`,
      [req.params.id]
    );
    if (!shelter) return res.status(404).json({ error: 'Shelter not found' });

    const victims = await query(
      `SELECT V.victim_id, V.household_head_name, R.checkin_date
       FROM RESIDES_IN R
       JOIN VICTIM V ON R.victim_id = V.victim_id
       WHERE R.shelter_id = :id AND R.checkout_date IS NULL
       ORDER BY R.checkin_date`,
      [req.params.id]
    );

    res.json({ data: { ...shelter, current_victims: victims } });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch shelter';
    res.status(500).json({ error: msg });
  }
});

// POST /api/shelters
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const {
    shelter_id,
    shelter_name,
    shelter_status,
    current_status,
    contact_person_name,
    manager_name,
    contact_person_phone,
    manager_phone,
    address_line,
    location,
    longitude,
    latitude,
    capacity,
    disaster_name
  } = req.body;

  const id = shelter_id ? String(shelter_id).trim() : '';
  const name = shelter_name ? String(shelter_name).trim() : '';
  const address = (address_line || location) ? String(address_line || location).trim() : null;
  const manager = (contact_person_name || manager_name) ? String(contact_person_name || manager_name).trim() : null;
  const phone = (contact_person_phone || manager_phone) ? String(contact_person_phone || manager_phone).trim() : null;
  const cap = Number(capacity);
  
  let status = (shelter_status || current_status || 'Open').trim();
  const validStatuses = ['Open', 'Full', 'Closed'];
  if (!validStatuses.includes(status)) {
    status = 'Open';
  }

  const lat = latitude ? String(latitude).trim() : '0';
  const lng = longitude ? String(longitude).trim() : '0';

  if (!id || !name || !address || !capacity) {
    return res.status(422).json({ error: 'Shelter ID, Shelter Name, Location/Address, and Capacity are required' });
  }

  if (isNaN(cap) || cap <= 0) {
    return res.status(422).json({ error: 'Capacity must be a positive number' });
  }

  try {
    let validDisaster: string | null = null;
    if (disaster_name) {
      const match = await query<any>(
        `SELECT disaster_name FROM DISASTER_EVENT WHERE LOWER(disaster_name) = LOWER(:dname)`,
        [String(disaster_name).trim()]
      );
      if (match && match.length > 0) {
        validDisaster = match[0].DISASTER_NAME;
      }
    }
    if (!validDisaster) {
      const activeRows = await query<any>(
        `SELECT disaster_name FROM DISASTER_EVENT WHERE end_date IS NULL ORDER BY start_date DESC`
      );
      if (activeRows && activeRows.length > 0) {
        validDisaster = activeRows[0].DISASTER_NAME;
      } else {
        const anyRows = await query<any>(
          `SELECT disaster_name FROM DISASTER_EVENT ORDER BY start_date DESC`
        );
        if (anyRows && anyRows.length > 0) {
          validDisaster = anyRows[0].DISASTER_NAME;
        }
      }
    }

    if (!validDisaster) {
      return res.status(422).json({ error: 'No active disaster event found to associate the shelter with.' });
    }

    await query(
      `INSERT INTO SHELTER (shelter_id, shelter_name, current_status, contact_person_name, contact_person_phone, address_line, longitude, latitude, capacity, disaster_name, geo_location)
       VALUES (:shelter_id, :shelter_name, :shelter_status, :contact_person_name, :contact_person_phone, :address_line, :longitude, :latitude, :capacity, :disaster_name, LOCATION_T(NVL(:latitude, '0'), NVL(:longitude, '0'), NVL(:address_line, 'N/A')))`,
      [id, name, status, manager, phone, address, lng, lat, cap, validDisaster, lat, lng, address || 'N/A']
    );

    res.status(201).json({
      message: 'Shelter registered successfully',
      data: { shelter_id: id, shelter_name: name }
    });
  } catch (err: any) {
    console.error('[Shelters] POST error:', err);
    if (err.errorNum === 1 || (err.message && err.message.includes('ORA-00001'))) {
      return res.status(409).json({ error: `Shelter ID "${id}" already exists.` });
    }
    if (err.errorNum === 2291 || (err.message && err.message.includes('ORA-02291'))) {
      return res.status(422).json({ error: 'Selected disaster event is not valid.' });
    }
    const msg = err.message || 'Failed to create shelter.';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/shelters/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { contact_person_name, contact_person_phone, capacity, shelter_status } = req.body;
  const shelter_id = req.params.id;

  try {
    await query(
      `UPDATE SHELTER 
       SET contact_person_name = NVL(:contact_person_name, contact_person_name),
           contact_person_phone = NVL(:contact_person_phone, contact_person_phone),
           capacity = NVL(:capacity, capacity),
           current_status = NVL(:shelter_status, current_status)
       WHERE shelter_id = :shelter_id`,
      [contact_person_name || null, contact_person_phone || null, capacity || null, shelter_status || null, shelter_id]
    );
    res.json({ message: 'Shelter updated successfully.' });
  } catch (err) {
    console.error('[Shelters] PUT error:', err);
    res.status(500).json({ error: 'Failed to update shelter.' });
  }
});

export default router;
