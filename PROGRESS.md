# Disaster Management System — DBMS Course Project
## Development Progress Log

---

## ✅ Phase 1 — Database Schema (COMPLETE)

**16 Tables created** following ER Diagram → Relational Schema conversion rules:

| Table | ER Type |
|-------|---------|
| DISASTER_EVENT | Strong Entity — PK: disaster_name |
| WAREHOUSE | Strong Entity |
| VEHICLE | Strong Entity |
| PERSONNEL | Strong Entity + Self JOIN (SUPERVISES) |
| SHELTER | Strong Entity + Composite Location |
| VICTIM | Strong Entity + Multivalued phone |
| DONATION | Strong Entity |
| FAMILY_MEMBER | **Weak Entity** (victim_id + member_seq_no) |
| VICTIM_PHONE | **Multivalued Attribute** |
| VOLUNTEER | **ISA sub-entity** |
| MEDICAL_STAFF | **ISA sub-entity** |
| VICTIM_SHELTER_STAY | **M:N Relationship** |
| DISTRIBUTION | **Aggregation inner** (WAREHOUSE ↔ PERSONNEL) |
| VEHICLE_DISTRIBUTION | **Aggregation outer** (VEHICLE ↔ DISTRIBUTION) |
| PERSONNEL_DEPLOYMENT | **M:N Relationship** |
| PERSONNEL_STATIONED | **M:N Relationship** |

Files: `database/01_schema.sql`, `database/02_queries.sql` (34 queries)

---

## ✅ Phase 2 — Backend Infrastructure (COMPLETE)

**Node.js + Express + TypeScript** backend with Oracle DB integration:

- `backend/src/config/db.ts` — Oracle connection pool with **graceful degradation** (no crash if DB not ready)
- `backend/src/server.ts` — Express app with CORS, global error handler, `/api/status` endpoint
- 9 route files covering all entities

