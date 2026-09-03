ALTER SESSION SET CURRENT_SCHEMA = SYSTEM;

-- Add Abstract Data Type column to SHELTER table
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE SHELTER ADD geo_location LOCATION_T';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
      RAISE;
    END IF;
END;
/

-- Create Procedure that returns a SYS_REFCURSOR
CREATE OR REPLACE PROCEDURE sp_get_shelter_alerts(p_cursor OUT SYS_REFCURSOR) IS
BEGIN
    OPEN p_cursor FOR
        SELECT 
            SH.shelter_id,
            SH.shelter_name,
            SH.capacity,
            COUNT(R.victim_id) AS occupied_count,
            CASE WHEN SH.capacity = 0 THEN 0 
                 ELSE ROUND((COUNT(R.victim_id) / SH.capacity) * 100) 
            END AS occupancy_pct
        FROM SHELTER SH
        LEFT JOIN RESIDES_IN R
               ON SH.shelter_id = R.shelter_id
              AND R.checkout_date IS NULL
        GROUP BY SH.shelter_id, SH.shelter_name, SH.capacity
        ORDER BY occupancy_pct DESC;
EXCEPTION
    WHEN OTHERS THEN
        -- Log exception and return an empty cursor or re-raise
        RAISE;
END;
/
EXIT;
