import { Router } from 'express';
import { query } from '../config/db';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/donations
router.get('/', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        D.donation_id,
        D.donor_name,
        D.donor_id,
        D.contact_info,
        D.donation_type,
        D.amount_or_value,
        D.donation_date,
        D.warehouse_id,
        W.warehouse_name
      FROM DONATION D
      JOIN WAREHOUSE W ON D.warehouse_id = W.warehouse_id
      ORDER BY D.donation_date DESC
    `);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch donations';
    res.status(500).json({ error: msg });
  }
});

// POST /api/donations
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const { donation_id, donor_name, donor_id, contact_info,
          donation_type, amount_or_value, donation_date, warehouse_id } = req.body;
  if (!donation_id || !donor_name || !donation_type || !warehouse_id) {
    return res.status(422).json({ error: 'Missing required fields' });
  }
  try {
    await query(
      `INSERT INTO DONATION (donation_id, donor_name, donor_id, contact_info, donation_type, amount_or_value, donation_date, warehouse_id)
       VALUES (:donation_id, :donor_name, :donor_id, :contact_info, :donation_type, :amount_or_value, TO_DATE(:donation_date, 'YYYY-MM-DD'), :warehouse_id)`,
      [donation_id, donor_name, donor_id || null, contact_info || null, donation_type, amount_or_value || null, donation_date, warehouse_id]
    );
    res.status(201).json({ message: 'Donation recorded', donation_id });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Donation ID already exists' });
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to record donation';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/donations/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { contact_info, amount_or_value, donation_date, donation_type } = req.body;
  const donation_id = String(req.params.id);

  try {
    await query(
      `UPDATE DONATION 
       SET contact_info = NVL(:contact_info, contact_info),
           amount_or_value = NVL(:amount_or_value, amount_or_value),
           donation_date = CASE WHEN :donation_date IS NULL THEN donation_date ELSE TO_DATE(:donation_date, 'YYYY-MM-DD') END,
           donation_type = NVL(:donation_type, donation_type)
       WHERE donation_id = :donation_id`,
      {
        contact_info: contact_info || null, 
        amount_or_value: amount_or_value || null, 
        donation_date: donation_date || null,
        donation_type: donation_type || null,
        donation_id
      }
    );
    res.json({ message: 'Donation updated successfully.' });
  } catch (err) {
    console.error('[Donations] PUT error:', err);
    res.status(500).json({ error: 'Failed to update donation.' });
  }
});

export default router;
