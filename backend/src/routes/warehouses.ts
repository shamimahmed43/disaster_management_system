import { Router } from 'express';
import { query } from '../config/db';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/warehouses
router.get('/', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        W.warehouse_id,
        W.warehouse_name,
        W.location,
        W.capacity,
        W.manager_name,
        COUNT(D.donation_id) AS total_donations_stored,
        SUM(D.amount_or_value) AS total_donation_value
      FROM WAREHOUSE W
      LEFT JOIN DONATION D ON W.warehouse_id = D.warehouse_id
      GROUP BY W.warehouse_id, W.warehouse_name, W.location, W.capacity, W.manager_name
      ORDER BY W.warehouse_name
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// POST /api/warehouses
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const { warehouse_id, warehouse_name, location, capacity, manager_name } = req.body;
  if (!warehouse_id || !warehouse_name || !location || !capacity) {
    return res.status(422).json({ error: 'Missing required fields' });
  }
  try {
    await query(
      `INSERT INTO WAREHOUSE (warehouse_id, warehouse_name, location, capacity, manager_name)
       VALUES (:warehouse_id, :warehouse_name, :location, :capacity, :manager_name)`,
      [warehouse_id, warehouse_name, location, capacity, manager_name || null]
    );
    res.status(201).json({ message: 'Warehouse created', warehouse_id });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Warehouse ID already exists' });
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

// POST /api/warehouses/station
router.post('/station', requireRole(['admin', 'staff']), async (req, res) => {
  const { warehouse_id, vehicle_id } = req.body;
  if (!warehouse_id || !vehicle_id) {
    return res.status(422).json({ error: 'Missing required fields' });
  }
  try {
    await query(
      `INSERT INTO STATIONED_AT (warehouse_id, vehicle_id)
       VALUES (:warehouse_id, :vehicle_id)`,
      [warehouse_id, vehicle_id]
    );
    res.status(201).json({ message: 'Vehicle stationed at warehouse' });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Vehicle already stationed' });
    res.status(500).json({ error: 'Failed to station vehicle' });
  }
});

// PUT /api/warehouses/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { capacity, manager_name } = req.body;
  const warehouse_id = req.params.id;

  try {
    await query(
      `UPDATE WAREHOUSE 
       SET capacity = NVL(:capacity, capacity),
           manager_name = NVL(:manager_name, manager_name)
       WHERE warehouse_id = :warehouse_id`,
      [capacity || null, manager_name || null, warehouse_id]
    );
    res.json({ message: 'Warehouse updated successfully.' });
  } catch (err) {
    console.error('[Warehouses] PUT error:', err);
    res.status(500).json({ error: 'Failed to update warehouse.' });
  }
});

export default router;
