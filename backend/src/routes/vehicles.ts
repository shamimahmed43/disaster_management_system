import { Router } from 'express';
import { query } from '../config/db';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/vehicles/stats
router.get('/stats', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const [counts] = await query<{
      TOTAL: number; AVAILABLE: number; IN_TRANSIT: number; MAINTENANCE: number;
    }>(`
      SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN LOWER(availability_status) = 'available'  THEN 1 ELSE 0 END) AS AVAILABLE,
        SUM(CASE WHEN LOWER(availability_status) = 'in transit' THEN 1 ELSE 0 END) AS IN_TRANSIT,
        SUM(CASE WHEN LOWER(availability_status) = 'maintenance' THEN 1 ELSE 0 END) AS MAINTENANCE
      FROM VEHICLE
    `);
    const byType = await query(`
      SELECT vehicle_type, COUNT(*) AS cnt
      FROM VEHICLE
      GROUP BY vehicle_type
      ORDER BY cnt DESC
    `);
    res.json({ data: { counts, by_type: byType } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle stats' });
  }
});

// GET /api/vehicles
router.get('/', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT veh.vehicle_id, veh.vehicle_type, veh.registration_no, veh.capacity, veh.availability_status AS current_status,
             s.warehouse_id, w.warehouse_name
      FROM VEHICLE veh
      LEFT JOIN STATIONED_AT s ON veh.vehicle_id = s.vehicle_id
      LEFT JOIN WAREHOUSE w ON s.warehouse_id = w.warehouse_id
      ORDER BY veh.vehicle_type
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error('[Vehicles] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST /api/vehicles
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const { vehicle_id, vehicle_type, registration_no, capacity, current_status } = req.body;
  if (!vehicle_id || !vehicle_type || !registration_no) {
    return res.status(422).json({ error: 'Missing required fields' });
  }
  try {
    await query(
      `INSERT INTO VEHICLE (vehicle_id, vehicle_type, registration_no, capacity, availability_status)
       VALUES (:vehicle_id, :vehicle_type, :registration_no, :capacity, :current_status)`,
      [vehicle_id, vehicle_type, registration_no, capacity, current_status || 'Available']
    );
    res.status(201).json({ message: 'Vehicle added', vehicle_id });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Vehicle or registration already exists' });
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { current_status, capacity } = req.body;
  const vehicle_id = req.params.id;

  try {
    await query(
      `UPDATE VEHICLE 
       SET availability_status = NVL(:current_status, availability_status),
           capacity = NVL(:capacity, capacity)
       WHERE vehicle_id = :vehicle_id`,
      [current_status || null, capacity || null, vehicle_id]
    );
    res.json({ message: 'Vehicle updated successfully.' });
  } catch (err) {
    console.error('[Vehicles] PUT error:', err);
    res.status(500).json({ error: 'Failed to update vehicle.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/vehicles/station
// Assign vehicle to a warehouse
// ─────────────────────────────────────────────
router.post('/station', requireRole(['admin', 'staff']), async (req, res) => {
  const { vehicle_id, warehouse_id } = req.body;
  if (!vehicle_id || !warehouse_id) return res.status(422).json({ error: 'vehicle_id and warehouse_id are required' });

  try {
    // Check if already stationed somewhere
    const existing = await query(`SELECT 1 FROM STATIONED_AT WHERE vehicle_id = :1`, [vehicle_id]);
    if (existing.length > 0) {
      // Update existing stationing
      await query(`UPDATE STATIONED_AT SET warehouse_id = :1 WHERE vehicle_id = :2`, [warehouse_id, vehicle_id]);
    } else {
      // Insert new stationing
      await query(`INSERT INTO STATIONED_AT (warehouse_id, vehicle_id) VALUES (:1, :2)`, [warehouse_id, vehicle_id]);
    }
    res.status(200).json({ message: 'Vehicle stationed successfully.' });
  } catch (err) {
    console.error('[Vehicles] Station error:', err);
    res.status(500).json({ error: 'Failed to station vehicle.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/vehicles/station
// Unassign vehicle from warehouse
// ─────────────────────────────────────────────
router.delete('/station', requireRole(['admin', 'staff']), async (req, res) => {
  const { vehicle_id } = req.body;
  if (!vehicle_id) return res.status(422).json({ error: 'vehicle_id is required' });

  try {
    await query(`DELETE FROM STATIONED_AT WHERE vehicle_id = :1`, [vehicle_id]);
    res.json({ message: 'Vehicle unstationed successfully.' });
  } catch (err) {
    console.error('[Vehicles] Unstation error:', err);
    res.status(500).json({ error: 'Failed to unstation vehicle.' });
  }
});

export default router;
