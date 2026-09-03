-- ============================================================
-- DMS DEMO DATA - MATCHES ACTUAL ORACLE SCHEMA
-- Run: sqlplus / as sysdba @d:\DBMS_Project\database\demo_data.sql
-- ============================================================
SET ECHO OFF
SET FEEDBACK OFF
SET DEFINE OFF
WHENEVER SQLERROR CONTINUE
ALTER SESSION SET CURRENT_SCHEMA = SYSTEM;

-- ─────────────────────────────────────────────────────────────
-- CLEAN UP EXISTING DATA (correct dependency order)
-- ─────────────────────────────────────────────────────────────
DELETE FROM APP_USER;
DELETE FROM DISTRIBUTION;
DELETE FROM DONATION;
DELETE FROM STATIONED_AT;
DELETE FROM DEPLOYED_AT;
DELETE FROM RESIDES_IN;
DELETE FROM VICTIM_PHONE;
DELETE FROM FAMILY_MEMBER;
DELETE FROM VICTIM_SPECIAL_NEEDS;
DELETE FROM VICTIM;
DELETE FROM VOLUNTEER;
DELETE FROM MEDICAL_STAFF;
DELETE FROM PERSONNEL;
DELETE FROM SHELTER;
DELETE FROM VEHICLE;
DELETE FROM WAREHOUSE;
DELETE FROM DISASTER_EVENT;
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- WAREHOUSES: (warehouse_id, warehouse_name, location, capacity, manager_name, status)
-- ─────────────────────────────────────────────────────────────
INSERT INTO WAREHOUSE VALUES ('WH001','Dhaka Central Relief Hub','Mirpur, Dhaka',5000,'Rafiqul Islam','Active');
INSERT INTO WAREHOUSE VALUES ('WH002','Chittagong Port Depot','Agrabad, Chittagong',3000,'Salma Begum','Active');
INSERT INTO WAREHOUSE VALUES ('WH003','Sylhet Emergency Store','Zindabazar, Sylhet',2000,'Karim Uddin','Active');
INSERT INTO WAREHOUSE VALUES ('WH004','Barisal Flood Relief Center','Sadar Road, Barisal',2500,'Monowara Khatun','Active');
INSERT INTO WAREHOUSE VALUES ('WH005','Rajshahi Distribution Point','New Market, Rajshahi',1800,'Aminul Haque','Active');
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- DISASTER EVENTS: (disaster_name, disaster_type, division, district, start_date, end_date)
-- NOTE: disaster_name is the PK! No disaster_id, no severity, no status
-- ─────────────────────────────────────────────────────────────
INSERT INTO DISASTER_EVENT VALUES ('Flash Flood 2026 - Sylhet','Flood','Sylhet','Sylhet Sadar',TO_DATE('2026-07-10','YYYY-MM-DD'),NULL);
INSERT INTO DISASTER_EVENT VALUES ('Cyclone Sitrang - Barisal','Cyclone','Barisal','Patuakhali',TO_DATE('2026-06-15','YYYY-MM-DD'),TO_DATE('2026-06-25','YYYY-MM-DD'));
INSERT INTO DISASTER_EVENT VALUES ('Drought Relief - Rajshahi','Drought','Rajshahi','Chapainawabganj',TO_DATE('2026-05-01','YYYY-MM-DD'),NULL);
INSERT INTO DISASTER_EVENT VALUES ('Landslide - Chittagong Hills','Landslide','Chittagong','Rangamati',TO_DATE('2026-08-02','YYYY-MM-DD'),NULL);
INSERT INTO DISASTER_EVENT VALUES ('River Erosion - Dhaka','River Erosion','Dhaka','Dohar',TO_DATE('2026-04-20','YYYY-MM-DD'),TO_DATE('2026-05-10','YYYY-MM-DD'));
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- SHELTERS: (shelter_id, shelter_name, current_status, contact_person_name, contact_person_phone, address_line, longitude, latitude, capacity, disaster_name)
-- ─────────────────────────────────────────────────────────────
INSERT INTO SHELTER VALUES ('SH001','Sylhet Govt Primary School','Open','Nurul Amin','01711100001','School Road, Sylhet Sadar','91.8687','24.8949',200,'Flash Flood 2026 - Sylhet');
INSERT INTO SHELTER VALUES ('SH002','Patuakhali Cyclone Shelter','Open','Fatema Begum','01711100002','Coastal Zone, Patuakhali','90.3281','22.3596',500,'Cyclone Sitrang - Barisal');
INSERT INTO SHELTER VALUES ('SH003','Rangamati Community Center','Open','Jhumu Chakma','01711100003','Rangamati Sadar','92.2027','22.6320',150,'Landslide - Chittagong Hills');
INSERT INTO SHELTER VALUES ('SH004','Rajshahi Town Hall Relief Camp','Open','Abdul Karim','01711100004','Town Hall Area, Rajshahi','88.6042','24.3745',300,'Drought Relief - Rajshahi');
INSERT INTO SHELTER VALUES ('SH005','Dhaka Dohar Relief Point','Open','Razia Sultana','01711100005','Dohar Upazila, Dhaka','90.0632','23.6089',120,'River Erosion - Dhaka');
INSERT INTO SHELTER VALUES ('SH006','Sylhet MC College Ground','Open','Prof. Salam','01711100006','College Road, Sylhet','91.8700','24.9000',400,'Flash Flood 2026 - Sylhet');
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VEHICLES: (vehicle_id, vehicle_type, registration_no, capacity, current_status)
-- ─────────────────────────────────────────────────────────────
INSERT INTO VEHICLE VALUES ('VH001','Ambulance','DHA-001-2024',4,'Available');
INSERT INTO VEHICLE VALUES ('VH002','Truck','DHA-002-2024',20,'Available');
INSERT INTO VEHICLE VALUES ('VH003','Boat','CTG-001-2024',15,'Available');
INSERT INTO VEHICLE VALUES ('VH004','Helicopter','GOV-001-2024',8,'Available');
INSERT INTO VEHICLE VALUES ('VH005','Pickup Truck','SYL-001-2024',10,'Available');
INSERT INTO VEHICLE VALUES ('VH006','Water Tanker','BAR-001-2024',5000,'Available');
INSERT INTO VEHICLE VALUES ('VH007','Bus','RAJ-001-2024',50,'Available');
COMMIT;

