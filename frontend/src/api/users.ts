import useSWR from "swr";

import { fetcher } from "./common";

export interface User {
  id: string;
  name: string;
  role: "ADMIN" | "VIEWER";
  aliases: string[];
  groups: string[];
}

export interface UserGroup {
  id: string;
  name: string;
}

export interface ListUserResponse {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  items: User[];
}

export function useUsers({
  search,
  group,
  role,
  order_by,
  page = 1,
  page_size = 10,
}: {
  search?: string;
  group?: string;
  role?: string;
  order_by?: string;
  page?: number;
  page_size?: number;
}) {
  const params = new URLSearchParams();

  if (search) {
    // if name looks like id, then search by id
    // otherwise, search by name
    const id = parseInt(search);
    const key = Number.isNaN(id) ? "name" : "id";
    params.set(key, search);
  }
  if (group) params.set("group", group);
  if (role) params.set("role", role);
  if (order_by) params.set("order_by", order_by);

  params.set("page", String(page));
  params.set("page_size", String(page_size));

  let { data, error, isLoading } = useSWR<ListUserResponse>(`/api/users?${params}`, fetcher);

  if (!data || error || isLoading) {
    data = {
      page: page,
      page_size: page_size,
      total_pages: 0,
      total_items: 0,
      items: [],
    } satisfies ListUserResponse;
  }

  return { data, error, isLoading };
}

export function useGroups() {
  let { data, error, isLoading } = useSWR<UserGroup[]>("/api/groups", fetcher);

  if (!data || error || isLoading) {
    data = [];
  }

  return { data, error, isLoading };
}
