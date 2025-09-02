export interface User {
  id: string;
  uwa_ids: string[];
  name: string;
  role: "ADMIN" | "VIEWER";
}

export interface UserGroup {
  id: string;
  name: string;
}
