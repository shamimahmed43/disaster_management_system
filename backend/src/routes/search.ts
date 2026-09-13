import { Router } from 'express';
import { query } from '../config/db';

const router = Router();

export type SearchItem = {
  type:
    | 'disaster'
    | 'victim'
    | 'shelter'
    | 'warehouse'
    | 'donation'
    | 'distribution'
    | 'vehicle'
    | 'personnel'
    | 'volunteer'
    | 'medical';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
};

// GET /api/search?q=...
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!q || q.length < 1) {
    return res.json({ data: [] });
  }

  // Split search into individual lowercase keywords to support multi-keyword partial matching
  const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) {
    return res.json({ data: [] });
  }

  // Helper to build parameterized SQL WHERE clause matching all keywords across concatenated fields
  function buildWhere(fields: string[], paramPrefix: string) {
    const concatExpr = `LOWER(${fields.map((f) => `NVL(${f}, '')`).join(` || ' ' || `)})`;
    const conditions = keywords.map((_, i) => `${concatExpr} LIKE :${paramPrefix}_${i}`);
    const binds: Record<string, string> = {};
    keywords.forEach((kw, i) => {
      binds[`${paramPrefix}_${i}`] = `%${kw}%`;
    });
    return { clause: conditions.join(' AND '), binds };
  }

  try {
    const disW = buildWhere(
      ['disaster_name', 'disaster_type', 'division', 'district'],
      'dis'
    );
    const vicW = buildWhere(
      ['V.victim_id', 'V.household_head_name', 'V.nid_number', 'V.last_known_location', 'V.disaster_name'],
      'vic'
    );
    const shW = buildWhere(
      ['shelter_id', 'shelter_name', 'address_line', 'contact_person_name', 'current_status', 'disaster_name'],
      'sh'
    );
    const whW = buildWhere(
      ['W.warehouse_id', 'W.warehouse_name', 'W.location', 'W.manager_name', 'W.status'],
      'wh'
    );
    const dnW = buildWhere(
      ['D.donation_id', 'D.donor_name', 'D.donation_type', 'D.purpose', 'W.warehouse_name'],
      'dn'
    );
    const dstW = buildWhere(
      ['DIST.distribution_id', 'W.warehouse_name', 'P.name'],
      'dst'
    );
    const vhW = buildWhere(
      ['V.vehicle_id', 'V.vehicle_type', 'V.registration_no', 'V.availability_status', 'W.warehouse_name'],
      'vh'
    );
    const pW = buildWhere(
      ['person_id', 'name', 'phone', 'designation', 'base_location'],
      'p'
    );
    const vlW = buildWhere(
      ['V.person_id', 'P.name', 'P.phone', 'V.team', 'P.base_location'],
      'vl'
    );
    const medW = buildWhere(
      ['M.person_id', 'P.name', 'P.phone', 'P.designation', 'M.specialization', 'P.base_location'],
      'med'
    );

    const [
      disasters,
      victims,
      shelters,
      warehouses,
      donations,
      distributions,
      vehicles,
      personnel,
      volunteers,
      medical,
    ] = await Promise.all([
      // 1. Disasters
      query<any>(
        `SELECT disaster_name, disaster_type, division, district, start_date, end_date
         FROM DISASTER_EVENT
         WHERE ${disW.clause} AND ROWNUM <= 10`,
        disW.binds
      ).catch((err) => {
        console.error('[Search] Disaster error:', err);
        return [];
      }),

      // 2. Victims
      query<any>(
        `SELECT V.victim_id, V.household_head_name, V.nid_number, V.last_known_location, V.disaster_name, V.missing_person
         FROM VICTIM V
         WHERE ${vicW.clause} AND ROWNUM <= 10`,
        vicW.binds
      ).catch((err) => {
        console.error('[Search] Victim error:', err);
        return [];
      }),

      // 3. Shelters
      query<any>(
        `SELECT shelter_id, shelter_name, address_line, contact_person_name, current_status, capacity, disaster_name
         FROM SHELTER
         WHERE ${shW.clause} AND ROWNUM <= 10`,
        shW.binds
      ).catch((err) => {
        console.error('[Search] Shelter error:', err);
        return [];
      }),

      // 4. Warehouses
      query<any>(
        `SELECT W.warehouse_id, W.warehouse_name, W.location, W.manager_name, W.status, W.capacity
         FROM WAREHOUSE W
         WHERE ${whW.clause} AND ROWNUM <= 10`,
        whW.binds
      ).catch((err) => {
        console.error('[Search] Warehouse error:', err);
        return [];
      }),

      // 5. Donations
      query<any>(
        `SELECT D.donation_id, D.donor_name, D.donation_type, D.purpose, D.amount_or_value, D.donation_date, W.warehouse_name
         FROM DONATION D
         LEFT JOIN WAREHOUSE W ON D.warehouse_id = W.warehouse_id
         WHERE ${dnW.clause} AND ROWNUM <= 10`,
        dnW.binds
      ).catch((err) => {
        console.error('[Search] Donation error:', err);
        return [];
      }),

      // 6. Relief Distributions
      query<any>(
        `SELECT DIST.distribution_id, DIST.quantity, DIST.distribution_date, W.warehouse_name, P.name AS person_name
         FROM DISTRIBUTION DIST
         LEFT JOIN WAREHOUSE W ON DIST.warehouse_id = W.warehouse_id
         LEFT JOIN PERSONNEL P ON DIST.person_id = P.person_id
         WHERE ${dstW.clause} AND ROWNUM <= 10`,
        dstW.binds
      ).catch((err) => {
        console.error('[Search] Distribution error:', err);
        return [];
      }),

      // 7. Transport / Vehicles
      query<any>(
        `SELECT V.vehicle_id, V.vehicle_type, V.registration_no, V.availability_status, W.warehouse_name
         FROM VEHICLE V
         LEFT JOIN STATIONED_AT SA ON V.vehicle_id = SA.vehicle_id
         LEFT JOIN WAREHOUSE W ON SA.warehouse_id = W.warehouse_id
         WHERE ${vhW.clause} AND ROWNUM <= 10`,
        vhW.binds
      ).catch((err) => {
        console.error('[Search] Vehicle error:', err);
        return [];
      }),

      // 8. Personnel
      query<any>(
        `SELECT person_id, name, phone, designation, base_location
         FROM PERSONNEL
         WHERE ${pW.clause} AND ROWNUM <= 10`,
        pW.binds
      ).catch((err) => {
        console.error('[Search] Personnel error:', err);
        return [];
      }),

      // 9. Volunteers
      query<any>(
        `SELECT V.person_id, P.name, P.phone, V.team, P.base_location
         FROM VOLUNTEER V
         JOIN PERSONNEL P ON V.person_id = P.person_id
         WHERE ${vlW.clause} AND ROWNUM <= 10`,
        vlW.binds
      ).catch((err) => {
        console.error('[Search] Volunteer error:', err);
        return [];
      }),

      // 10. Medical Staff
      query<any>(
        `SELECT M.person_id, P.name, P.phone, P.designation, M.specialization, P.base_location
         FROM MEDICAL_STAFF M
         JOIN PERSONNEL P ON M.person_id = P.person_id
         WHERE ${medW.clause} AND ROWNUM <= 10`,
        medW.binds
      ).catch((err) => {
        console.error('[Search] Medical error:', err);
        return [];
      }),
    ]);

    const results: SearchItem[] = [];

    // Map Disasters
    disasters.forEach((d: any) => {
      results.push({
        type: 'disaster',
        id: d.DISASTER_NAME,
        title: d.DISASTER_NAME,
        subtitle: `${d.DISASTER_TYPE} · ${d.DIVISION}${d.DISTRICT ? `, ${d.DISTRICT}` : ''}`,
        href: `/disasters`,
        badge: 'DISASTER',
      });
    });

    // Map Victims
    victims.forEach((v: any) => {
      results.push({
        type: 'victim',
        id: v.VICTIM_ID,
        title: v.HOUSEHOLD_HEAD_NAME,
        subtitle: `ID: ${v.VICTIM_ID}${v.NID_NUMBER ? ` · NID: ${v.NID_NUMBER}` : ''}${v.LAST_KNOWN_LOCATION ? ` · ${v.LAST_KNOWN_LOCATION}` : ''}`,
        href: `/victims`,
        badge: 'VICTIM',
      });
    });

    // Map Shelters
    shelters.forEach((s: any) => {
      results.push({
        type: 'shelter',
        id: s.SHELTER_ID,
        title: s.SHELTER_NAME,
        subtitle: `ID: ${s.SHELTER_ID}${s.ADDRESS_LINE ? ` · ${s.ADDRESS_LINE}` : ''} · ${s.CURRENT_STATUS || 'Open'}`,
        href: `/shelters`,
        badge: 'SHELTER',
      });
    });

    // Map Warehouses
    warehouses.forEach((w: any) => {
      results.push({
        type: 'warehouse',
        id: w.WAREHOUSE_ID,
        title: w.WAREHOUSE_NAME,
        subtitle: `ID: ${w.WAREHOUSE_ID} · ${w.LOCATION}${w.MANAGER_NAME ? ` · Mgr: ${w.MANAGER_NAME}` : ''}`,
        href: `/warehouse`,
        badge: 'WAREHOUSE',
      });
    });

    // Map Donations
    donations.forEach((dn: any) => {
      results.push({
        type: 'donation',
        id: dn.DONATION_ID,
        title: `${dn.DONOR_NAME} (${dn.DONATION_TYPE})`,
        subtitle: `ID: ${dn.DONATION_ID}${dn.AMOUNT_OR_VALUE ? ` · ৳${Number(dn.AMOUNT_OR_VALUE).toLocaleString()}` : ''}${dn.WAREHOUSE_NAME ? ` · ${dn.WAREHOUSE_NAME}` : ''}`,
        href: `/donations`,
        badge: 'DONATION',
      });
    });

    // Map Distributions
    distributions.forEach((dst: any) => {
      results.push({
        type: 'distribution',
        id: dst.DISTRIBUTION_ID,
        title: `Distribution #${dst.DISTRIBUTION_ID} (${dst.QUANTITY} units)`,
        subtitle: `ID: ${dst.DISTRIBUTION_ID} · ${dst.WAREHOUSE_NAME || 'Warehouse'}${dst.PERSON_NAME ? ` · By: ${dst.PERSON_NAME}` : ''}`,
        href: `/relief`,
        badge: 'RELIEF',
      });
    });

    // Map Transport / Vehicles
    vehicles.forEach((vh: any) => {
      results.push({
        type: 'vehicle',
        id: vh.VEHICLE_ID,
        title: `${vh.VEHICLE_TYPE} (${vh.REGISTRATION_NO})`,
        subtitle: `ID: ${vh.VEHICLE_ID} · Status: ${vh.AVAILABILITY_STATUS || 'Available'}${vh.WAREHOUSE_NAME ? ` · ${vh.WAREHOUSE_NAME}` : ''}`,
        href: `/vehicles`,
        badge: 'VEHICLE',
      });
    });

    // Map Personnel
    personnel.forEach((p: any) => {
      results.push({
        type: 'personnel',
        id: p.PERSON_ID,
        title: p.NAME,
        subtitle: `ID: ${p.PERSON_ID}${p.DESIGNATION ? ` · ${p.DESIGNATION}` : ''}${p.BASE_LOCATION ? ` · ${p.BASE_LOCATION}` : ''}${p.PHONE ? ` · Tel: ${p.PHONE}` : ''}`,
        href: `/personnel`,
        badge: 'PERSONNEL',
      });
    });

    // Map Volunteers
    volunteers.forEach((vl: any) => {
      results.push({
        type: 'volunteer',
        id: vl.PERSON_ID,
        title: `${vl.NAME} (Volunteer)`,
        subtitle: `ID: ${vl.PERSON_ID}${vl.TEAM ? ` · Team: ${vl.TEAM}` : ''}${vl.BASE_LOCATION ? ` · ${vl.BASE_LOCATION}` : ''}`,
        href: `/volunteers`,
        badge: 'VOLUNTEER',
      });
    });

    // Map Medical Staff
    medical.forEach((m: any) => {
      results.push({
        type: 'medical',
        id: m.PERSON_ID,
        title: `${m.NAME} (${m.DESIGNATION || 'Medical Staff'})`,
        subtitle: `ID: ${m.PERSON_ID}${m.SPECIALIZATION ? ` · Spec: ${m.SPECIALIZATION}` : ''}${m.BASE_LOCATION ? ` · ${m.BASE_LOCATION}` : ''}`,
        href: `/medical`,
        badge: 'MEDICAL',
      });
    });

    res.json({ data: results });
  } catch (err: any) {
    console.error('[Search] Global search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
