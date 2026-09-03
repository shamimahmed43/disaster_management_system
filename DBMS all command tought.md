DBMS / Oracle SQL — Instructor-Taught Knowledge Base

«Purpose:
This document defines the DBMS/SQL/ER concepts, SQL commands, query patterns, and database operations that the instructor taught and that the Agent is expected to understand and use.

Critical Rule:
The Agent MUST NOT introduce advanced SQL/Oracle concepts merely because they are technically possible. When implementing the student's database project, prefer the constructs and query patterns taught in class. The instructor-approved ER diagram and instructor-provided slides/notes are the source of truth.»

---

1. ER MODEL

1.1 Entity

An Entity is a distinguishable real-world object about which data is stored.

Examples:

- Student
- Teacher
- Course
- Department
- Employee
- Customer
- Product

Entity Set

A collection of similar entities.

Example:

Student

represents the Student entity set.

---

2. ATTRIBUTES

An entity has attributes that describe it.

Example:

STUDENT
---------
Student_ID
Name
Email
Phone
Department

2.1 Types of Attributes

The instructor-taught ER model should distinguish the relevant attribute types.

Simple Attribute

Cannot be meaningfully divided further.

Example:

Age
Salary
Gender

Composite Attribute

Can be divided into smaller attributes.

Example:

Name
 ├── First_Name
 └── Last_Name

or:

Address
 ├── Street
 ├── City
 └── Postal_Code

Single-Valued Attribute

One value for an entity.

Example:

Date_of_Birth

Multivalued Attribute

May contain multiple values.

Example:

Phone_Number

An employee may have more than one phone number.

Derived Attribute

Calculated from another attribute.

Example:

Age

can be derived from:

Date_of_Birth

---

3. KEY ATTRIBUTES

Primary Key

A primary key uniquely identifies a row/entity.

Example:

Student_ID

SQL example:

CREATE TABLE Student (
    Student_ID NUMBER PRIMARY KEY,
    Name VARCHAR2(100)
);

Important properties:

- Unique
- Cannot be NULL
- Identifies a row uniquely

---

4. RELATIONSHIPS

A relationship represents an association between entities.

Example:

STUDENT ---- ENROLLS ---- COURSE

Meaning:

Student enrolls in Course

---

5. CARDINALITY

Important relationship types:

One-to-One

1 : 1

One entity corresponds to one entity.

Example:

Person ---- Passport

---

One-to-Many

1 : N

One entity can be related to many entities.

Example:

Department ---- Employee
     1              N

One department has many employees.

---

Many-to-Many

M : N

Many entities on both sides can participate.

Example:

Student ---- Course
   M           N

A student can take many courses, and a course can have many students.

Usually this is converted into an associative/intermediate relation/table.

Example:

STUDENT
COURSE
ENROLLMENT

---

6. PARTICIPATION

Total Participation

Every entity must participate in the relationship.

Partial Participation

Participation is optional.

The exact notation should follow the instructor's ER diagram notation.

---

7. ER DIAGRAM TO RELATIONAL SCHEMA

The general transformation process:

ER Diagram
    ↓
Entities
    ↓
Relations/Tables
    ↓
Attributes → Columns
    ↓
Primary Keys
    ↓
Foreign Keys
    ↓
Relationships

---

8. ENTITY → TABLE

An entity generally becomes a table.

ER:

STUDENT

Relational table:

STUDENT(
    Student_ID,
    Name,
    Email
)

SQL:

CREATE TABLE Student (
    Student_ID NUMBER PRIMARY KEY,
    Name VARCHAR2(100),
    Email VARCHAR2(100)
);

---

9. RELATIONSHIP → FOREIGN KEY

For a 1:N relationship, the foreign key is generally placed on the N-side.

Example:

DEPARTMENT 1 -------- N EMPLOYEE

Possible relational design:

DEPARTMENT(
    Department_ID PK,
    Department_Name
)

EMPLOYEE(
    Employee_ID PK,
    Employee_Name,
    Department_ID FK
)

SQL:

CREATE TABLE Department (
    Department_ID NUMBER PRIMARY KEY,
    Department_Name VARCHAR2(100)
);