-- STATIONED_AT: (warehouse_id, vehicle_id)
INSERT INTO STATIONED_AT VALUES ('WH001','VH001');
INSERT INTO STATIONED_AT VALUES ('WH001','VH002');
INSERT INTO STATIONED_AT VALUES ('WH002','VH003');
INSERT INTO STATIONED_AT VALUES ('WH003','VH005');
INSERT INTO STATIONED_AT VALUES ('WH004','VH006');
INSERT INTO STATIONED_AT VALUES ('WH005','VH007');
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- PERSONNEL: (person_id, name, phone, designation, base_location, supervisor_id)
-- ─────────────────────────────────────────────────────────────
INSERT INTO PERSONNEL VALUES ('PER001','Md. Ariful Islam','01711000001','Director','Dhaka',NULL);
INSERT INTO PERSONNEL VALUES ('PER002','Nasrin Akter','01711000002','Regional Coordinator','Chittagong','PER001');
INSERT INTO PERSONNEL VALUES ('PER003','Shahadat Hossain','01711000003','Field Officer','Sylhet','PER001');
INSERT INTO PERSONNEL VALUES ('PER004','Lutfun Nahar','01711000004','Field Officer','Barisal','PER001');
INSERT INTO PERSONNEL VALUES ('PER005','Jahangir Alam','01711000005','Volunteer','Rajshahi','PER002');
INSERT INTO PERSONNEL VALUES ('PER006','Sumaiya Khanam','01711000006','Volunteer','Sylhet','PER003');
INSERT INTO PERSONNEL VALUES ('PER007','Mostafa Kamal','01711000007','Volunteer','Chittagong','PER002');
INSERT INTO PERSONNEL VALUES ('PER008','Ripa Akter','01711000008','Volunteer','Dhaka','PER001');
INSERT INTO PERSONNEL VALUES ('PER009','Dr. Anisur Rahman','01711000009','Senior Doctor','Sylhet','PER003');
INSERT INTO PERSONNEL VALUES ('PER010','Dr. Farhana Yeasmin','01711000010','Field Nurse','Barisal','PER004');
COMMIT;

-- VOLUNTEERS: (person_id, team)
INSERT INTO VOLUNTEER VALUES ('PER005','Rescue Team A');
INSERT INTO VOLUNTEER VALUES ('PER006','Food Distribution');
INSERT INTO VOLUNTEER VALUES ('PER007','Emergency Communication');
INSERT INTO VOLUNTEER VALUES ('PER008','Logistics');
COMMIT;

