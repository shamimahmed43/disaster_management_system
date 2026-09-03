import { Router, Request, Response } from 'express';
import { query } from '../config/db';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────
// GET /api/users/pending
// Fetch all users waiting for role assignment
// ─────────────────────────────────────────────
router.get('/pending', requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT user_id, email, full_name, phone, role, is_verified, created_at
      FROM APP_USER
      WHERE role = 'pending'
      ORDER BY created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error('[Users] Fetch pending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending users.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/users/:id/approve
// Approve a user, assign role and person_id
// ─────────────────────────────────────────────
router.put('/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  const { role, person_id } = req.body;
  const user_id = req.params.id;

  if (!role || !['admin', 'staff', 'volunteer', 'medical_staff', 'victim'].includes(role)) {
    return res.status(422).json({ error: 'Invalid or missing role.' });
  }

  try {
    // If linking to person_id, check if it exists
    if (person_id) {
      const persons = await query(`SELECT person_id FROM PERSONNEL WHERE person_id = :id`, [person_id]);
      if (persons.length === 0) {
        return res.status(404).json({ error: 'Provided person_id not found in PERSONNEL.' });
      }
    }

    await query(
      `UPDATE APP_USER 
       SET role = :role, person_id = :person_id 
       WHERE user_id = :user_id`,
      [role, person_id || null, user_id]
    );

    res.json({ message: 'User approved and role assigned successfully.' });
  } catch (err) {
    console.error('[Users] Approve user error:', err);
    res.status(500).json({ error: 'Failed to approve user.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/users
// Fetch all users (Admin only)
// ─────────────────────────────────────────────
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT user_id, email, full_name, phone, role, is_verified, created_at, person_id, victim_id
      FROM APP_USER
      ORDER BY created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error('[Users] Fetch all error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

export default router;
