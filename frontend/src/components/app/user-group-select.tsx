"use client";

import DynamicMultiSelect from "./dynamic-multi-select";
import api from "@/api/common";
import { UserGroup } from "@/api/users";
import { Selection } from "@/hooks/selection";

const renderItem = (userGroup: UserGroup) => {
  return <span className="truncate">{userGroup.name}</span>;
};

const fetchUserGroups = (searchQuery: string) => {
  return api.get<UserGroup[]>("/api/user-groups", { name: searchQuery });
};

export default function UserGroupSelect({
  selection,
  className,
}: {
  selection: Selection<UserGroup>;
  className?: string;
}) {
  return (
    <DynamicMultiSelect<UserGroup>
      className={className}
      selection={selection}
      fetchData={fetchUserGroups}
      renderItem={renderItem}
    />
  );
}