-- MEDICAL_STAFF: (person_id, specialization, since_date)
INSERT INTO MEDICAL_STAFF VALUES ('PER009','Emergency Medicine',TO_DATE('2020-01-01','YYYY-MM-DD'));
INSERT INTO MEDICAL_STAFF VALUES ('PER010','Pediatric Care',TO_DATE('2022-06-15','YYYY-MM-DD'));
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VICTIMS: (victim_id, household_head_name, gender, nid_number, reported_date, last_known_location, missing_person, special_needs, disaster_name)
-- ─────────────────────────────────────────────────────────────
INSERT INTO VICTIM VALUES ('VIC001','Kamal Hossain','Male','NID10001',TO_DATE('2026-07-11','YYYY-MM-DD'),'Sylhet Sadar','N',NULL,'Flash Flood 2026 - Sylhet');
INSERT INTO VICTIM VALUES ('VIC002','Rahela Begum','Female','NID10002',TO_DATE('2026-07-12','YYYY-MM-DD'),'Golapganj, Sylhet','N',NULL,'Flash Flood 2026 - Sylhet');
INSERT INTO VICTIM VALUES ('VIC003','Rahim Uddin','Male','NID10003',TO_DATE('2026-06-16','YYYY-MM-DD'),'Patuakhali Sadar','N',NULL,'Cyclone Sitrang - Barisal');
INSERT INTO VICTIM VALUES ('VIC004','Kohinoor Akter','Female','NID10004',TO_DATE('2026-06-17','YYYY-MM-DD'),'Galachipa, Patuakhali','Y','Requires medical attention','Cyclone Sitrang - Barisal');
INSERT INTO VICTIM VALUES ('VIC005','Abdul Matin','Male','NID10005',TO_DATE('2026-08-03','YYYY-MM-DD'),'Rangamati Sadar','N',NULL,'Landslide - Chittagong Hills');
INSERT INTO VICTIM VALUES ('VIC006','Saleha Khatun','Female','NID10006',TO_DATE('2026-08-04','YYYY-MM-DD'),'Kaptai, Rangamati','N',NULL,'Landslide - Chittagong Hills');
INSERT INTO VICTIM VALUES ('VIC007','Nurul Islam','Male','NID10007',TO_DATE('2026-07-15','YYYY-MM-DD'),'Sylhet City','N',NULL,'Flash Flood 2026 - Sylhet');
INSERT INTO VICTIM VALUES ('VIC008','Taslima Begum','Female','NID10008',TO_DATE('2026-07-16','YYYY-MM-DD'),'Sylhet Sadar','N',NULL,'Flash Flood 2026 - Sylhet');
INSERT INTO VICTIM VALUES ('VIC009','Jamal Ahmed','Male','NID10009',TO_DATE('2026-05-02','YYYY-MM-DD'),'Chapainawabganj','N','Elderly - needs assistance','Drought Relief - Rajshahi');
INSERT INTO VICTIM VALUES ('VIC010','Sajeda Parvin','Female','NID10010',TO_DATE('2026-08-05','YYYY-MM-DD'),'Rangamati','Y','Missing person - search ongoing','Landslide - Chittagong Hills');
COMMIT;

-- VICTIM_PHONE: (victim_id, phone_number)
INSERT INTO VICTIM_PHONE VALUES ('VIC001','01811111111');
INSERT INTO VICTIM_PHONE VALUES ('VIC002','01811111112');
INSERT INTO VICTIM_PHONE VALUES ('VIC003','01811111113');
INSERT INTO VICTIM_PHONE VALUES ('VIC004','01811111114');
INSERT INTO VICTIM_PHONE VALUES ('VIC005','01811111115');
INSERT INTO VICTIM_PHONE VALUES ('VIC006','01811111116');
COMMIT;

-- FAMILY_MEMBER: (victim_id, member_seq_no, name)
INSERT INTO FAMILY_MEMBER VALUES ('VIC001',1,'Fatema Hossain');
INSERT INTO FAMILY_MEMBER VALUES ('VIC001',2,'Riad Hossain');
INSERT INTO FAMILY_MEMBER VALUES ('VIC002',1,'Osman Gani');
INSERT INTO FAMILY_MEMBER VALUES ('VIC003',1,'Salma Akter');
INSERT INTO FAMILY_MEMBER VALUES ('VIC005',1,'Nasrin Islam');
INSERT INTO FAMILY_MEMBER VALUES ('VIC005',2,'Mitu Islam');
INSERT INTO FAMILY_MEMBER VALUES ('VIC007',1,'Shirin Akter');
INSERT INTO FAMILY_MEMBER VALUES ('VIC007',2,'Raian Ahmed');
COMMIT;

