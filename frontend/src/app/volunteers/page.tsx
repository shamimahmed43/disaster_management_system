"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApi } from "@/hooks/useApi";
import { getVolunteers } from "@/services/api";

type Volunteer = {
  PERSON_ID: string;
  NAME: string;
  PHONE: string;
  DESIGNATION: string;
  BASE_LOCATION: string;
  TEAM: string;
};

export default function VolunteersPage() {
  const { data, loading, error, refetch } = useApi<Volunteer[]>(getVolunteers as any);
  const volunteers = data ?? [];

  if (loading) return <LoadingState message="Loading volunteers..." />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Group by team
  const teams = Array.from(new Set(volunteers.map((v) => v.TEAM).filter(Boolean)));

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Volunteers</h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            {volunteers.length} volunteers across {teams.length} teams (ISA sub-entity of Personnel)
          </p>
        </div>
        <Link href="/personnel">
          <Button
            variant="primary"
            icon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
          >
            Register Volunteer
          </Button>
        </Link>
      </div>

      {/* Teams Summary */}
      {teams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {teams.map((team) => (
            <div key={team} className="bg-slate-surface border border-outline-variant rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px] text-command-blue">groups</span>
                <span className="text-label-caps font-label-caps text-on-surface-variant">{team}</span>
              </div>
              <div className="text-display-kpi font-display-kpi text-on-surface">
                {volunteers.filter((v) => v.TEAM === team).length}
              </div>
              <div className="text-label-caps font-label-caps text-on-surface-variant">members</div>
            </div>
          ))}
        </div>
      )}

      {/* Volunteer Table */}
      <div className="bg-slate-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-surface-container-low">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Base Location</TableHead>
              <TableHead>Designation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.length === 0 ? (
              <EmptyState message="No volunteers registered yet." icon="groups" />
            ) : (
              volunteers.map((v) => (
                <TableRow key={v.PERSON_ID} className="hover:bg-surface-container-high transition-colors">
                  <TableCell className="font-data-mono text-data-mono text-primary">{v.PERSON_ID}</TableCell>
                  <TableCell className="font-medium text-on-surface">{v.NAME}</TableCell>
                  <TableCell>
                    {v.TEAM ? (
                      <Badge variant="info">
                        <span className="material-symbols-outlined text-[12px]">groups</span>
                        {v.TEAM}
                      </Badge>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-data-mono text-data-mono text-on-surface-variant">
                    {v.PHONE || "—"}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">{v.BASE_LOCATION || "—"}</TableCell>
                  <TableCell className="text-on-surface-variant">{v.DESIGNATION || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
