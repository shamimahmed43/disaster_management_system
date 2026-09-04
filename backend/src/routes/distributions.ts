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
router.get('/', async (req, res) => {
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
    return res.status(422).json({ error: 'Distribution ID, Warehouse, Personnel, and Quantity are required' });
  }

  const id = String(distribution_id).trim();
  const wId = String(warehouse_id).trim();
  const pId = String(person_id).trim();
  const qty = Number(quantity);

  if (isNaN(qty) || qty <= 0) {
    return res.status(422).json({ error: 'Quantity must be a positive number' });
  }

  const distDate = (distribution_date && String(distribution_date).trim()) ? String(distribution_date).trim() : new Date().toISOString().slice(0, 10);

  try {
    await query(
      `INSERT INTO DISTRIBUTION (distribution_id, warehouse_id, person_id, distribution_date, quantity)
       VALUES (:distribution_id, :warehouse_id, :person_id, TO_DATE(:distribution_date, 'YYYY-MM-DD'), :quantity)`,
      { distribution_id: id, warehouse_id: wId, person_id: pId, distribution_date: distDate, quantity: qty }
    );

    res.status(201).json({ message: 'Distribution recorded successfully', data: { distribution_id: id } });
  } catch (err: any) {
    console.error('[Distributions] POST error:', err);
    if (err.errorNum === 1 || (err.message && err.message.includes('ORA-00001'))) {
      return res.status(409).json({ error: `Distribution ID "${id}" already exists.` });
    }
    if (err.errorNum === 2291 || (err.message && err.message.includes('ORA-02291'))) {
      return res.status(422).json({ error: 'Selected Warehouse or Personnel is invalid (foreign key not found).' });
    }
    const msg = err.message || 'Failed to record distribution';
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