-- VICTIM_SPECIAL_NEEDS: (victim_id, special_need)
INSERT INTO VICTIM_SPECIAL_NEEDS VALUES ('VIC004','Medical attention required');
INSERT INTO VICTIM_SPECIAL_NEEDS VALUES ('VIC009','Elderly - requires assistance');
INSERT INTO VICTIM_SPECIAL_NEEDS VALUES ('VIC010','Missing - search ongoing');
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- SHELTER STAYS: (victim_id, shelter_id, checkin_date, checkout_date)
-- ─────────────────────────────────────────────────────────────
INSERT INTO RESIDES_IN VALUES ('VIC001','SH001',TO_DATE('2026-07-11','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC002','SH001',TO_DATE('2026-07-12','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC003','SH002',TO_DATE('2026-06-16','YYYY-MM-DD'),TO_DATE('2026-06-25','YYYY-MM-DD'));
INSERT INTO RESIDES_IN VALUES ('VIC004','SH002',TO_DATE('2026-06-17','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC005','SH003',TO_DATE('2026-08-03','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC006','SH003',TO_DATE('2026-08-04','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC007','SH006',TO_DATE('2026-07-15','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC008','SH006',TO_DATE('2026-07-16','YYYY-MM-DD'),NULL);
INSERT INTO RESIDES_IN VALUES ('VIC009','SH004',TO_DATE('2026-05-02','YYYY-MM-DD'),NULL);
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- DEPLOYED_AT: (person_id, shelter_id, deployment_date)
-- ─────────────────────────────────────────────────────────────
INSERT INTO DEPLOYED_AT VALUES ('PER003','SH001',TO_DATE('2026-07-11','YYYY-MM-DD'));
INSERT INTO DEPLOYED_AT VALUES ('PER006','SH001',TO_DATE('2026-07-12','YYYY-MM-DD'));
INSERT INTO DEPLOYED_AT VALUES ('PER004','SH002',TO_DATE('2026-06-16','YYYY-MM-DD'));
INSERT INTO DEPLOYED_AT VALUES ('PER005','SH003',TO_DATE('2026-08-03','YYYY-MM-DD'));
INSERT INTO DEPLOYED_AT VALUES ('PER009','SH003',TO_DATE('2026-08-04','YYYY-MM-DD'));
INSERT INTO DEPLOYED_AT VALUES ('PER010','SH006',TO_DATE('2026-07-15','YYYY-MM-DD'));
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- DONATIONS: (donation_id, donor_name, donor_id, contact_info, donation_type, amount_or_value, donation_date, warehouse_id)
-- NOTE: No purpose column in actual schema
-- ─────────────────────────────────────────────────────────────
INSERT INTO DONATION VALUES ('DON001','BRAC Bangladesh','BRAC','brac@brac.net','Food',500000,TO_DATE('2026-07-13','YYYY-MM-DD'),'WH001');
INSERT INTO DONATION VALUES ('DON002','Grameen Bank','GRAMEEN','info@grameen.org','Cash',200000,TO_DATE('2026-07-14','YYYY-MM-DD'),'WH001');
INSERT INTO DONATION VALUES ('DON003','Dutch-Bangla Bank','DBB','csr@dbbl.com.bd','Medical Supplies',150000,TO_DATE('2026-06-18','YYYY-MM-DD'),'WH002');
INSERT INTO DONATION VALUES ('DON004','Anonymous Donor',NULL,'01800000001','Clothing',80000,TO_DATE('2026-08-05','YYYY-MM-DD'),'WH003');
INSERT INTO DONATION VALUES ('DON005','UNDP Bangladesh','UNDP','undp@bd.un.org','Cash',1000000,TO_DATE('2026-07-20','YYYY-MM-DD'),'WH001');
INSERT INTO DONATION VALUES ('DON006','Square Group','SQUARE','csr@square.com','Food',300000,TO_DATE('2026-08-01','YYYY-MM-DD'),'WH004');
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- DISTRIBUTIONS: (distribution_id, warehouse_id, person_id, distribution_date, quantity)
-- NOTE: No shelter_id, vehicle_id, or status in actual schema
-- ─────────────────────────────────────────────────────────────
INSERT INTO DISTRIBUTION VALUES ('DIST001','WH001','PER003',TO_DATE('2026-07-13','YYYY-MM-DD'),500);
INSERT INTO DISTRIBUTION VALUES ('DIST002','WH002','PER004',TO_DATE('2026-06-20','YYYY-MM-DD'),300);
INSERT INTO DISTRIBUTION VALUES ('DIST003','WH003','PER005',TO_DATE('2026-08-06','YYYY-MM-DD'),200);
INSERT INTO DISTRIBUTION VALUES ('DIST004','WH001','PER006',TO_DATE('2026-07-18','YYYY-MM-DD'),400);
INSERT INTO DISTRIBUTION VALUES ('DIST005','WH004','PER004',TO_DATE('2026-06-22','YYYY-MM-DD'),150);
INSERT INTO DISTRIBUTION VALUES ('DIST006','WH005','PER005',TO_DATE('2026-05-05','YYYY-MM-DD'),250);
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS (compile using current schema)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER trg_shelter_status_update
AFTER INSERT OR UPDATE OR DELETE ON RESIDES_IN
DECLARE
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  UPDATE SHELTER s
  SET current_status = CASE 
    WHEN s.capacity <= (SELECT COUNT(*) FROM RESIDES_IN r WHERE r.shelter_id = s.shelter_id AND r.checkout_date IS NULL) THEN 'Full'
    ELSE 'Open'
  END;
  COMMIT;
END;
/

CREATE OR REPLACE TRIGGER trg_volunteer_status_update
AFTER INSERT OR UPDATE OR DELETE ON DEPLOYED_AT
DECLARE
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  UPDATE VOLUNTEER v
  SET team = CASE
    WHEN EXISTS (SELECT 1 FROM DEPLOYED_AT d WHERE d.person_id = v.person_id) THEN
      (SELECT NVL(v.team, 'Deployed') FROM DUAL)
    ELSE v.team
  END;
  COMMIT;
END;
/

-- ─────────────────────────────────────────────────────────────
-- ADMIN USER (password: "Admin@2026")
-- bcrypt hash of "Admin@2026" with cost=10
-- Using literal hash that works with bcryptjs
-- ─────────────────────────────────────────────────────────────
INSERT INTO APP_USER (user_id, email, password_hash, full_name, phone, role, is_verified, otp_code, otp_expiry, created_at, victim_id, person_id)
VALUES (
  'USR-ADMIN-001',
  'admin@dms.gov.bd',
  '$2b$10$YJDat4VFpGMkZPMmMU5Mue/5fGfZqLIK/R3zP3.F1YeO.BRkG7I9y',
  'System Administrator',
  '01700000001',
  'admin',
  'Y',
  NULL,
  NULL,
  SYSDATE,
  NULL,
  'PER001'
);
COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────
SELECT 'SUCCESS: Demo data loaded!' AS STATUS FROM DUAL;
SELECT 'DISASTER_EVENT: '  || COUNT(*) FROM DISASTER_EVENT;
SELECT 'SHELTER: '         || COUNT(*) FROM SHELTER;
SELECT 'WAREHOUSE: '       || COUNT(*) FROM WAREHOUSE;
SELECT 'VEHICLE: '         || COUNT(*) FROM VEHICLE;
SELECT 'PERSONNEL: '       || COUNT(*) FROM PERSONNEL;
SELECT 'VOLUNTEER: '       || COUNT(*) FROM VOLUNTEER;
SELECT 'MEDICAL_STAFF: '   || COUNT(*) FROM MEDICAL_STAFF;
SELECT 'VICTIM: '          || COUNT(*) FROM VICTIM;
SELECT 'RESIDES_IN: '      || COUNT(*) FROM RESIDES_IN;
SELECT 'DEPLOYED_AT: '     || COUNT(*) FROM DEPLOYED_AT;
SELECT 'DONATION: '        || COUNT(*) FROM DONATION;
SELECT 'DISTRIBUTION: '    || COUNT(*) FROM DISTRIBUTION;
SELECT 'APP_USER: '        || COUNT(*) FROM APP_USER;
EXIT;
