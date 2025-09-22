import { swr } from "@/api/common";

export type UserGroup = {
  id: string;
  timestamp: string;
  name: string;
  description: string;
};

export function listGroups() {
  let { data, error, isLoading } = swr<UserGroup[]>("/api/groups");
  if (!data || error || isLoading) {
    data = [];
  }
  return { data, error, isLoading };
}

export function getGroup(id: string) {
  let { data, error, isLoading } = swr<UserGroup>(`/api/groups/${id}`);
  return { data, error, isLoading };
}
