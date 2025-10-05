import { swr } from "@/api/common";
import { kwMatch } from "@/lib/utils";

export type UserGroup = {
  id: string;
  timestamp: string;
  name: string;
  description: string;
  trainings: string[];
};

export function listGroups({ search, order_by = "name" }: { search?: string; order_by?: string }) {
  let { data, error, isLoading } = swr<UserGroup[]>("/api/groups");

  if (!data || error || isLoading) {
    data = [];
    return { data, error, isLoading };
  }

  if (search) {
    data = data.filter(
      (g) =>
        kwMatch(g.name, search) || // search by name
        kwMatch(g.description, search), // search by description
    );
  }

  if (order_by) {
    const desc = order_by.startsWith("-");
    if (desc) order_by = order_by.slice(1);
    if (["created", "name", "description"].includes(order_by)) {
      if (order_by === "created") order_by = "timestamp"; // alias
      data = data.sort((a, b) => {
        let order = a[order_by as keyof UserGroup] < b[order_by as keyof UserGroup];
        let orderValue = order ? -1 : 1;
        if (desc) orderValue = -orderValue;
        return orderValue;
      });
    }
  }

  return { data, error, isLoading };
}

export function getGroup(id: string) {
  let { data, error, isLoading } = swr<UserGroup>(`/api/groups/${id}`);
  return { data, error, isLoading };
}
