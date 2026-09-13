

SET ECHO ON
SET SERVEROUTPUT ON SIZE UNLIMITED
SET DEFINE OFF
WHENEVER SQLERROR CONTINUE

ALTER SESSION SET CURRENT_SCHEMA = SYSTEM;

PROMPT ============================================================
PROMPT  STEP 1 — ABSTRACT DATA TYPE (Object Type)
PROMPT ============================================================

-- ABSTRACT DATA TYPE: LOCATION_T

CREATE OR REPLACE TYPE LOCATION_T AS OBJECT (
    latitude    VARCHAR2(30),
    longitude   VARCHAR2(30),
    address     VARCHAR2(255),
    MEMBER FUNCTION to_string RETURN VARCHAR2
);
/

CREATE OR REPLACE TYPE BODY LOCATION_T AS
    MEMBER FUNCTION to_string RETURN VARCHAR2 IS
    BEGIN
        RETURN 'Lat: ' || NVL(latitude, 'N/A') ||
               ', Lon: ' || NVL(longitude, 'N/A') ||
               ', Address: ' || NVL(address, 'N/A');
    END;
END;
/

PROMPT --> LOCATION_T Object Type created.


PROMPT ============================================================
PROMPT  STEP 2 — FUNCTIONS (3 Business Logic Functions)
PROMPT ============================================================

-- FUNCTION 1: fn_active_disaster_count

CREATE OR REPLACE FUNCTION fn_active_disaster_count
RETURN NUMBER IS
    v_count NUMBER := 0;
BEGIN
    SELECT COUNT(*)
    INTO   v_count
    FROM   DISASTER_EVENT
    WHERE  end_date IS NULL;   

    RETURN v_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN -1;  
END fn_active_disaster_count;
/

PROMPT --> fn_active_disaster_count created.


-- FUNCTION 2: fn_shelter_occupancy_pct

CREATE OR REPLACE FUNCTION fn_shelter_occupancy_pct (
    p_shelter_id IN VARCHAR2
) RETURN NUMBER IS
    v_capacity  NUMBER := 0;
    v_occupied  NUMBER := 0;
BEGIN

    SELECT capacity
    INTO   v_capacity
    FROM   SHELTER
    WHERE  shelter_id = p_shelter_id;

    
    SELECT COUNT(*)
    INTO   v_occupied
    FROM   RESIDES_IN
    WHERE  shelter_id    = p_shelter_id
    AND    checkout_date IS NULL;

    
    IF v_capacity = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((v_occupied / v_capacity) * 100, 2);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN -1;   
    WHEN OTHERS THEN
        RETURN -2;
END fn_shelter_occupancy_pct;
/

PROMPT --> fn_shelter_occupancy_pct created.


-- FUNCTION 3: fn_total_donation_value

CREATE OR REPLACE FUNCTION fn_total_donation_value
RETURN NUMBER IS
    v_total NUMBER := 0;
BEGIN
    SELECT NVL(SUM(amount_or_value), 0)
    INTO   v_total
    FROM   DONATION;

    RETURN v_total;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END fn_total_donation_value;
/

PROMPT --> fn_total_donation_value created.


PROMPT ============================================================
PROMPT  STEP 3 — VIEWS (3 Application-Relevant Views)
PROMPT ============================================================

-- VIEW 1: VW_ACTIVE_DISASTERS

CREATE OR REPLACE VIEW VW_ACTIVE_DISASTERS AS
SELECT
    disaster_name,
    disaster_type,
    division,
    district,
    start_date,
    TRUNC(SYSDATE - start_date) AS days_active
FROM DISASTER_EVENT
WHERE end_date IS NULL;

PROMPT --> VW_ACTIVE_DISASTERS view created.


-- VIEW 2: VW_SHELTER_OCCUPANCY

CREATE OR REPLACE VIEW VW_SHELTER_OCCUPANCY AS
SELECT
    SH.shelter_id,
    SH.shelter_name,
    SH.capacity,
    COUNT(R.victim_id)                AS current_occupancy,
    (SH.capacity - COUNT(R.victim_id)) AS available_spots,
    CASE
        WHEN SH.capacity = 0 THEN 0
        ELSE ROUND(COUNT(R.victim_id) / SH.capacity * 100, 1)
    END                               AS occupancy_pct,
    SH.current_status
FROM SHELTER SH
LEFT JOIN RESIDES_IN R
       ON SH.shelter_id    = R.shelter_id
      AND R.checkout_date IS NULL
GROUP BY SH.shelter_id, SH.shelter_name, SH.capacity, SH.current_status;

PROMPT --> VW_SHELTER_OCCUPANCY view created.


-- VIEW 3: VW_VICTIM_DISASTER_SUMMARY

CREATE OR REPLACE VIEW VW_VICTIM_DISASTER_SUMMARY AS
SELECT
    D.disaster_name,
    D.disaster_type,
    D.division,
    D.district,
    COUNT(V.victim_id)                                       AS total_victims,
    SUM(CASE WHEN V.missing_person = 'Y' THEN 1 ELSE 0 END) AS missing_count,
    D.start_date,
    CASE WHEN D.end_date IS NULL THEN 'Active' ELSE 'Resolved' END AS disaster_status
FROM DISASTER_EVENT D
LEFT JOIN VICTIM V ON V.disaster_name = D.disaster_name
GROUP BY D.disaster_name, D.disaster_type, D.division, D.district,
         D.start_date, D.end_date;