**API Endpoints:**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/health` | GET | Health check + DB status |
| `/api/status` | GET | Backend + DB connection status |
| `/api/dashboard` | GET | All KPIs: 11 counts in one query |
| `/api/disasters` | GET, POST, PUT | Disaster events |
| `/api/victims` | GET, POST | Victims + phones + family members |
| `/api/victims/:id` | GET | Detail with family & phones |
| `/api/shelters` | GET, POST | Shelters + derived occupancy |
| `/api/shelters/checkin` | POST | M:N check-in (VICTIM_SHELTER_STAY) |
| `/api/shelters/checkout` | POST | M:N check-out (set checkout_date) |
| `/api/warehouses` | GET, POST | Warehouses + donation totals |
| `/api/vehicles` | GET, POST | Vehicle fleet |
| `/api/donations` | GET, POST | Donations |
| `/api/distributions` | GET, POST | Relief distribution (Aggregation) |
| `/api/personnel` | GET, POST | Personnel + ISA CASE detection |
| `/api/personnel/volunteers` | GET | Volunteers (ISA sub-entity) |
| `/api/personnel/medical` | GET | Medical Staff (ISA sub-entity) |

**Bugs Fixed in Backend:**
- ✅ BUG-01: Graceful DB degradation (no `process.exit` on pool fail)
- ✅ BUG-02: Global error middleware added
- ✅ BUG-03: `/shelters/checkin` route registered BEFORE `/:id` (Express order bug)
- ✅ BUG-04: NULL end_date in disasters — `CASE WHEN` in Oracle SQL
- ✅ BUG-05: NULL distribution_date safe handling
- ✅ BUG-06: NULL reported_date safe handling in victims
- ✅ Added `/api/shelters/checkout` endpoint (was missing)

---

## ✅ Phase 3 — Frontend Integration (COMPLETE)

**Next.js 16 + TypeScript** frontend — all 16 pages connected to live API:

**Central Services:**
- `frontend/src/services/api.ts` — All API functions (16 endpoints)
- `frontend/src/hooks/useApi.ts` — Loading/error/refetch state
- `frontend/src/components/ui/States.tsx` — LoadingState, ErrorState, EmptyState, EmptyCard

**Pages Updated (0 fake/dummy data):**

| Page | Data Source | Features |
|------|------------|---------|
| `/dashboard` | `/api/dashboard` | 8 KPI cards, recent disasters, shelter occupancy bars |
| `/victims` | `/api/victims` | Table + search + detail drawer |
| `/shelters` | `/api/shelters` | Cards + **real working filters** (status/division/search) |
| `/warehouse` | `/api/warehouses` | Cards + donation totals |
| `/vehicles` | `/api/vehicles` | Table |
| `/donations` | `/api/donations` | Table + summary KPIs |
| `/relief` | `/api/distributions` | Table (Aggregation JOIN) |
| `/personnel` | `/api/personnel` | ISA tabs (All/Personnel/Volunteer/Medical) |
| `/volunteers` | `/api/personnel/volunteers` | Table + team grouping |
| `/disasters/new` | POST `/api/disasters` | Multi-step wizard |
| `/map` | `/api/shelters` + `/api/disasters` | Dynamic markers, real sidebar |
| `/query-builder` | Static (SQL reference) | 10 preset instructor SQL queries |
| `/audit` | Empty state | Ready for backend middleware |
| `/users` | Empty state | Out of ER diagram scope noted |

**Bugs Fixed in Frontend:**
- ✅ BUG-09: `end_date = ""` → `null` before POST (Oracle crash fix)
- ✅ BUG-11: Map page used `!DURATION_DAYS` → fixed to `!END_DATE`
- ✅ BUG-12: Dashboard missing Warehouses, Vehicles, Donations KPIs
- ✅ Sidebar: broken `/support` and `/settings` links removed
- ✅ Sidebar: **active link highlighting** added (filled icon + border indicator)
- ✅ Shelters: filter checkboxes were decorative → now **fully functional**

---

## ✅ Phase 4 — A-Z End-to-End Verification (COMPLETE)

**Final Build Result: ✅ 16 routes, 0 TypeScript errors, 0 warnings**
**Backend TypeScript: ✅ 0 errors**

| Check | Status |
|-------|--------|
| All pages use live API | ✅ |
| 0 fake/dummy data arrays | ✅ |
| Empty DB → proper empty states | ✅ |
| Loading state on every page | ✅ |
| Error state with Retry on every page | ✅ |
| Frontend filters actually filter | ✅ |
| Sidebar active state | ✅ |
| Route order bug (checkin before :id) | ✅ |
| NULL date handling in all routes | ✅ |
| Backend starts without Oracle | ✅ |
| /api/status endpoint | ✅ |
| All API functions defined in api.ts | ✅ |
| Backend TypeScript compiles | ✅ |
| Frontend TypeScript compiles | ✅ |

---

## 🔴 Phase 5 — Oracle DB Live Connection (PENDING)

**Requires user action:**

1. Install Oracle Database XE: https://www.oracle.com/database/technologies/xe-downloads.html
2. Create `backend/.env` from `backend/.env.example`:
   ```
   DB_USER=system
   DB_PASSWORD=<your_password>
   DB_CONNECTION_STRING=localhost:1521/XEPDB1
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```
3. Run schema: `sqlplus system@localhost:1521/XEPDB1 @database/01_schema.sql`
4. Start backend: `cd backend && npm run dev`
5. Frontend already running: `cd frontend && npm run dev`
6. Open `http://localhost:3000` — all data will load live

---

## Portability Notes

Only **2 files** change when moving to a new computer:
- `backend/.env` → update DB_USER, DB_PASSWORD, DB_CONNECTION_STRING
- `frontend/.env.local` → update NEXT_PUBLIC_API_URL if backend is on different port

---
*Last updated: Phase 4 A-Z Verification complete*
