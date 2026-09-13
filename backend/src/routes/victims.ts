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
        V.shelter_id,
        S.shelter_name,
        S.address_line AS shelter_location,
        D.disaster_type,
        D.division
      FROM VICTIM V
      LEFT JOIN DISASTER_EVENT D ON V.disaster_name = D.disaster_name
      LEFT JOIN SHELTER S ON V.shelter_id = S.shelter_id
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
    const [victim] = await query<any>(
      `SELECT V.victim_id, V.household_head_name, V.gender, V.nid_number,
              V.reported_date, V.last_known_location, V.missing_person, V.special_needs, V.disaster_name,
              V.shelter_id, S.shelter_name, S.address_line AS shelter_location,
              S.contact_person_name AS shelter_contact, S.contact_person_phone AS shelter_phone,
              D.disaster_type, D.division
       FROM VICTIM V 
       LEFT JOIN DISASTER_EVENT D ON V.disaster_name = D.disaster_name
       LEFT JOIN SHELTER S ON V.shelter_id = S.shelter_id
       WHERE V.victim_id = :id`,
      [req.params.id]
    );
    if (!victim) return res.status(404).json({ error: 'Victim not found' });

    const phonesRows = await query<{ PHONE: string }>(
      `SELECT phone FROM VICTIM_PHONE WHERE victim_id = :id ORDER BY phone`,
      [req.params.id]
    );
    const family = await query<{ MEMBER_SEQ_NO: number; NAME: string }>(
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
    console.error('[Victims] GET /:id error:', err);
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch victim';
    res.status(500).json({ error: msg });
  }
});

