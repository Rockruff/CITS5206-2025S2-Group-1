//Uses create_dialog and delete_button components and displays the groups table with search functionality
"use client";

import * as React from "react";

import CreateGroupDialog from "./create_dialog";
import DeleteGroupButton from "./delete_button";

//Uses create_dialog and delete_button components and displays the groups table with search functionality

export type Group = {
  id: string;
  name: string;
  description: string | null;
  timestamp: string;
};

export default function GroupsClient({ groups }: { groups: Group[] }) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter(
      (g) => (g.name || "").toLowerCase().includes(term) || (g.description || "").toLowerCase().includes(term),
    );
  }, [q, groups]);

  return (
    <div className="space-y-6">
      {/* Header row with title on the left and search + create on the right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Groups</h1>
          <p className="text-muted-foreground text-sm">List of user groups in the system.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search groups by name or description…"
            className="w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-80"
            aria-label="Search groups"
          />
          <CreateGroupDialog />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2">{g.description?.trim() ? g.description : "—"}</td>
                  <td className="px-3 py-2">{new Date(g.timestamp).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <DeleteGroupButton id={g.id} name={g.name} />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-3 py-8 text-center">
                    No groups match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
