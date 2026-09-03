"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";

// Pre-defined queries from 02_queries.sql — instructor taught patterns
// These are the queries the backend should expose via /api/query endpoint
const PRESET_QUERIES = [
  {
    id: "q1",
    name: "All Disaster Events",
    description: "Basic SELECT — All disaster events with duration (derived attribute)",
    category: "Basic SELECT",
    sql: `SELECT disaster_name, disaster_type, division, district, start_date,
  (end_date - start_date) AS duration_days
FROM DISASTER_EVENT
ORDER BY start_date DESC`,
  },
  {
    id: "q2",
    name: "Missing Victims",
    description: "Filtered SELECT — Victims marked as missing with contact",
    category: "Filter",
    sql: `SELECT V.victim_id, V.household_head_name, V.last_known_location, VP.phone
FROM VICTIM V
JOIN VICTIM_PHONE VP ON V.victim_id = VP.victim_id
WHERE V.missing_person = 'Y'`,
  },
  {
    id: "q3",
    name: "Shelter Available Capacity",
    description: "Derived Attribute — capacity - current occupancy (GROUP BY)",
    category: "Derived + GROUP BY",
    sql: `SELECT SH.shelter_id, SH.shelter_name, SH.capacity,
  COUNT(VSS.victim_id) AS current_occupancy,
  (SH.capacity - COUNT(VSS.victim_id)) AS available_capacity
FROM SHELTER SH
LEFT JOIN VICTIM_SHELTER_STAY VSS
  ON SH.shelter_id = VSS.shelter_id AND VSS.checkout_date IS NULL
GROUP BY SH.shelter_id, SH.shelter_name, SH.capacity`,
  },
  {
    id: "q4",
    name: "Victims per Disaster",
    description: "COUNT — Total victims grouped by disaster",
    category: "Aggregate",
    sql: `SELECT D.disaster_name, D.disaster_type,
  COUNT(V.victim_id) AS total_victims
FROM DISASTER_EVENT D
LEFT JOIN VICTIM V ON D.disaster_name = V.disaster_name
GROUP BY D.disaster_name, D.disaster_type`,
  },
  {
    id: "q5",
    name: "Disasters with 100+ Victims",
    description: "GROUP BY + HAVING — Disasters exceeding 100 victims",
    category: "HAVING",
    sql: `SELECT D.disaster_name, COUNT(V.victim_id) AS total_victims
FROM DISASTER_EVENT D
JOIN VICTIM V ON D.disaster_name = V.disaster_name
GROUP BY D.disaster_name
HAVING COUNT(V.victim_id) > 100`,
  },
  {
    id: "q6",
    name: "Personnel with Supervisors (Self JOIN)",
    description: "Self JOIN — Recursive supervisor relationship",
    category: "Self JOIN",
    sql: `SELECT E.person_id, E.name AS personnel_name,
  M.person_id AS supervisor_id, M.name AS supervisor_name
FROM PERSONNEL E
JOIN PERSONNEL M ON E.supervisor_id = M.person_id`,
  },
  {
    id: "q7",
    name: "Distribution with Vehicle (Aggregation)",
    description: "3-table JOIN — Aggregation pattern: Vehicle → Distribution → Warehouse",
    category: "Aggregation JOIN",
    sql: `SELECT V.vehicle_id, V.vehicle_type, V.registration_no,
  W.warehouse_name, D.distribution_date, D.quantity
FROM VEHICLE V
JOIN VEHICLE_DISTRIBUTION VD ON V.vehicle_id = VD.vehicle_id
JOIN DISTRIBUTION D ON VD.distribution_id = D.distribution_id
JOIN WAREHOUSE W ON D.warehouse_id = W.warehouse_id`,
  },
  {
    id: "q8",
    name: "Volunteer + Personnel (ISA JOIN)",
    description: "ISA sub-entity JOIN — Volunteer with base Personnel data",
    category: "ISA JOIN",
    sql: `SELECT P.person_id, P.name, P.phone, P.designation, V.team
FROM VOLUNTEER V
JOIN PERSONNEL P ON V.person_id = P.person_id
ORDER BY P.name`,
  },
  {
    id: "q9",
    name: "Total Donations per Warehouse",
    description: "SUM + GROUP BY — Donation aggregation by warehouse",
    category: "Aggregate",
    sql: `SELECT W.warehouse_id, W.warehouse_name,
  SUM(D.amount_or_value) AS total_donations
FROM WAREHOUSE W
LEFT JOIN DONATION D ON W.warehouse_id = D.warehouse_id
GROUP BY W.warehouse_id, W.warehouse_name`,
  },
  {
    id: "q10",
    name: "Undeployed Volunteers",
    description: "NOT IN subquery — Volunteers not yet deployed to any shelter",
    category: "Subquery",
    sql: `SELECT P.person_id, P.name, V.team
FROM VOLUNTEER V
JOIN PERSONNEL P ON V.person_id = P.person_id
WHERE P.person_id NOT IN (
  SELECT person_id FROM PERSONNEL_DEPLOYMENT
)`,
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(PRESET_QUERIES.map((q) => q.category)))];

