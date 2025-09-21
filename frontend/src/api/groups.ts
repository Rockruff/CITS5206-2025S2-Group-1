// frontend/src/api/groups.ts
import api from "@/api/common";

export type Group = { id: string; name: string; description?: string };

export async function listGroups(): Promise<Group[]> {
  return api.get<Group[]>("/api/groups"); // ⬅️ include /api prefix
}