CREATE TABLE Employee (
    Employee_ID NUMBER PRIMARY KEY,
    Employee_Name VARCHAR2(100),
    Department_ID NUMBER,
    FOREIGN KEY (Department_ID)
        REFERENCES Department(Department_ID)
);

---

10. MANY-TO-MANY RELATIONSHIP

For an M:N relationship, an intermediate/associative table is required.

Example:

STUDENT M -------- N COURSE

Convert to:

STUDENT
COURSE
ENROLLMENT

Example:

ENROLLMENT(
    Student_ID FK,
    Course_ID FK,
    ...
)

A composite primary key may be used:

PRIMARY KEY (Student_ID, Course_ID)

Example:

CREATE TABLE Enrollment (
    Student_ID NUMBER,
    Course_ID NUMBER,
    PRIMARY KEY (Student_ID, Course_ID),
    FOREIGN KEY (Student_ID)
        REFERENCES Student(Student_ID),
    FOREIGN KEY (Course_ID)
        REFERENCES Course(Course_ID)
);

---

11. RELATIONAL DATABASE CONCEPT

The database consists of related tables.

Example:

STUDENT
COURSE
DEPARTMENT
ENROLLMENT

Relationships are implemented using:

- Primary Key
- Foreign Key

This relationship becomes important when writing JOIN queries.

---

12. SQL COMMAND CATEGORIES

The major SQL command categories relevant to the course include:

DDL
DML
DQL
DCL
TCL

The exact set and depth should follow the instructor's taught material.

---

13. DDL — DATA DEFINITION LANGUAGE

DDL is used to define or modify database structures.

Important commands:

CREATE
ALTER
DROP
TRUNCATE

---

14. CREATE TABLE

Used to create a table.

Example:

CREATE TABLE Student (
    Student_ID NUMBER PRIMARY KEY,
    Name VARCHAR2(100),
    Email VARCHAR2(100)
);

---

15. ALTER TABLE

Used to modify an existing table structure.

Examples:

ALTER TABLE Student
ADD Phone VARCHAR2(20);

Adding a constraint:

ALTER TABLE Student
ADD CONSTRAINT student_pk
PRIMARY KEY (Student_ID);

Adding a foreign key:

ALTER TABLE Enrollment
ADD CONSTRAINT enrollment_student_fk
FOREIGN KEY (Student_ID)
REFERENCES Student(Student_ID);

---

16. DROP

Used to remove a database object.

Example:

DROP TABLE Student;

This removes the table itself.

---

17. TRUNCATE

Removes rows from a table while retaining the table structure.

Example:

TRUNCATE TABLE Student;

Difference conceptually:

DROP
→ removes table structure

TRUNCATE
→ removes table data but keeps structure

---

18. DML — DATA MANIPULATION LANGUAGE

Important DML commands:

INSERT
UPDATE
DELETE

---

19. INSERT

Used to insert rows.

Example:

INSERT INTO Student
VALUES (1, 'Rahim', 'rahim@gmail.com');

Explicit column form:

INSERT INTO Student
    (Student_ID, Name, Email)
VALUES
    (1, 'Rahim', 'rahim@gmail.com');

Multiple rows may be inserted using separate INSERT statements according to the instructor-taught syntax.

---

20. UPDATE

Used to modify existing rows.

Example:

UPDATE Student
SET Name = 'Karim'
WHERE Student_ID = 1;

IMPORTANT

Without a WHERE condition:

UPDATE Student
SET Name = 'Karim';

all rows may be affected.

Therefore the WHERE condition must be used carefully.

---

21. DELETE

Used to remove rows.

Example:

DELETE FROM Student
WHERE Student_ID = 1;

Without WHERE:

DELETE FROM Student;

all rows are targeted.

---

22. DQL — DATA QUERY LANGUAGE

The main query command:

SELECT

---

23. BASIC SELECT

Select all columns:

SELECT *
FROM Student;

Select specific columns:

SELECT Student_ID, Name
FROM Student;

---

24. WHERE

Used to filter rows.

SELECT *
FROM Student
WHERE Student_ID = 1;

Example:

SELECT *
FROM Employee
WHERE Salary > 50000;

---

25. COMPARISON OPERATORS

Common operators:

=
<>
!=
>
<
>=
<=

Examples:

