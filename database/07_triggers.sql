-- Trigger: Update Shelter Status based on Occupancy
CREATE OR REPLACE TRIGGER trg_shelter_status_update
AFTER INSERT OR UPDATE OR DELETE ON RESIDES_IN
DECLARE
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN

  UPDATE SHELTER s
  SET shelter_status = CASE 
    WHEN s.capacity <= (SELECT COUNT(*) FROM RESIDES_IN r WHERE r.shelter_id = s.shelter_id AND r.checkout_date IS NULL) THEN 'Full'
    ELSE 'Open'
  END;
  COMMIT;
END;
/

-- Trigger: Update Vehicle Status based on Distribution
CREATE OR REPLACE TRIGGER trg_vehicle_status_update
AFTER INSERT OR UPDATE OR DELETE ON DISTRIBUTION
DECLARE
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  
  UPDATE VEHICLE v
  SET current_status = CASE
    WHEN EXISTS (SELECT 1 FROM DISTRIBUTION d WHERE d.vehicle_id = v.vehicle_id AND d.status = 'Pending') THEN 'In Transit'
    ELSE 'Available'
  END;
  COMMIT;
END;
/

-- Trigger: Update Personnel (Volunteer) Status based on Deployment
CREATE OR REPLACE TRIGGER trg_volunteer_status_update
AFTER INSERT OR UPDATE OR DELETE ON DEPLOYED_AT
DECLARE
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  UPDATE VOLUNTEER v
  SET availability_status = CASE
    WHEN EXISTS (SELECT 1 FROM DEPLOYED_AT d WHERE d.person_id = v.person_id) THEN 'Deployed'
    ELSE 'Available'
  END;
  COMMIT;
END;
/

EXIT;
