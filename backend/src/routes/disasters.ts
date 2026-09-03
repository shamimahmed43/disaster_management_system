import { Router } from 'express';
import { query } from '../config/db';
import { requireAnyAuth, requireRole } from '../middleware/auth';

const router = Router();

function safeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  return dateStr.trim();
}

// GET /api/disasters
router.get('/', async (req, res) => {
  try {
    const { type, division, search } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: any[] = [];

    if (type && type !== 'all') {
      conditions.push(`disaster_type = :type`);
      params.push(type);
    }
    if (division && division !== 'all') {
      conditions.push(`division = :division`);
      params.push(division);
    }
    if (search) {
      conditions.push(`(LOWER(disaster_name) LIKE :search1 OR LOWER(division) LIKE :search2 OR LOWER(district) LIKE :search3)`);
      const s = `%${search.toLowerCase()}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`
      SELECT
        disaster_name,
        disaster_type,
        division,
        district,
        start_date,
        end_date,
        CASE WHEN end_date IS NOT NULL AND end_date < SYSDATE THEN 'Resolved' ELSE 'Active' END AS status,
        (end_date - start_date) AS duration_days
      FROM DISASTER_EVENT
      ${whereClause}
      ORDER BY start_date DESC
    `, params);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch disasters';
    res.status(500).json({ error: msg });
  }
});

// GET /api/disasters/:name
router.get('/:name', async (req, res) => {
  try {
    const paramName = req.params.name as string;
    const name = decodeURIComponent(paramName);
    const [disaster] = await query(
      `SELECT disaster_name, disaster_type, division, district, start_date, end_date,
              CASE WHEN end_date IS NOT NULL AND end_date < SYSDATE THEN 'Resolved' ELSE 'Active' END AS status,
              (end_date - start_date) AS duration_days
       FROM DISASTER_EVENT
       WHERE disaster_name = :name`,
      [name]
    );
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });

    const [{ TOTAL_VICTIMS }] = await query<{ TOTAL_VICTIMS: number }>(
      `SELECT COUNT(victim_id) AS TOTAL_VICTIMS FROM VICTIM WHERE disaster_name = :name`,
      [name]
    );

    res.json({ data: { ...disaster, total_victims: TOTAL_VICTIMS } });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch disaster';
    res.status(500).json({ error: msg });
  }
});

// POST /api/disasters
router.post('/', requireRole(['admin']), async (req, res) => {
  const { disaster_name, disaster_type, division, district, start_date, end_date } = req.body;
  if (!disaster_name || !disaster_type || !division || !district || !start_date) {
    return res.status(422).json({ error: 'Missing required fields: disaster_name, disaster_type, division, district, start_date' });
  }

  const safeEndDate = safeDate(end_date);

  try {
    await query(
      `INSERT INTO DISASTER_EVENT (disaster_name, disaster_type, division, district, start_date, end_date)
       VALUES (
         :disaster_name, :disaster_type, :division, :district,
         TO_DATE(:start_date, 'YYYY-MM-DD'),
         CASE WHEN :end_date IS NULL THEN NULL ELSE TO_DATE(:end_date, 'YYYY-MM-DD') END
       )`,
      { disaster_name, disaster_type, division, district, start_date, end_date: safeEndDate }
    );
    res.status(201).json({ message: 'Disaster event created', disaster_name });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'A disaster with this name already exists' });
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to create disaster';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/disasters/:name
router.put('/:name', requireRole(['admin']), async (req, res) => {
  const { disaster_type, division, district, start_date, end_date } = req.body;
  const paramName = req.params.name as string;
  const name = decodeURIComponent(paramName);
  const safeEndDate = safeDate(end_date);
  
  try {
    await query(
      `UPDATE DISASTER_EVENT
       SET disaster_type = NVL(:disaster_type, disaster_type),
           division = NVL(:division, division),
           district = NVL(:district, district),
           start_date = CASE WHEN :start_date IS NULL THEN start_date ELSE TO_DATE(:start_date, 'YYYY-MM-DD') END,
           end_date = CASE WHEN :end_date IS NULL THEN end_date ELSE TO_DATE(:end_date, 'YYYY-MM-DD') END
       WHERE disaster_name = :name`,
      {
        disaster_type: disaster_type || null,
        division: division || null,
        district: district || null,
        start_date: start_date || null,
        end_date: safeEndDate,
        name
      }
    );
    res.json({ message: 'Disaster updated' });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to update disaster';
    res.status(500).json({ error: msg });
  }
});

export default router;