SELECT *
FROM Employee
WHERE Salary > 50000;

SELECT *
FROM Employee
WHERE Salary <= 50000;

---

26. AND

Both conditions must be true.

SELECT *
FROM Employee
WHERE Salary > 50000
AND Department_ID = 10;

---

27. OR

At least one condition must be true.

SELECT *
FROM Employee
WHERE Department_ID = 10
OR Department_ID = 20;

---

28. NOT

Negates a condition.

Example:

SELECT *
FROM Employee
WHERE NOT Department_ID = 10;

---

29. BETWEEN

Used to check a range.

SELECT *
FROM Employee
WHERE Salary BETWEEN 30000 AND 60000;

---

30. IN

Used to match values from a list.

SELECT *
FROM Employee
WHERE Department_ID IN (10, 20, 30);

---

31. LIKE

Used for pattern matching.

Examples:

SELECT *
FROM Student
WHERE Name LIKE 'A%';

Meaning:

Name starts with A

Another:

SELECT *
FROM Student
WHERE Name LIKE '%a%';

Meaning:

Name contains a

---

32. NULL

NULL represents absence/unknown value.

Use:

IS NULL

instead of:

= NULL

Example:

SELECT *
FROM Student
WHERE Email IS NULL;

For non-null:

SELECT *
FROM Student
WHERE Email IS NOT NULL;

---

33. ORDER BY

Used to sort query results.

Ascending:

SELECT *
FROM Employee
ORDER BY Salary ASC;

Descending:

SELECT *
FROM Employee
ORDER BY Salary DESC;

---

34. DISTINCT

Used to remove duplicate values from the result.

SELECT DISTINCT Department_ID
FROM Employee;

---

35. AGGREGATE FUNCTIONS

Important aggregate functions:

COUNT()
SUM()
AVG()
MAX()
MIN()

---

36. COUNT

SELECT COUNT(*)
FROM Student;

Count a specific column:

SELECT COUNT(Student_ID)
FROM Student;

---

37. SUM

SELECT SUM(Salary)
FROM Employee;

---

38. AVG

SELECT AVG(Salary)
FROM Employee;

---

39. MAX

SELECT MAX(Salary)
FROM Employee;

---

40. MIN

SELECT MIN(Salary)
FROM Employee;

---

41. GROUP BY

Used to group rows before applying aggregate functions.

Example:

SELECT Department_ID, COUNT(*)
FROM Employee
GROUP BY Department_ID;

Another example:

SELECT Department_ID, AVG(Salary)
FROM Employee
GROUP BY Department_ID;

---

42. HAVING

Used to filter groups created by GROUP BY.

Example:

SELECT Department_ID, COUNT(*)
FROM Employee
GROUP BY Department_ID
HAVING COUNT(*) > 5;

Conceptual difference:

WHERE
→ filters individual rows

HAVING
→ filters groups

---

43. JOIN

JOIN is one of the major topics.

JOIN is used to combine information from multiple related tables.

Example tables:

STUDENT
COURSE
ENROLLMENT

Suppose:

Student.Student_ID
        ↓
Enrollment.Student_ID

Then the tables can be joined.

---

44. INNER JOIN

Returns rows having matching values in both tables.

Example:

SELECT Student.Name, Enrollment.Course_ID
FROM Student
INNER JOIN Enrollment
    ON Student.Student_ID = Enrollment.Student_ID;

Equivalent common form:

SELECT Student.Name, Enrollment.Course_ID
FROM Student
JOIN Enrollment
    ON Student.Student_ID = Enrollment.Student_ID;

---

45. JOIN WITH THREE TABLES

Example:

Student
Enrollment
Course

Query:

SELECT
    Student.Name,
    Course.Course_Name
FROM Student
JOIN Enrollment
    ON Student.Student_ID = Enrollment.Student_ID
JOIN Course
    ON Enrollment.Course_ID = Course.Course_ID;

This is an important pattern:

Table A
   JOIN
Table B
   JOIN
Table C

The ON conditions connect the related keys.

---

46. LEFT JOIN

Returns all rows from the left table and matching rows from the right table.

Example:

SELECT
    Student.Name,
    Enrollment.Course_ID
FROM Student
LEFT JOIN Enrollment
    ON Student.Student_ID = Enrollment.Student_ID;

