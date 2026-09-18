UPDATE SYSTEM.VOLUNTEER v 
SET availability_status = 'Available' 
WHERE NOT EXISTS (
  SELECT 1 FROM SYSTEM.DEPLOYED_AT d WHERE d.person_id = v.person_id
);
COMMIT;
EXIT;
