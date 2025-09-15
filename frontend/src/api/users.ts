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
  searchFilter,
  groupFilter,
  roleFilter,
  orderBy,
  currentPage = 1,
  pageSize = 10,
}: {
  searchFilter?: string;
  groupFilter?: string;
  roleFilter?: string;
  orderBy?: string;
  currentPage?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();

  if (searchFilter) {
    // if name looks like id, then search by id
    // otherwise, search by name
    const id = parseInt(searchFilter);
    const key = Number.isNaN(id) ? "name" : "id";
    search.set(key, searchFilter);
  }
  if (groupFilter) search.set("group", groupFilter);
  if (roleFilter) search.set("role", roleFilter);
  if (orderBy) search.set("order_by", orderBy);

  search.set("page", String(currentPage));
  search.set("page_size", String(pageSize));

  let { data, error, isLoading } = useSWR<ListUserResponse>(`/api/users?${search}`, fetcher);

  if (!data || error || isLoading) {
    data = {
      page: currentPage,
      page_size: pageSize,
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