Even if a student has no enrollment, the student can still appear in the result.

---

47. RIGHT JOIN

Returns all rows from the right table and matching rows from the left table.

Example:

SELECT
    Student.Name,
    Enrollment.Course_ID
FROM Student
RIGHT JOIN Enrollment
    ON Student.Student_ID = Enrollment.Student_ID;

---

48. FULL OUTER JOIN

Returns matching rows plus unmatched rows from both sides.

Example:

SELECT
    Student.Name,
    Enrollment.Course_ID
FROM Student
FULL OUTER JOIN Enrollment
    ON Student.Student_ID = Enrollment.Student_ID;

---

49. CROSS JOIN

Produces combinations between rows of two tables.

Example:

SELECT *
FROM Student
CROSS JOIN Course;

If Student has:

3 rows

and Course has:

4 rows

the result can contain:

3 × 4 = 12 rows

---

50. SELF JOIN

A table can be joined with itself when rows in the same table have relationships.

Example:

Employee
Employee_ID
Employee_Name
Manager_ID

Query:

SELECT
    E.Employee_Name,
    M.Employee_Name AS Manager_Name
FROM Employee E
JOIN Employee M
    ON E.Manager_ID = M.Employee_ID;

---

51. TABLE ALIAS

Aliases make queries shorter and clearer.

Example:

SELECT
    S.Name
FROM Student S;

Instead of repeatedly writing:

Student.Name

we can write:

S.Name

---

52. JOIN + WHERE

JOIN can be combined with WHERE.

Example:

SELECT
    S.Name,
    C.Course_Name
FROM Student S
JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
JOIN Course C
    ON E.Course_ID = C.Course_ID
WHERE S.Student_ID = 10;

---

53. JOIN + ORDER BY

Example:

SELECT
    S.Name,
    C.Course_Name
FROM Student S
JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
JOIN Course C
    ON E.Course_ID = C.Course_ID
ORDER BY S.Name;

---

54. JOIN + GROUP BY

Example:

SELECT
    S.Student_ID,
    S.Name,
    COUNT(E.Course_ID)
FROM Student S
LEFT JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
GROUP BY
    S.Student_ID,
    S.Name;

---

55. JOIN + GROUP BY + HAVING

Example:

SELECT
    S.Student_ID,
    S.Name,
    COUNT(E.Course_ID)
FROM Student S
LEFT JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
GROUP BY
    S.Student_ID,
    S.Name
HAVING COUNT(E.Course_ID) > 2;

---

56. COMMON QUERY STRUCTURE

A typical SELECT query follows the conceptual order:

SELECT columns
FROM table
JOIN another_table
    ON condition
WHERE condition
GROUP BY columns
HAVING group_condition
ORDER BY columns;

Important:

The clauses have specific purposes.

SELECT
→ what to display

FROM
→ where the data comes from

JOIN
→ combine related tables

ON
→ define how tables are related

WHERE
→ filter rows

GROUP BY
→ create groups

HAVING
→ filter groups

ORDER BY
→ sort result

---

57. PRIMARY KEY + FOREIGN KEY + JOIN

This is one of the most important connections between ER modeling and SQL.

Example:

DEPARTMENT
----------------
Department_ID PK
Department_Name

        1
        |
        |
        N

EMPLOYEE
----------------
Employee_ID PK
Employee_Name
Department_ID FK

SQL:

SELECT
    E.Employee_Name,
    D.Department_Name
FROM Employee E
JOIN Department D
    ON E.Department_ID = D.Department_ID;

The JOIN is based on:

Employee.Department_ID
        =
Department.Department_ID

---

58. REFERENTIAL INTEGRITY

Foreign keys maintain relationships between tables.

Example:

FOREIGN KEY (Department_ID)
REFERENCES Department(Department_ID)

The value in the child table must correspond to a valid referenced value, subject to the constraints defined.

---

59. CONSTRAINTS

Important constraints relevant to table design:

PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
CHECK

Examples:

Student_ID NUMBER PRIMARY KEY

Email VARCHAR2(100) UNIQUE

Name VARCHAR2(100) NOT NULL

Age NUMBER CHECK (Age >= 18)

Foreign key:

