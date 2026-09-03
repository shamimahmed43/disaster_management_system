"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { useAuth, useRequireInternal } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type PendingUser = {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
};

export default function UsersPage() {
  const { user, isAdmin } = useAuth();
  useRequireInternal();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [personnelList, setPersonnelList] = useState<{ person_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for each user
  const [selections, setSelections] = useState<Record<string, { role: string; person_id: string }>>({});

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
      fetchPersonnel();
    }
  }, [isAdmin]);

  async function fetchPendingUsers() {
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/users/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch pending users");
      const json = await res.json();
      setPendingUsers(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load pending users");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPersonnel() {
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/personnel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch personnel");
      const json = await res.json();
      setPersonnelList(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load personnel list");
    }
  }

  function handleSelectionChange(user_id: string, field: "role" | "person_id", value: string) {
    setSelections(prev => ({
      ...prev,
      [user_id]: {
        ...prev[user_id],
        [field]: value
      }
    }));
  }

  async function handleApprove(user_id: string) {
    const data = selections[user_id];
    if (!data || !data.role) {
      toast.error("Please select a role to approve.");
      return;
    }
    
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/users/approve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          user_id,
          role: data.role,
          person_id: data.person_id || null
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve");
      }
      toast.success("User approved successfully");
      fetchPendingUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleReject(user_id: string) {
    if (!confirm("Are you sure you want to reject and delete this request?")) return;
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/users/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ user_id })
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("User rejected");
      fetchPendingUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 font-mono tracking-widest uppercase">Unauthorized: Admin Access Required</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">Access Approvals</h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Review and approve pending registrations. Assign internal roles and link to Personnel ID.
          </p>
        </div>
      </div>

      <div className="bg-slate-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
          <h2 className="text-headline-md font-headline-md text-on-surface">Pending Requests</h2>
          <Badge variant="warning">{pendingUsers.length} Pending</Badge>
        </div>
        <Table>
          <TableHeader className="bg-surface-container-low">
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Assign Role</TableHead>
              <TableHead>Personnel ID (Opt)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-mono animate-pulse">Scanning requests...</td></tr>
            ) : pendingUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] opacity-50">verified_user</span>
                    <p className="text-body-md font-body-md">No pending approvals</p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant/70">
                      All systems nominal.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pendingUsers.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-mono text-xs">{u.user_id}</TableCell>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <select
                      className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:border-cyan-500 w-32"
                      value={selections[u.user_id]?.role || ""}
                      onChange={(e) => handleSelectionChange(u.user_id, "role", e.target.value)}
                    >
                      <option value="" disabled>Select Role...</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="medical_staff">Medical Staff</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:border-cyan-500 w-full font-mono max-w-[200px]"
                      value={selections[u.user_id]?.person_id || ""}
                      onChange={(e) => handleSelectionChange(u.user_id, "person_id", e.target.value)}
                    >
                      <option value="">None (Create later)</option>
                      {personnelList.map(p => (
                        <option key={p.person_id} value={p.person_id}>
                          {p.person_id} - {p.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleReject(u.user_id)}
                        className="!text-red-400 !border-red-400/30 hover:!bg-red-400/10"
                      >
                        Reject
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleApprove(u.user_id)}
                        className="!bg-cyan-500 hover:!bg-cyan-400 !text-black"
                        disabled={!selections[u.user_id]?.role}
                      >
                        Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