PROMPT --> VW_VICTIM_DISASTER_SUMMARY view created.


PROMPT ============================================================
PROMPT  STEP 4 — PROCEDURE with CURSOR & EXCEPTION HANDLING
PROMPT ============================================================

-- ─────────────────────────────────────────────────────────────
-- PROCEDURE: sp_shelter_capacity_alert

CREATE OR REPLACE PROCEDURE sp_shelter_capacity_alert IS

    -- ── EXPLICIT CURSOR DECLARATION ──────────────────────────
    CURSOR c_shelter_occupancy IS
        SELECT
            SH.shelter_id,
            SH.shelter_name,
            SH.capacity,
            SH.current_status,
            COUNT(R.victim_id) AS occupied_count
        FROM SHELTER SH
        LEFT JOIN RESIDES_IN R  
               ON SH.shelter_id    = R.shelter_id
              AND R.checkout_date IS NULL
        GROUP BY SH.shelter_id, SH.shelter_name, SH.capacity, SH.current_status
        ORDER BY SH.shelter_name;


    v_pct           NUMBER;
    v_total_full    NUMBER := 0;
    v_total_ok      NUMBER := 0;
    v_total_empty   NUMBER := 0;

BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('╔══════════════════════════════════════════════════════════╗');
    DBMS_OUTPUT.PUT_LINE('║     SHELTER CAPACITY ALERT REPORT — DMS Bangladesh       ║');
    DBMS_OUTPUT.PUT_LINE('║     Generated: ' || TO_CHAR(SYSDATE, 'DD-MON-YYYY HH24:MI') || '                      ║');
    DBMS_OUTPUT.PUT_LINE('╠══════════════════════════════════════════════════════════╣');
    DBMS_OUTPUT.PUT_LINE(RPAD('Shelter Name', 32) || RPAD('Cap', 6) || RPAD('Occ', 6) || RPAD('%', 6) || 'Alert');
    DBMS_OUTPUT.PUT_LINE(RPAD('─', 65, '─'));

    
    FOR rec IN c_shelter_occupancy LOOP

        BEGIN  

            
            IF rec.capacity = 0 THEN
                v_pct := 0;
            ELSE
                v_pct := ROUND((rec.occupied_count / rec.capacity) * 100);
            END IF;

        
            IF v_pct >= 90 THEN
                DBMS_OUTPUT.PUT_LINE(
                    RPAD(rec.shelter_name, 32) ||
                    RPAD(rec.capacity, 6)      ||
                    RPAD(rec.occupied_count, 6)||
                    RPAD(v_pct || '%', 6)      ||
                    '⚠ CRITICAL — Near full!');
                v_total_full := v_total_full + 1;

            ELSIF v_pct = 0 THEN
                DBMS_OUTPUT.PUT_LINE(
                    RPAD(rec.shelter_name, 32) ||
                    RPAD(rec.capacity, 6)      ||
                    RPAD(rec.occupied_count, 6)||
                    RPAD(v_pct || '%', 6)      ||
                    '○ EMPTY');
                v_total_empty := v_total_empty + 1;

            ELSE
                DBMS_OUTPUT.PUT_LINE(
                    RPAD(rec.shelter_name, 32) ||
                    RPAD(rec.capacity, 6)      ||
                    RPAD(rec.occupied_count, 6)||
                    RPAD(v_pct || '%', 6)      ||
                    '✓ OK');
                v_total_ok := v_total_ok + 1;
            END IF;

        EXCEPTION
            
            WHEN ZERO_DIVIDE THEN
                DBMS_OUTPUT.PUT_LINE(rec.shelter_name || ' — ERROR: Capacity is zero (divide by zero caught)');
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE(rec.shelter_name || ' — ERROR: ' || SQLERRM);
        END;  

    END LOOP;  
    
    DBMS_OUTPUT.PUT_LINE(RPAD('─', 65, '─'));
    DBMS_OUTPUT.PUT_LINE('CRITICAL  (>=90%): ' || v_total_full);
    DBMS_OUTPUT.PUT_LINE('OK        (1-89%): ' || v_total_ok);
    DBMS_OUTPUT.PUT_LINE('EMPTY         (0%): ' || v_total_empty);
    DBMS_OUTPUT.PUT_LINE('╚══════════════════════════════════════════════════════════╝');

EXCEPTION
    
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('FATAL ERROR in sp_shelter_capacity_alert: ' || SQLERRM);
        RAISE;   
END sp_shelter_capacity_alert;
/

PROMPT --> sp_shelter_capacity_alert procedure created.


PROMPT ============================================================
PROMPT  STEP 5 — VERIFY ALL OBJECTS
PROMPT ============================================================

SELECT object_name, object_type, status
FROM   user_objects
WHERE  object_name IN (
           'LOCATION_T',
           'FN_ACTIVE_DISASTER_COUNT',
           'FN_SHELTER_OCCUPANCY_PCT',
           'FN_TOTAL_DONATION_VALUE',
           'VW_ACTIVE_DISASTERS',
           'VW_SHELTER_OCCUPANCY',
           'VW_VICTIM_DISASTER_SUMMARY',
           'SP_SHELTER_CAPACITY_ALERT'
       )
ORDER  BY object_type, object_name;

PROMPT ============================================================
PROMPT  INSTALLATION COMPLETE.
PROMPT  Run the exam demo script: exam_demo.sql
PROMPT ============================================================

EXIT;