FOREIGN KEY (Department_ID)
REFERENCES Department(Department_ID)

---

60. COMPLETE SMALL DATABASE EXAMPLE

Department

CREATE TABLE Department (
    Department_ID NUMBER PRIMARY KEY,
    Department_Name VARCHAR2(100)
);

Student

CREATE TABLE Student (
    Student_ID NUMBER PRIMARY KEY,
    Name VARCHAR2(100),
    Email VARCHAR2(100),
    Department_ID NUMBER,
    FOREIGN KEY (Department_ID)
        REFERENCES Department(Department_ID)
);

Course

CREATE TABLE Course (
    Course_ID NUMBER PRIMARY KEY,
    Course_Name VARCHAR2(100)
);

Enrollment

CREATE TABLE Enrollment (
    Student_ID NUMBER,
    Course_ID NUMBER,
    PRIMARY KEY (Student_ID, Course_ID),
    FOREIGN KEY (Student_ID)
        REFERENCES Student(Student_ID),
    FOREIGN KEY (Course_ID)
        REFERENCES Course(Course_ID)
);

---

61. INSERT SAMPLE DATA

INSERT INTO Department
VALUES (1, 'CSE');

INSERT INTO Department
VALUES (2, 'EEE');

INSERT INTO Student
VALUES (101, 'Rahim', 'rahim@gmail.com', 1);

INSERT INTO Student
VALUES (102, 'Karim', 'karim@gmail.com', 1);

INSERT INTO Course
VALUES (201, 'Database');

INSERT INTO Course
VALUES (202, 'Operating System');

INSERT INTO Enrollment
VALUES (101, 201);

INSERT INTO Enrollment
VALUES (101, 202);

INSERT INTO Enrollment
VALUES (102, 201);

---

62. BASIC DATA RETRIEVAL

SELECT *
FROM Student;

Specific columns:

SELECT Student_ID, Name
FROM Student;

Filtered:

SELECT *
FROM Student
WHERE Department_ID = 1;

Sorted:

SELECT *
FROM Student
ORDER BY Name ASC;

---

63. JOIN EXAMPLE

SELECT
    S.Name,
    D.Department_Name
FROM Student S
JOIN Department D
    ON S.Department_ID = D.Department_ID;

---

64. THREE-TABLE JOIN

SELECT
    S.Name,
    C.Course_Name
FROM Student S
JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
JOIN Course C
    ON E.Course_ID = C.Course_ID;

Result conceptually:

Student Name | Course
-------------|----------------
Rahim        | Database
Rahim        | Operating System
Karim        | Database

---

65. COUNT COURSES PER STUDENT

SELECT
    S.Name,
    COUNT(E.Course_ID) AS Total_Courses
FROM Student S
LEFT JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
GROUP BY
    S.Student_ID,
    S.Name;

---

66. STUDENTS WITH MORE THAN ONE COURSE

SELECT
    S.Name,
    COUNT(E.Course_ID) AS Total_Courses
FROM Student S
JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
GROUP BY
    S.Student_ID,
    S.Name
HAVING COUNT(E.Course_ID) > 1;

---

67. IMPORTANT SQL CONCEPTUAL DISTINCTIONS

WHERE vs HAVING

WHERE
→ filters rows before grouping

HAVING
→ filters groups after GROUP BY

---

PRIMARY KEY vs FOREIGN KEY

PRIMARY KEY
→ uniquely identifies a row

FOREIGN KEY
→ references a key in another table

---

DROP vs DELETE vs TRUNCATE

DELETE
→ removes rows

TRUNCATE
→ removes table data while keeping table structure

DROP
→ removes the table/object

---

JOIN vs WHERE

JOIN / ON
→ combines related tables

WHERE
→ filters the resulting rows

---

68. SQL QUERY THINKING PROCESS

When asked to write a query, follow this process:

Step 1 — Identify what needs to be displayed

Example:

Student Name
Course Name

Therefore:

SELECT S.Name, C.Course_Name

Step 2 — Identify the tables

Student
Course

Step 3 — Find the relationship path

Student
   ↓
Enrollment
   ↓
Course

Step 4 — Write FROM/JOIN

FROM Student S
JOIN Enrollment E
    ON S.Student_ID = E.Student_ID
