import { Router } from 'express';
import { query } from '../config/db';
import { requireRole, requireVictimOwnership } from '../middleware/auth';

const router = Router();

// GET /api/distributions/victim/:victim_id
router.get('/victim/:victim_id', requireVictimOwnership, async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        D.distribution_id,
        D.distribution_date,
        D.quantity,
        'Distributed' AS status,
        W.warehouse_id,
        W.warehouse_name,
        W.location AS warehouse_location
      FROM DISTRIBUTION D
      JOIN WAREHOUSE W ON D.warehouse_id = W.warehouse_id
      ORDER BY D.distribution_date DESC
    `);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch victim distributions';
    res.status(500).json({ error: msg });
  }
});

// GET /api/distributions
router.get('/', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        D.distribution_id,
        D.distribution_date,
        D.quantity,
        'Completed' AS status,
        W.warehouse_id,
        W.warehouse_name,
        P.person_id,
        P.name AS personnel_name
      FROM DISTRIBUTION D
      LEFT JOIN WAREHOUSE W ON D.warehouse_id = W.warehouse_id
      LEFT JOIN PERSONNEL P ON D.person_id = P.person_id
      ORDER BY D.distribution_date DESC
    `);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch distributions';
    res.status(500).json({ error: msg });
  }
});

// POST /api/distributions
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const { distribution_id, warehouse_id, person_id, distribution_date, quantity } = req.body;
  if (!distribution_id || !warehouse_id || !person_id || !quantity) {
    return res.status(422).json({ error: 'Missing required fields' });
  }

  const distDate = (distribution_date && distribution_date.trim()) ? distribution_date.trim() : new Date().toISOString().slice(0, 10);

  try {
    await query(
      `INSERT INTO DISTRIBUTION (distribution_id, warehouse_id, person_id, distribution_date, quantity)
       VALUES (:distribution_id, :warehouse_id, :person_id, TO_DATE(:distribution_date, 'YYYY-MM-DD'), :quantity)`,
      { distribution_id, warehouse_id, person_id, distribution_date: distDate, quantity }
    );

    res.status(201).json({ message: 'Distribution recorded', distribution_id });
  } catch (err: any) {
    console.error('[Distributions] POST error:', err);
    if (err.errorNum === 1 || (err.message && err.message.includes('ORA-00001'))) {
      return res.status(409).json({ error: 'Distribution ID already exists' });
    }
    const msg = process.env.NODE_ENV === 'development' ? err.message : (err.message || 'Failed to record distribution');
    res.status(500).json({ error: msg });
  }
});

// PUT /api/distributions/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { quantity } = req.body;
  const distribution_id = req.params.id;

  try {
    await query(
      `UPDATE DISTRIBUTION 
       SET quantity = NVL(:quantity, quantity)
       WHERE distribution_id = :distribution_id`,
      [quantity || null, distribution_id]
    );
    res.json({ message: 'Distribution updated successfully.' });
  } catch (err) {
    console.error('[Distributions] PUT error:', err);
    res.status(500).json({ error: 'Failed to update distribution.' });
  }
});

export default router;
