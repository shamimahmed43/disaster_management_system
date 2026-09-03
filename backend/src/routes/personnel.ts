import { Router } from 'express';
import { query } from '../config/db';
import { requireRole, requireAnyAuth, AuthPayload } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

// GET /api/personnel/stats
router.get('/stats', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  try {
    const [counts] = await query<{
      TOTAL: number; VOLUNTEERS: number; MEDICAL: number; REGULAR: number; DEPLOYED: number;
    }>(`
      SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN V.person_id IS NOT NULL THEN 1 ELSE 0 END) AS VOLUNTEERS,
        SUM(CASE WHEN MS.person_id IS NOT NULL THEN 1 ELSE 0 END) AS MEDICAL,
        SUM(CASE WHEN V.person_id IS NULL AND MS.person_id IS NULL THEN 1 ELSE 0 END) AS REGULAR,
        (SELECT COUNT(*) FROM DEPLOYED_AT) AS DEPLOYED
      FROM PERSONNEL P
      LEFT JOIN VOLUNTEER V ON P.person_id = V.person_id
      LEFT JOIN MEDICAL_STAFF MS ON P.person_id = MS.person_id
    `);
    res.json({ data: counts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personnel stats' });
  }
});

// GET /api/personnel
router.get('/', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        E.person_id,
        E.name,
        E.phone,
        E.designation,
        E.base_location,
        E.supervisor_id,
        M.name AS supervisor_name,
        CASE WHEN V.person_id IS NOT NULL THEN 'Volunteer'
             WHEN MS.person_id IS NOT NULL THEN 'Medical Staff'
             ELSE 'Personnel' END AS personnel_type,
        V.team AS volunteer_team,
        MS.specialization AS medical_specialization,
        MS.since_date AS medical_since_date
      FROM PERSONNEL E
      LEFT JOIN PERSONNEL M ON E.supervisor_id = M.person_id
      LEFT JOIN VOLUNTEER V ON E.person_id = V.person_id
      LEFT JOIN MEDICAL_STAFF MS ON E.person_id = MS.person_id
      ORDER BY E.name
    `);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch personnel';
    res.status(500).json({ error: msg });
  }
});

// GET /api/personnel/volunteers
router.get('/volunteers', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT P.person_id, P.name, P.phone, P.designation, P.base_location, V.team
      FROM VOLUNTEER V
      JOIN PERSONNEL P ON V.person_id = P.person_id
      ORDER BY P.name
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// GET /api/personnel/medical
router.get('/medical', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT P.person_id, P.name, P.phone, P.designation, P.base_location, MS.specialization, MS.since_date
      FROM MEDICAL_STAFF MS
      JOIN PERSONNEL P ON MS.person_id = P.person_id
      ORDER BY P.name
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medical staff' });
  }
});

// POST /api/personnel
router.post('/', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const { person_id, name, phone, designation, base_location, supervisor_id,
          type, team, specialization, since_date } = req.body;
  if (!person_id || !name) return res.status(422).json({ error: 'Missing required fields' });

  try {
    // Insert base personnel record
    await query(
      `INSERT INTO PERSONNEL (person_id, name, phone, designation, base_location, supervisor_id)
       VALUES (:person_id, :name, :phone, :designation, :base_location, :supervisor_id)`,
      [person_id, name, phone || null, designation || null, base_location || null, supervisor_id || null]
    );

    // If volunteer: also insert into VOLUNTEER (ISA)
    if (type === 'volunteer') {
      await query(
        `INSERT INTO VOLUNTEER (person_id, team) VALUES (:person_id, :team)`,
        [person_id, team || 'General']
      );
    }
    // If medical staff: also insert into MEDICAL_STAFF (ISA)
    if (type === 'medical') {
      await query(
        `INSERT INTO MEDICAL_STAFF (person_id, specialization, since_date)
         VALUES (:person_id, :specialization, CASE WHEN :since_date IS NULL THEN SYSDATE ELSE TO_DATE(:since_date, 'YYYY-MM-DD') END)`,
        [person_id, specialization || 'General Practice', since_date || null, since_date || null]
      );
    }

    res.status(201).json({ message: 'Personnel created', person_id });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Person ID already exists' });
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to create personnel';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/personnel/:id
router.put('/:id', requireAnyAuth, async (req: Request, res: Response) => {
  const { phone, designation, base_location, team } = req.body;
  const person_id = req.params.id;
  const user = req.user as AuthPayload;

  // Allow if user is admin/staff OR if they are updating their own person_id
  if (!['admin', 'staff'].includes(user.role) && user.person_id !== person_id) {
    return res.status(403).json({ error: 'Permission denied. You can only update your own profile.' });
  }

  try {
    await query(
      `UPDATE PERSONNEL 
       SET phone = NVL(:phone, phone),
           designation = NVL(:designation, designation),
           base_location = NVL(:base_location, base_location)
       WHERE person_id = :person_id`,
      [phone || null, designation || null, base_location || null, person_id]
    );

    if (team) {
      await query(
        `UPDATE VOLUNTEER 
         SET team = :team 
         WHERE person_id = :person_id`,
        [team, person_id]
      );
    }

    res.json({ message: 'Personnel updated successfully.' });
  } catch (err) {
    console.error('[Personnel] PUT error:', err);
    res.status(500).json({ error: 'Failed to update personnel.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/personnel/:id
// Delete personnel and suspend linked user account
// ─────────────────────────────────────────────
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  const person_id = req.params.id;

  try {
    // Suspend the linked user account and remove the link
    await query(
      `UPDATE APP_USER 
       SET role = 'suspended', is_verified = 'N', person_id = NULL 
       WHERE person_id = :person_id`,
      [person_id]
    );

    // Delete child records first to prevent FK constraints
    await query(`DELETE FROM VOLUNTEER WHERE person_id = :1`, [person_id]);
    await query(`DELETE FROM MEDICAL_STAFF WHERE person_id = :1`, [person_id]);
    await query(`DELETE FROM DEPLOYED_AT WHERE person_id = :1`, [person_id]);

    // Finally delete the personnel
    await query(`DELETE FROM PERSONNEL WHERE person_id = :1`, [person_id]);

    res.json({ message: 'Personnel deleted and linked account suspended.' });
  } catch (err: any) {
    console.error('[Personnel] DELETE error:', err);
    // If there are still FK constraints (e.g. from DISTRIBUTION), it will throw ORA-02292
    if (err.errorNum === 2292) {
      return res.status(409).json({ error: 'Cannot delete personnel. They are referenced in distributions or other records.' });
    }
    res.status(500).json({ error: 'Failed to delete personnel.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/personnel/deploy
// Deploy personnel to a shelter
// ─────────────────────────────────────────────
router.post('/deploy', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const { person_id, shelter_id } = req.body;
  if (!person_id || !shelter_id) return res.status(422).json({ error: 'person_id and shelter_id are required' });

  try {
    // Check if already deployed
    const existing = await query(`SELECT 1 FROM DEPLOYED_AT WHERE person_id = :1 AND shelter_id = :2`, [person_id, shelter_id]);
    if (existing.length > 0) return res.status(409).json({ error: 'Personnel is already deployed to this shelter' });

    await query(
      `INSERT INTO DEPLOYED_AT (person_id, shelter_id, deployment_date) VALUES (:1, :2, SYSDATE)`,
      [person_id, shelter_id]
    );

    res.status(201).json({ message: 'Personnel deployed successfully.' });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to deploy personnel.';
    console.error('[Personnel] Deploy error:', err);
    res.status(500).json({ error: msg });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/personnel/deploy
// Undeploy personnel from a shelter
// ─────────────────────────────────────────────
router.delete('/deploy', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const { person_id, shelter_id } = req.body;
  if (!person_id || !shelter_id) return res.status(422).json({ error: 'person_id and shelter_id are required' });

  try {
    await query(
      `DELETE FROM DEPLOYED_AT WHERE person_id = :1 AND shelter_id = :2`,
      [person_id, shelter_id]
    );
    res.json({ message: 'Personnel undeployed successfully.' });
  } catch (err) {
    console.error('[Personnel] Undeploy error:', err);
    res.status(500).json({ error: 'Failed to undeploy personnel.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/personnel/deploy/:person_id
// Get deployments for a personnel
// ─────────────────────────────────────────────
router.get('/deploy/:person_id', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT D.person_id, D.shelter_id, D.deployment_date, S.shelter_name, S.address_line
      FROM DEPLOYED_AT D
      JOIN SHELTER S ON D.shelter_id = S.shelter_id
      WHERE D.person_id = :1
      ORDER BY D.deployment_date DESC
    `, [req.params.person_id]);
    res.json({ data: rows });
  } catch (err) {
    console.error('[Personnel] Get deployments error:', err);
    res.status(500).json({ error: 'Failed to fetch deployments.' });
  }
});

export default router;