export default function QueryBuilderPage() {
  const [selected, setSelected] = useState(PRESET_QUERIES[0]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [copied, setCopied] = useState(false);

  const filtered = categoryFilter === "All"
    ? PRESET_QUERIES
    : PRESET_QUERIES.filter((q) => q.category === categoryFilter);

  function copySQL() {
    navigator.clipboard.writeText(selected.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Query Reference</h1>
          <p className="text-on-surface-variant mt-1 text-body-md font-body-md">
            {PRESET_QUERIES.length} instructor-taught SQL queries from <span className="font-data-mono text-primary">database/02_queries.sql</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant bg-surface-container px-3 py-1.5 rounded border border-outline-variant">
            Oracle SQL Syntax
          </span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Left — Query List */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-label-caps font-label-caps text-[11px] transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-slate-surface border border-outline-variant rounded-lg overflow-hidden flex-1">
            {filtered.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelected(q)}
                className={`w-full text-left p-4 border-b border-outline-variant/50 last:border-b-0 transition-colors ${
                  selected.id === q.id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-surface-container-high"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-body-md font-body-md text-on-surface font-medium">{q.name}</span>
                  <span className="text-[10px] font-label-caps bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded shrink-0">
                    {q.category}
                  </span>
                </div>
                <p className="text-label-caps font-label-caps text-on-surface-variant mt-1">{q.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Query Detail */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-surface border border-outline-variant rounded-lg overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container flex justify-between items-center">
              <div>
                <h2 className="text-headline-md font-headline-md text-on-surface">{selected.name}</h2>
                <p className="text-body-md font-body-md text-on-surface-variant mt-0.5">{selected.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{selected.category}</Badge>
              </div>
            </div>

            {/* SQL Code */}
            <div className="bg-black/60 p-5 relative group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-label-caps font-label-caps text-outline">SQL (Oracle Syntax)</span>
                <button
                  onClick={copySQL}
                  className="flex items-center gap-1 text-label-caps font-label-caps text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-data-mono font-data-mono text-primary-fixed-dim whitespace-pre-wrap leading-relaxed text-[13px] overflow-x-auto">
                {selected.sql}
              </pre>
            </div>

            {/* Execution note */}
            <div className="p-4 bg-surface-container border-t border-outline-variant">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-warning-amber text-[20px] shrink-0">info</span>
                <div>
                  <p className="text-body-md font-body-md text-on-surface font-medium">Run this query</p>
                  <p className="text-label-caps font-label-caps text-on-surface-variant mt-1">
                    After Oracle DB is connected, this query will execute via <span className="font-data-mono text-primary">GET /api/disasters</span> or the corresponding backend route. All 34 queries from <span className="font-data-mono text-primary">database/02_queries.sql</span> are implemented as backend API endpoints.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Query map / flow */}
          <div className="bg-slate-surface border border-outline-variant rounded-lg p-5">
            <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-4">Data Flow</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {["Frontend Action", "API Call", "Backend Route", "Oracle Query", "DB Response", "Frontend Result"].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="bg-surface-container border border-outline-variant rounded px-3 py-2 text-label-caps font-label-caps text-on-surface">
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <span className="material-symbols-outlined text-on-surface-variant text-[16px]">arrow_forward</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
