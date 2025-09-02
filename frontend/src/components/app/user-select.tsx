"use client";

import DynamicMultiSelect from "./dynamic-multi-select";
import api from "@/api/common";
import { User } from "@/api/users";
import { Selection } from "@/hooks/selection";

const renderItem = (user: User) => {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 flex-shrink-0">
        <img
          className="h-10 w-10 rounded-full"
          src={`https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(user.name)}`}
          alt={user.name}
        />
      </div>
      <div>
        <div className="text-sm">{user.name}</div>{" "}
        <div className="text-xs before:content-['('] after:content-[')']">{user.uwa_ids.join(", ")}</div>
      </div>
    </div>
  );
};

const fetchUsers = (searchQuery: string) => {
  return api.get<User[]>("/api/users", { name: searchQuery });
};

export default function UserSelect({ selection, className }: { selection: Selection<User>; className?: string }) {
  return (
    <DynamicMultiSelect<User>
      className={className}
      selection={selection}
      fetchData={fetchUsers}
      renderItem={renderItem}
    />
  );
}