// POST /api/victims
router.post('/', requireRole(['admin', 'staff']), async (req, res) => {
  const { victim_id, household_head_name, gender, nid_number, reported_date,
          last_known_location, missing_person, disaster_name, shelter_id, phones, family_members, special_needs } = req.body;

  if (!victim_id || !household_head_name || !disaster_name) {
    return res.status(422).json({ error: 'Missing required fields: victim_id, household_head_name, disaster_name' });
  }

  const cleanShelterId = (shelter_id && typeof shelter_id === 'string' && shelter_id.trim()) ? shelter_id.trim() : null;

  // Capacity validation if shelter is selected
  if (cleanShelterId) {
    try {
      const shelterRows = await query<any>(
        `SELECT SH.shelter_id, SH.shelter_name, SH.capacity,
                (SELECT COUNT(*) FROM RESIDES_IN R WHERE R.shelter_id = SH.shelter_id AND R.checkout_date IS NULL) AS occupied_count
         FROM SHELTER SH
         WHERE SH.shelter_id = :shelter_id`,
        [cleanShelterId]
      );
      if (shelterRows.length === 0) {
        return res.status(422).json({ error: 'Selected shelter does not exist.' });
      }
      const shelter = shelterRows[0];
      const occupied = Number(shelter.OCCUPIED_COUNT || 0);
      const capacity = Number(shelter.CAPACITY || 0);
      if (capacity > 0 && occupied >= capacity) {
        return res.status(422).json({
          error: `Shelter "${shelter.SHELTER_NAME}" is currently at full capacity (${occupied}/${capacity}). Please select another shelter.`
        });
      }
    } catch (shelterErr: any) {
      console.error('[Victims] Shelter validation error:', shelterErr);
    }
  }

  const safeDateReported = safeDate(reported_date);

  try {
    await query(
      `INSERT INTO VICTIM (victim_id, household_head_name, gender, nid_number, reported_date, last_known_location, missing_person, special_needs, disaster_name, shelter_id)
       VALUES (:victim_id, :household_head_name, :gender, :nid_number,
         CASE WHEN :reported_date IS NULL THEN SYSDATE ELSE TO_DATE(:reported_date, 'YYYY-MM-DD') END,
         :last_known_location, :missing_person, :special_needs, :disaster_name, :shelter_id)`,
      {
        victim_id,
        household_head_name,
        gender: gender || null,
        nid_number: nid_number || null,
        reported_date: safeDateReported,
        last_known_location: last_known_location || null,
        missing_person: missing_person || 'N',
        special_needs: null,
        disaster_name,
        shelter_id: cleanShelterId
      }
    );

    // If shelter assigned, insert into RESIDES_IN
    if (cleanShelterId) {
      try {
        await query(
          `INSERT INTO RESIDES_IN (victim_id, shelter_id, checkin_date)
           VALUES (:victim_id, :shelter_id, CASE WHEN :checkin_date IS NULL THEN SYSDATE ELSE TO_DATE(:checkin_date, 'YYYY-MM-DD') END)`,
          {
            victim_id,
            shelter_id: cleanShelterId,
            checkin_date: safeDateReported
          }
        );
      } catch (residesErr: any) {
        console.error('[Victims] Failed to insert into RESIDES_IN:', residesErr);
      }
    }

    // Insert phones
    if (phones && Array.isArray(phones)) {
      for (const phone of phones) {
        if (phone && typeof phone === 'string' && phone.trim()) {
          await query(
            `INSERT INTO VICTIM_PHONE (victim_id, phone) VALUES (:victim_id, :phone)`,
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

    // Insert family members
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

    res.status(201).json({ message: 'Victim registered', victim_id, shelter_id: cleanShelterId });
  } catch (err: any) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'Victim ID or NID already exists' });
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to register victim';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/victims/:id
router.put('/:id', requireRole(['admin', 'staff']), async (req, res) => {
  const { missing_person, last_known_location, special_needs, shelter_id } = req.body;
  const victim_id = req.params.id as string;

  try {
    const [currentVictim] = await query<any>(
      `SELECT victim_id, shelter_id FROM VICTIM WHERE victim_id = :victim_id`,
      [victim_id]
    );
    if (!currentVictim) return res.status(404).json({ error: 'Victim not found.' });

    const currentShelterId = currentVictim.SHELTER_ID || null;
    let targetShelterId: string | null = null;
    if (shelter_id && typeof shelter_id === 'string' && shelter_id.trim() && shelter_id.trim() !== 'NONE') {
      targetShelterId = shelter_id.trim();
    }

    if (shelter_id !== undefined && targetShelterId !== currentShelterId) {
      if (targetShelterId) {
        const shelterRows = await query<any>(
          `SELECT SH.shelter_id, SH.shelter_name, SH.capacity,
                  (SELECT COUNT(*) FROM RESIDES_IN R WHERE R.shelter_id = SH.shelter_id AND R.checkout_date IS NULL) AS occupied_count
           FROM SHELTER SH
           WHERE SH.shelter_id = :shelter_id`,
          [targetShelterId]
        );
        if (shelterRows.length === 0) {
          return res.status(422).json({ error: 'Selected shelter does not exist.' });
        }
        const targetShelter = shelterRows[0];
        const occupied = Number(targetShelter.OCCUPIED_COUNT || 0);
        const capacity = Number(targetShelter.CAPACITY || 0);
        if (capacity > 0 && occupied >= capacity) {
          return res.status(422).json({ error: 'Selected shelter has reached maximum capacity.' });
        }

        if (currentShelterId) {
          await query(
            `UPDATE RESIDES_IN
             SET checkout_date = SYSDATE
             WHERE victim_id = :victim_id AND checkout_date IS NULL`,
            [victim_id]
          );
        }

        await query(
          `INSERT INTO RESIDES_IN (victim_id, shelter_id, checkin_date)
           VALUES (:victim_id, :shelter_id, SYSDATE)`,
          [victim_id, targetShelterId]
        );
      } else {
        if (currentShelterId) {
          await query(
            `UPDATE RESIDES_IN
             SET checkout_date = SYSDATE
             WHERE victim_id = :victim_id AND checkout_date IS NULL`,
            [victim_id]
          );
        }
      }
    }

    const finalShelterId = shelter_id !== undefined ? targetShelterId : currentShelterId;

    await query(
      `UPDATE VICTIM 
       SET missing_person = NVL(:missing_person, missing_person), 
           last_known_location = NVL(:last_known_location, last_known_location),
           special_needs = NVL(:special_needs, special_needs),
           shelter_id = :shelter_id
       WHERE victim_id = :victim_id`,
      {
        missing_person: missing_person || null,
        last_known_location: last_known_location || null,
        special_needs: special_needs || null,
        shelter_id: finalShelterId,
        victim_id
      }
    );
    res.json({ message: 'Victim updated successfully.', data: { victim_id, shelter_id: finalShelterId } });
  } catch (err: any) {
    console.error('[Victims] PUT error:', err);
    res.status(500).json({ error: 'Failed to update victim.' });
  }
});

// POST /api/victims/:id/family
router.post('/:id/family', requireVictimOwnership, async (req, res) => {
  const victim_id = req.params.id as string;
  const { name, age, relation_to_head } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({ error: 'Family member name is required.' });
  }

  try {
    const [seqResult] = await query<{ NEXT_SEQ: number }>(
      `SELECT NVL(MAX(member_seq_no), 0) + 1 AS NEXT_SEQ FROM FAMILY_MEMBER WHERE victim_id = :victim_id`,
      [victim_id]
    );
    const nextSeq = seqResult ? seqResult.NEXT_SEQ : 1;

    // Compose formatted string if relationship or age are provided
    const trimmedName = name.trim();
    const details: string[] = [];
    if (relation_to_head && typeof relation_to_head === 'string' && relation_to_head.trim()) {
      details.push(relation_to_head.trim());
    }
    if (age !== undefined && age !== null && String(age).trim() !== '') {
      details.push(`${String(age).trim()} yrs`);
    }
    const finalStoredName = details.length > 0 ? `${trimmedName} (${details.join(', ')})` : trimmedName;

    await query(
      `INSERT INTO FAMILY_MEMBER (victim_id, member_seq_no, name)
       VALUES (:victim_id, :member_seq_no, :name)`,
      {
        victim_id,
        member_seq_no: nextSeq,
        name: finalStoredName
      }
    );

    res.status(201).json({
      message: 'Family member added successfully.',
      data: {
        MEMBER_SEQ_NO: nextSeq,
        NAME: finalStoredName
      }
    });
  } catch (err: any) {
    console.error('[Victims] POST /:id/family error:', err);
    res.status(500).json({ error: 'Failed to add family member.' });
  }
});

// POST /api/victims/:id/phone
router.post('/:id/phone', requireVictimOwnership, async (req, res) => {
  const victim_id = req.params.id as string;
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(422).json({ error: 'Phone number is required.' });
  }

  try {
    await query(
      `INSERT INTO VICTIM_PHONE (victim_id, phone) VALUES (:victim_id, :phone)`,
      [victim_id, phone.trim()]
    );

    res.status(201).json({
      message: 'Emergency contact added successfully.',
      data: { phone: phone.trim() }
    });
  } catch (err: any) {
    if (err.errorNum === 1) {
      return res.status(409).json({ error: 'This phone number is already registered for this victim.' });
    }
    console.error('[Victims] POST /:id/phone error:', err);
    res.status(500).json({ error: 'Failed to add emergency contact.' });
  }
});

// PUT /api/victims/:id/profile
router.put('/:id/profile', requireVictimOwnership, async (req, res) => {
  const victim_id = req.params.id as string;
  const { household_head_name, gender, nid_number, last_known_location, special_needs, shelter_id } = req.body;

  try {
    const [currentVictim] = await query<any>(
      `SELECT victim_id, shelter_id FROM VICTIM WHERE victim_id = :victim_id`,
      [victim_id]
    );
    if (!currentVictim) return res.status(404).json({ error: 'Victim not found.' });

    const currentShelterId = currentVictim.SHELTER_ID || null;
    let targetShelterId: string | null = null;
    if (shelter_id && typeof shelter_id === 'string' && shelter_id.trim() && shelter_id.trim() !== 'NONE') {
      targetShelterId = shelter_id.trim();
    }

    // Handle shelter change
    if (shelter_id !== undefined && targetShelterId !== currentShelterId) {
      if (targetShelterId) {
        // Validate target shelter capacity
        const shelterRows = await query<any>(
          `SELECT SH.shelter_id, SH.shelter_name, SH.capacity,
                  (SELECT COUNT(*) FROM RESIDES_IN R WHERE R.shelter_id = SH.shelter_id AND R.checkout_date IS NULL) AS occupied_count
           FROM SHELTER SH
           WHERE SH.shelter_id = :shelter_id`,
          [targetShelterId]
        );
        if (shelterRows.length === 0) {
          return res.status(422).json({ error: 'Selected shelter does not exist.' });
        }
        const targetShelter = shelterRows[0];
        const occupied = Number(targetShelter.OCCUPIED_COUNT || 0);
        const capacity = Number(targetShelter.CAPACITY || 0);
        if (capacity > 0 && occupied >= capacity) {
          return res.status(422).json({ error: 'Selected shelter has reached maximum capacity.' });
        }

        // Checkout old shelter
        if (currentShelterId) {
          await query(
            `UPDATE RESIDES_IN
             SET checkout_date = SYSDATE
             WHERE victim_id = :victim_id AND checkout_date IS NULL`,
            [victim_id]
          );
        }

        // Checkin new shelter
        await query(
          `INSERT INTO RESIDES_IN (victim_id, shelter_id, checkin_date)
           VALUES (:victim_id, :shelter_id, SYSDATE)`,
          [victim_id, targetShelterId]
        );
      } else {
        // Removed from shelter
        if (currentShelterId) {
          await query(
            `UPDATE RESIDES_IN
             SET checkout_date = SYSDATE
             WHERE victim_id = :victim_id AND checkout_date IS NULL`,
            [victim_id]
          );
        }
      }
    }

    const finalShelterId = shelter_id !== undefined ? targetShelterId : currentShelterId;

    await query(
      `UPDATE VICTIM 
       SET household_head_name = NVL(:household_head_name, household_head_name),
           gender = NVL(:gender, gender),
           nid_number = NVL(:nid_number, nid_number),
           last_known_location = NVL(:last_known_location, last_known_location),
           special_needs = :special_needs,
           shelter_id = :shelter_id
       WHERE victim_id = :victim_id`,
      {
        household_head_name: household_head_name ? household_head_name.trim() : null,
        gender: gender ? gender.trim() : null,
        nid_number: nid_number ? nid_number.trim() : null,
        last_known_location: last_known_location ? last_known_location.trim() : null,
        special_needs: special_needs ? special_needs.trim() : null,
        shelter_id: finalShelterId,
        victim_id
      }
    );
    res.json({ message: 'Profile updated successfully.', data: { victim_id, shelter_id: finalShelterId } });
  } catch (err: any) {
    console.error('[Victims] PUT /:id/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// DELETE /api/victims/:id/family/:seq
router.delete('/:id/family/:seq', requireVictimOwnership, async (req, res) => {
  const victim_id = req.params.id as string;
  const rawSeq = Array.isArray(req.params.seq) ? req.params.seq[0] : req.params.seq;
  const seq = parseInt(rawSeq, 10);

  if (isNaN(seq)) {
    return res.status(422).json({ error: 'Invalid family member sequence number.' });
  }

  try {
    await query(
      `DELETE FROM FAMILY_MEMBER WHERE victim_id = :victim_id AND member_seq_no = :seq`,
      [victim_id, seq]
    );

    res.json({ message: 'Family member deleted successfully.' });
  } catch (err: any) {
    console.error('[Victims] DELETE /:id/family/:seq error:', err);
    res.status(500).json({ error: 'Failed to delete family member.' });
  }
});

// DELETE /api/victims/:id/phone/:phone
router.delete('/:id/phone/:phone', requireVictimOwnership, async (req, res) => {
  const victim_id = req.params.id as string;
  const rawPhone = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone;
  const phone = decodeURIComponent(rawPhone).trim();

  if (!phone) {
    return res.status(422).json({ error: 'Phone number is required.' });
  }

  try {
    await query(
      `DELETE FROM VICTIM_PHONE WHERE victim_id = :victim_id AND phone = :phone`,
      [victim_id, phone]
    );

    res.json({ message: 'Emergency contact deleted successfully.' });
  } catch (err: any) {
    console.error('[Victims] DELETE /:id/phone/:phone error:', err);
    res.status(500).json({ error: 'Failed to delete emergency contact.' });
  }
});


export default router;

