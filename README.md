# Disaster Management System — DBMS Course Project

## Project Architecture

```
DBMS/
├── frontend/          # Next.js 16 + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + TypeScript
├── database/          # Oracle SQL Scripts
│   ├── 01_schema.sql  # Database Schema (Tables & Constraints)
│   └── 06_app_user.sql# User Authentication Schema
├── setup.bat          # Automated one-click setup script
├── restart.bat        # Automated startup script
└── README.md          # Project documentation
```

---

## 🚀 How to Run (Fresh Computer Setup)

We have provided a fully automated script for a fresh computer. Follow these steps exactly:

### Prerequisite: Oracle Database
You must have Oracle Database (21c XE recommended) installed and running.
Download: [Oracle 21c XE](https://www.oracle.com/database/technologies/xe-downloads.html)

### Option A: One-Click Automated Setup (Recommended)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/saidul202414006/disaster-management-system.git
   cd disaster-management-system
   ```
2. Double-click the **`setup.bat`** file in the root directory.
3. The wizard will automatically check for Node.js and SQL*Plus.
4. It will prompt you for your Oracle Database password (usually `saidul` or `system`) to configure `.env` automatically.
5. It will install all Frontend and Backend dependencies.
6. It will prompt you to automatically seed the database (creates tables). Type `Y` and press Enter.
7. Once completed, double-click **`restart.bat`** to start both servers!
8. Open `http://localhost:3000` in your browser.

### Option B: Manual Setup
If you prefer to configure everything manually:
1. Run `database/01_schema.sql` and `database/06_app_user.sql` in your Oracle terminal.
2. In the `backend` folder, copy `.env.example` to `.env` and fill in your database credentials.
3. Run `npm install` in both `frontend` and `backend` directories.
4. Run `npm run dev` in both directories.

---

## Portability — Moving to Another Computer

Our architecture separates environment variables perfectly. When cloning to a new machine:
1. Ensure Oracle DB is running.
2. Just run `setup.bat`! It will re-configure the environment and install dependencies.

---

## Database Schema Summary (ER Diagram → Relational)

| Table | ER Type |
|-------|---------|
| DISASTER_EVENT | Strong Entity (PK: disaster_name) |
| WAREHOUSE | Strong Entity |
| VEHICLE | Strong Entity |
| PERSONNEL | Strong Entity + Self JOIN (supervises) |
| SHELTER | Strong Entity |
| VICTIM | Strong Entity |
| DONATION | Strong Entity |
| FAMILY_MEMBER | **Weak Entity** (PK: victim_id + member_seq_no) |
| VICTIM_PHONE | **Multivalued Attribute** (PK: victim_id + phone) |
| VOLUNTEER | **ISA Sub-entity** (PK = person_id from PERSONNEL) |
| MEDICAL_STAFF | **ISA Sub-entity** (PK = person_id from PERSONNEL) |
| VICTIM_SHELTER_STAY | **M:N Relationship** (VICTIM ↔ SHELTER) |
| DISTRIBUTION | **Aggregation Inner** (WAREHOUSE ↔ PERSONNEL) |
| VEHICLE_DISTRIBUTION | **Aggregation Outer** (VEHICLE ↔ DISTRIBUTION) |
| PERSONNEL_DEPLOYMENT | **M:N Relationship** (PERSONNEL ↔ SHELTER) |
| PERSONNEL_STATIONED | **M:N Relationship** (PERSONNEL ↔ WAREHOUSE) |

---

## API Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new admin/victim |
| `/api/auth/login` | POST | Login and receive JWT |
| `/api/dashboard` | GET | All KPIs for admin panel |
| `/api/disasters` | GET/POST | Disaster CRUD |
| `/api/victims` | GET/POST | Victims + Multivalued Phones + Weak Entity Family |
| `/api/shelters` | GET/POST | Shelters CRUD |
| `/api/warehouses`| GET/POST | Warehouses CRUD |
| `/api/donations` | GET/POST | Donations CRUD |
| `/api/distributions`| GET/POST| Distributions (Aggregation) |
| `/api/personnel` | GET/POST | Personnel + ISA Subtypes |

---

## Technical Notes
- **No ORM:** We use raw SQL queries via `oracledb` to demonstrate pure DBMS concepts.
- **No PL/SQL:** Triggers and Stored Procedures were excluded as per course limitations.
- **Security:** JWT Authentication and bcrypt password hashing are fully implemented.
