import { Router, Request, Response } from 'express';
import { query } from '../config/db';

const router = Router();

// GET /api/locations/suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    // Collect distinct locations from various tables to provide a rich autocomplete list
    const rows = await query<{ LOCATION: string }>(`
      SELECT DISTINCT location FROM (
        SELECT address_line AS location FROM SHELTER WHERE address_line IS NOT NULL
        UNION
        SELECT location FROM WAREHOUSE WHERE location IS NOT NULL
        UNION
        SELECT base_location FROM PERSONNEL WHERE base_location IS NOT NULL
        UNION
        SELECT division FROM DISASTER_EVENT WHERE division IS NOT NULL
        UNION
        SELECT district FROM DISASTER_EVENT WHERE district IS NOT NULL
        UNION
        SELECT upazila FROM DISASTER_EVENT WHERE upazila IS NOT NULL
      )
      WHERE location IS NOT NULL
      ORDER BY location ASC
    `);
    const suggestions = rows.map(r => r.LOCATION);
    res.json({ data: suggestions });
  } catch (err: any) {
    console.error('[Locations] Fetch suggestions error:', err);
    res.status(500).json({ error: 'Failed to fetch location suggestions' });
  }
});

export default router;
