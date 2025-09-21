// frontend/src/app/dashboard/groups/page.tsx
import { headers } from "next/headers";
import React from "react";

type Group = {
  id: string;
  name: string;
  description: string | null;
  timestamp: string;
};

async function getGroups(): Promise<Group[]> {
  // Build absolute same-origin base for server components
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/groups`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load groups: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Groups</h1>
      <p className="text-muted-foreground mb-6 text-sm">List of user groups in the system.</p>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2">{g.description?.trim() ? g.description : "—"}</td>
                  <td className="px-3 py-2">{new Date(g.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted-foreground px-3 py-8 text-center">
                    No groups found.
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
