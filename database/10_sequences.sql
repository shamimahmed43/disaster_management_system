

ALTER SESSION SET CURRENT_SCHEMA = SYSTEM;

-- Drop if exists (safe re-run)
BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_distribution_num';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/



-- Sequence for automatic distribution ID generation
CREATE SEQUENCE seq_distribution_num
    START WITH 7
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999
    NOCYCLE
    NOCACHE;

EXIT;
