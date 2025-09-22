import { swr } from "./common";

export type User = {
  id: string;
  avatar: string;
  name: string;
  role: "ADMIN" | "VIEWER";
  aliases: string[];
  groups: string[];
};

export type ListUserResponse = {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  items: User[];
};

export function getUser(id: string) {
  return swr<User>("/api/users/" + id);
}

export function getCurrentUser() {
  return swr<User>("/api/users/me");
}

export function listUsers({
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
  const params: Record<string, any> = {};

  if (search) {
    const id = parseInt(search);
    const key = Number.isNaN(id) ? "name" : "id";
    params[key] = search;
  }
  if (group) params.group = group;
  if (role) params.role = role;
  if (order_by) params.order_by = order_by;

  params.page = page;
  params.page_size = page_size;

  let { data, error, isLoading } = swr<ListUserResponse>("/api/users", params);

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
