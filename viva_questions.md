# Project Viva Guide

Run these setup commands in SQL*Plus first to ensure the terminal output is compactly formatted as tables:

```sql
SET LINESIZE 150;
SET PAGESIZE 100;
SET TAB OFF;
SET WRAP OFF;
SET COLSEP ' | ';
SET SERVEROUTPUT ON;

COLUMN EMAIL FORMAT A25;
COLUMN FULL_NAME FORMAT A20;
COLUMN ROLE FORMAT A10;
COLUMN HOUSEHOLD_HEAD_NAME FORMAT A20;
COLUMN GENDER FORMAT A6;
COLUMN NID_NUMBER FORMAT A15;
COLUMN PHONE FORMAT A15;
COLUMN NAME FORMAT A20;
COLUMN DISASTER_NAME FORMAT A20;
COLUMN DISASTER_TYPE FORMAT A15;
COLUMN DIVISION FORMAT A15;
COLUMN DISTRICT FORMAT A15;
COLUMN SHELTER_NAME FORMAT A20;
COLUMN CURRENT_STATUS FORMAT A10;
COLUMN PERSON_ID FORMAT A10;
COLUMN DESIGNATION FORMAT A15;
COLUMN TEAM FORMAT A15;
COLUMN EMPLOYEE FORMAT A20;
COLUMN SUPERVISOR FORMAT A20;
COLUMN WAREHOUSE_NAME FORMAT A20;
COLUMN DONOR_NAME FORMAT A20;
COLUMN RESPONSIBLE_PERSON FORMAT A20;
COLUMN REGISTRATION_NO FORMAT A15;
COLUMN VEHICLE_TYPE FORMAT A15;
COLUMN SPECIAL_NEEDS FORMAT A20;
```

---

# 1. New Admin Registration Verification
```sql
SELECT user_id, email, full_name, role FROM APP_USER WHERE email = 'testadmin@gmail.com';
```

# 2. Victim Registration Check
```sql
SELECT user_id, email, role, victim_id FROM APP_USER ORDER BY created_at DESC FETCH FIRST 1 ROWS ONLY;
```

# 3. Victim Detailed Information
```sql
SELECT victim_id, household_head_name, gender, nid_number FROM VICTIM WHERE nid_number = 'NID_HERE';
```

# 4. Multivalued Attribute (Phone)
```sql
SELECT victim_id, phone FROM VICTIM_PHONE WHERE victim_id = 'VICTIM_ID_HERE';
```

# 5. Weak Entity (Family Member)
```sql
SELECT victim_id, member_seq_no, name FROM FAMILY_MEMBER WHERE victim_id = 'VICTIM_ID_HERE';
```

# 6. New Disaster Event
```sql
SELECT disaster_name, disaster_type, division, district FROM DISASTER_EVENT ORDER BY start_date DESC FETCH FIRST 1 ROWS ONLY;
```

# 7. Active Disaster Filter
```sql
SELECT disaster_name, start_date FROM DISASTER_EVENT WHERE end_date IS NULL;
```

# 8. New Shelter
```sql
SELECT shelter_id, shelter_name, capacity, disaster_name FROM SHELTER WHERE shelter_name = 'SHELTER_NAME_HERE';
```

# 9. Many-to-Many Relationship (Victim Check-in)
```sql
SELECT victim_id, shelter_id, checkin_date FROM RESIDES_IN WHERE shelter_id = 'SHELTER_ID_HERE';
```

# 10. Personnel (Base Entity)
```sql
SELECT person_id, name, designation FROM PERSONNEL WHERE name = 'NAME_HERE';
```

# 11. Subtype Entity (Volunteer)
```sql
SELECT p.name, p.designation, v.team FROM PERSONNEL p JOIN VOLUNTEER v ON p.person_id = v.person_id;
```

# 12. Recursive Relationship (Self-Join)
```sql
SELECT e.name AS Employee, m.name AS Supervisor FROM PERSONNEL e LEFT JOIN PERSONNEL m ON e.supervisor_id = m.person_id;
```

# 13. Warehouse Add
```sql
SELECT warehouse_id, warehouse_name FROM WAREHOUSE WHERE warehouse_name = 'NAME_HERE';
```

# 14. Donation Add
```sql
SELECT donation_id, donor_name, amount_or_value FROM DONATION ORDER BY donation_date DESC FETCH FIRST 1 ROWS ONLY;
```

# 15. Aggregation Function (GROUP BY & SUM)
```sql
SELECT w.warehouse_name, SUM(d.amount_or_value) AS Total_Donations FROM DONATION d JOIN WAREHOUSE w ON d.warehouse_id = w.warehouse_id GROUP BY w.warehouse_name;
```

# 16. Distribution Insert
```sql
SELECT distribution_id, warehouse_id, quantity FROM DISTRIBUTION ORDER BY distribution_date DESC FETCH FIRST 1 ROWS ONLY;
```

# 17. Multi-Table JOIN (Distribution Details)
```sql
SELECT dist.distribution_id, w.warehouse_name, p.name AS Responsible_Person, dist.quantity FROM DISTRIBUTION dist JOIN WAREHOUSE w ON dist.warehouse_id = w.warehouse_id JOIN PERSONNEL p ON dist.person_id = p.person_id;
```

# 18. Ternary Relationship (Vehicle Distribution)
```sql
SELECT vd.distribution_id, v.registration_no, v.vehicle_type FROM VEHICLE_DISTRIBUTION vd JOIN VEHICLE v ON vd.vehicle_id = v.vehicle_id;
```

# 19. Special Needs Victim (Filtering)
```sql
SELECT victim_id, household_head_name, special_needs FROM VICTIM WHERE special_needs IS NOT NULL;
```

# 20. Finding Available Shelters
```sql
SELECT shelter_name, capacity, current_status FROM SHELTER WHERE current_status = 'Open';
```

# 21. Dashboard KPI (Total Victims)
```sql
SELECT COUNT(*) AS Total_Victims FROM VICTIM;
```

---

# PL/SQL: Function, Procedure, View, and Exception Handling

These database operations are implemented in the `database/08_exam_objects.sql` file. You can demonstrate them by running the following queries:

# 22. Demonstrate View (Active Disasters View)
```sql
SELECT * FROM VW_ACTIVE_DISASTERS;
```
*(Note: This view filters and joins data in the backend to return only currently active disasters)*

# 23. Demonstrate Function (Total Donation Value)
```sql
SELECT fn_total_donation_value() AS Total_Donation FROM DUAL;
```
*(Note: This function calculates and returns the total amount/value of all donations in the database)*

# 24. Demonstrate Procedure, Cursor, and Exception Handling
```sql
EXECUTE sp_shelter_capacity_alert;
```
*(Note: This procedure uses a Cursor to loop through shelters, checks their capacity, handles exceptions like `ZERO_DIVIDE`, and prints a formatted report in the terminal)*
