import { Router } from 'express';
import { query } from '../config/db';
import { requireRole, requireVictimOwnership } from '../middleware/auth';

const router = Router();

function safeDate(d: string | null | undefined): string | null {
  return (!d || d.trim() === '') ? null : d.trim();
}

// GET /api/victims
router.get('/', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { search } = req.query as { search?: string };
    const params: any[] = [];
    let whereClause = '';
    if (search) {
      whereClause = `WHERE LOWER(V.household_head_name) LIKE :search1 OR LOWER(V.victim_id) LIKE :search2`;
      const s = `%${search.toLowerCase()}%`;
      params.push(s, s);
    }
    const rows = await query(`
      SELECT
        V.victim_id,
        V.household_head_name,
        V.gender,
        V.nid_number,
        V.reported_date,
        V.last_known_location,
        V.missing_person,
        V.special_needs,
        V.disaster_name,
        D.disaster_type,
        D.division
      FROM VICTIM V
      LEFT JOIN DISASTER_EVENT D ON V.disaster_name = D.disaster_name
      ${whereClause}
      ORDER BY V.reported_date DESC
    `, params);
    res.json({ data: rows });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch victims';
    res.status(500).json({ error: msg });
  }
});

// GET /api/victims/:id
router.get('/:id', requireVictimOwnership, async (req, res) => {
  try {
    const [victim] = await query(
      `SELECT V.victim_id, V.household_head_name, V.gender, V.nid_number,
              V.reported_date, V.last_known_location, V.missing_person, V.special_needs, V.disaster_name,
              D.disaster_type, D.division
       FROM VICTIM V 
       LEFT JOIN DISASTER_EVENT D ON V.disaster_name = D.disaster_name
       WHERE V.victim_id = :id`,
      [req.params.id]
    );
    if (!victim) return res.status(404).json({ error: 'Victim not found' });

    const phonesRows = await query<{ PHONE: string }>(
      `SELECT phone FROM VICTIM_PHONE WHERE victim_id = :id ORDER BY phone`,
      [req.params.id]
    );
    const family = await query(
      `SELECT member_seq_no, name FROM FAMILY_MEMBER WHERE victim_id = :id ORDER BY member_seq_no`,
      [req.params.id]
    );
    const specialNeedsRows = await query<{ SPECIAL_NEED: string }>(
      `SELECT special_need FROM VICTIM_SPECIAL_NEEDS WHERE victim_id = :id ORDER BY special_need`,
      [req.params.id]
    );

    res.json({
      data: {
        ...victim,
        phones: phonesRows.map((r) => r.PHONE),
        family_members: family,
        special_needs: specialNeedsRows.map((r) => r.SPECIAL_NEED),
      },
    });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch victim';
    res.status(500).json({ error: msg });
  }
});

// POST /api/victims
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const { victim_id, household_head_name, gender, nid_number, reported_date,
          last_known_location, missing_person, disaster_name, phones, family_members, special_needs } = req.body;

  if (!victim_id || !household_head_name || !disaster_name) {
    return res.status(422).json({ error: 'Missing required fields: victim_id, household_head_name, disaster_name' });
  }

  const safeDateReported = safeDate(reported_date);

  try {
    await query(
      `INSERT INTO VICTIM (victim_id, household_head_name, gender, nid_number, reported_date, last_known_location, missing_person, special_needs, disaster_name)
       VALUES (:victim_id, :household_head_name, :gender, :nid_number,
         CASE WHEN :reported_date IS NULL THEN SYSDATE ELSE TO_DATE(:reported_date, 'YYYY-MM-DD') END,
         :last_known_location, :missing_person, :special_needs, :disaster_name)`,
      {
        victim_id,
        household_head_name,
        gender: gender || null,
        nid_number: nid_number || null,
        reported_date: safeDateReported,
        last_known_location: last_known_location || null,
        missing_person: missing_person || 'N',
        special_needs: null,
        disaster_name
      }
    );

    // Insert phones
    if (phones && Array.isArray(phones)) {
      for (const phone of phones) {
        if (phone && typeof phone === 'string' && phone.trim()) {
          await query(
            `INSERT INTO VICTIM_PHONE (victim_id, phone_number) VALUES (:victim_id, :phone)`,
            [victim_id, phone.trim()]
          );
        }
      }
    }

    // Insert special needs
    if (special_needs && Array.isArray(special_needs)) {
      for (const need of special_needs) {
        if (need && typeof need === 'string' && need.trim()) {
          await query(
            `INSERT INTO VICTIM_SPECIAL_NEEDS (victim_id, special_need) VALUES (:victim_id, :need)`,
            [victim_id, need.trim()]
          );
        }
      }
    }

    // Insert family members — schema only has (victim_id, member_seq_no, name)
    if (family_members && Array.isArray(family_members)) {
      for (let i = 0; i < family_members.length; i++) {
        const member = family_members[i];
        const name = typeof member === 'string' ? member.trim() : (member?.name || '').trim();
        if (name) {
          await query(
            `INSERT INTO FAMILY_MEMBER (victim_id, member_seq_no, name) VALUES (:victim_id, :seq, :name)`,
            [victim_id, i + 1, name]
          );
        }
      }
    }

    res.status(201).json({ message: 'Victim registered', victim_id });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Victim ID or NID already exists' });
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to register victim';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/victims/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { missing_person, last_known_location, special_needs } = req.body;
  const victim_id = req.params.id;

  try {
    await query(
      `UPDATE VICTIM 
       SET missing_person = NVL(:missing_person, missing_person), 
           last_known_location = NVL(:last_known_location, last_known_location),
           special_needs = NVL(:special_needs, special_needs)
       WHERE victim_id = :victim_id`,
      [missing_person || null, last_known_location || null, special_needs || null, victim_id]
    );
    res.json({ message: 'Victim updated successfully.' });
  } catch (err: any) {
    console.error('[Victims] PUT error:', err);
    res.status(500).json({ error: 'Failed to update victim.' });
  }
});

// PATCH /api/victims/:id/status
router.patch('/:id/status', requireVictimOwnership, async (req, res) => {
  const { missing_person, last_known_location } = req.body;
  const victim_id = req.params.id;

  try {
    await query(
      `UPDATE VICTIM 
       SET missing_person = NVL(:missing_person, missing_person), 
           last_known_location = NVL(:last_known_location, last_known_location)
       WHERE victim_id = :victim_id`,
      [missing_person || null, last_known_location || null, victim_id]
    );
    res.json({ message: 'Status updated successfully.' });
  } catch (err: any) {
    console.error('[Victims] PATCH error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

export default router;
