// frontend/src/app/dashboard/groups/page.tsx
import { headers } from "next/headers";
import React from "react";

import GroupsClient, { Group } from "./groups_client";

async function getGroups(): Promise<Group[]> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/groups`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Failed to load groups: ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export default async function GroupsPage() {
  const groups = await getGroups();
  return <GroupsClient groups={groups} />;
}
