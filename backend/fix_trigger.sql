CREATE OR REPLACE TRIGGER SYSTEM.trg_volunteer_status_update
AFTER INSERT OR UPDATE OR DELETE ON SYSTEM.DEPLOYED_AT
FOR EACH ROW
BEGIN
  IF DELETING THEN
    UPDATE SYSTEM.VOLUNTEER SET availability_status = 'Available' WHERE person_id = :OLD.person_id;
  ELSIF INSERTING THEN
    UPDATE SYSTEM.VOLUNTEER SET availability_status = 'Deployed' WHERE person_id = :NEW.person_id;
  END IF;
END;
/
EXIT;
