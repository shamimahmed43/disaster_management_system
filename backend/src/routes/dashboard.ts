import { Router } from 'express';
import { query } from '../config/db';
import { requireAnyAuth } from '../middleware/auth';

const router = Router();

// GET /api/dashboard — All KPI data for the dashboard in one call
router.get('/', requireAnyAuth, async (req, res) => {
  try {
    // Single query for all KPIs using subselects from DUAL (Oracle pattern)
    const [counts] = await query<{
      TOTAL_DISASTERS: number;
      ACTIVE_DISASTERS: number;
      TOTAL_VICTIMS: number;
      MISSING_VICTIMS: number;
      TOTAL_SHELTERS: number;
      TOTAL_PERSONNEL: number;
      TOTAL_WAREHOUSES: number;
      TOTAL_VEHICLES: number;
      AVAILABLE_VEHICLES: number;
      TOTAL_DONATIONS: number;
      TOTAL_DISTRIBUTIONS: number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM DISASTER_EVENT)                          AS TOTAL_DISASTERS,
        fn_active_disaster_count()                                     AS ACTIVE_DISASTERS,
        (SELECT COUNT(*) FROM VICTIM)                                  AS TOTAL_VICTIMS,
        (SELECT COUNT(*) FROM VICTIM WHERE missing_person = 'Y')       AS MISSING_VICTIMS,
        (SELECT COUNT(*) FROM SHELTER)                                 AS TOTAL_SHELTERS,
        (SELECT COUNT(*) FROM PERSONNEL)                               AS TOTAL_PERSONNEL,
        (SELECT COUNT(*) FROM WAREHOUSE)                               AS TOTAL_WAREHOUSES,
        (SELECT COUNT(*) FROM VEHICLE)                                 AS TOTAL_VEHICLES,
        (SELECT COUNT(*) FROM VEHICLE WHERE LOWER(availability_status) = 'available') AS AVAILABLE_VEHICLES,
        (SELECT COUNT(*) FROM DONATION)                                AS TOTAL_DONATIONS,
        (SELECT COUNT(*) FROM DISTRIBUTION)                            AS TOTAL_DISTRIBUTIONS
      FROM DUAL
    `);

    // Recent active disasters (last 5) using the VW_ACTIVE_DISASTERS view
    const recentDisasters = await query(`
      SELECT * FROM (
        SELECT 
          disaster_name, disaster_type, start_date, NULL as end_date, division, district
        FROM VW_ACTIVE_DISASTERS
        ORDER BY start_date DESC
      ) WHERE ROWNUM <= 5
    `);

    // Shelter capacity overview (top 5) using the VW_SHELTER_OCCUPANCY view
    const shelterStats = await query(`
      SELECT * FROM (
        SELECT
          shelter_id, shelter_name, capacity, current_occupancy, available_spots as available_capacity
        FROM VW_SHELTER_OCCUPANCY
        ORDER BY available_spots ASC
      ) WHERE ROWNUM <= 5
    `);

    res.json({
      data: {
        kpis: counts,
        recent_disasters: recentDisasters,
        shelter_stats: shelterStats,
      }
    });
  } catch (err: any) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch dashboard data';
    res.status(500).json({ error: msg });
  }
});

export default router;