JOIN Course C
    ON E.Course_ID = C.Course_ID

Step 5 — Add filtering

WHERE ...

Step 6 — Add grouping if required

GROUP BY ...

Step 7 — Add HAVING if group filtering is required

HAVING ...

Step 8 — Add sorting

ORDER BY ...

---

69. AGENT IMPLEMENTATION RULES

The Agent MUST follow these rules.

Rule 1 — ER Diagram Is the Source of Truth

Never invent a different entity/relationship structure when an instructor-approved ER diagram exists.

---

Rule 2 — Instructor Slides Are the SQL Scope

If the instructor slides/notes specify a particular syntax or command, follow that syntax.

---

Rule 3 — Do Not Randomly Introduce Advanced SQL

Do not automatically introduce:

Window Functions
CTEs
Recursive CTEs
Stored Procedures
Packages
Triggers
PL/SQL
Dynamic SQL
Advanced Oracle-specific features

unless they are explicitly present in the instructor-provided material.

---

Rule 4 — Preserve Naming

Use the table names, column names, relationship names, and key structure established by the approved ER diagram.

---

Rule 5 — Explain Every Query

When generating SQL for the student:

1. Show the SQL.
2. Explain what each clause does.
3. Identify the tables involved.
4. Identify PK/FK relationships.
5. Explain the JOIN condition.
6. Explain WHERE/GROUP BY/HAVING when used.

---

70. CORE COMMAND CHECKLIST

The Agent should recognize the following core commands/concepts:

CREATE
ALTER
DROP
TRUNCATE

INSERT
UPDATE
DELETE

SELECT

WHERE
AND
OR
NOT

BETWEEN
IN
LIKE
IS NULL
IS NOT NULL

DISTINCT
ORDER BY

COUNT
SUM
AVG
MAX
MIN

GROUP BY
HAVING

JOIN
INNER JOIN
LEFT JOIN
RIGHT JOIN
FULL OUTER JOIN
CROSS JOIN
SELF JOIN

PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
CHECK

REFERENCES

---

71. CORE DATABASE DESIGN CHECKLIST

The Agent should understand:

Entity
Entity Set
Attribute
Simple Attribute
Composite Attribute
Single-Valued Attribute
Multivalued Attribute
Derived Attribute

Primary Key
Foreign Key

Relationship
Relationship Set

1:1 Relationship
1:N Relationship
M:N Relationship

Participation
Cardinality

ER Diagram
Relational Schema

Entity → Table
Attribute → Column
Key → Primary/Foreign Key

M:N Relationship → Associative Table

---

72. MOST IMPORTANT CONNECTION

The complete learning chain is:

ER MODEL
   ↓
Entity
   ↓
Attribute
   ↓
Relationship
   ↓
Cardinality
   ↓
ER Diagram
   ↓
Relational Schema
   ↓
Tables
   ↓
Primary Keys
   ↓
Foreign Keys
   ↓
SQL CREATE TABLE
   ↓
INSERT DATA
   ↓
SELECT DATA
   ↓
WHERE / ORDER BY / DISTINCT
   ↓
JOIN TABLES
   ↓
GROUP BY
   ↓
HAVING
   ↓
Aggregate Functions

This chain should be treated as the foundation of the student's DBMS/Oracle work.

---

73. IMPORTANT VERIFICATION STATUS

This document is a reconstructed knowledge base from the available prior context, not a verbatim transcription of the instructor's slides.

Therefore:

- Do NOT claim that every item above was definitely shown on a particular slide.
- Do NOT assume that every SQL command above was examined in the lab test.
- Do NOT add additional advanced SQL merely because it is standard SQL.
- The actual instructor slides/PPT/PDF and approved ER diagram must override this reconstruction wherever there is a difference.

Required final verification

If the original instructor slides are available, they should be supplied to the Agent.

The Agent should then produce:

1. Exact topics taught
2. Exact commands taught
3. Exact syntax taught
4. Exact query patterns taught
5. Exact examples from slides
6. ER concepts taught
7. Relational mapping rules taught
8. JOIN types actually taught
9. Aggregate/query concepts actually taught
10. Commands NOT taught / outside scope

The verified instructor material should always take priority over generic SQL knowledge.