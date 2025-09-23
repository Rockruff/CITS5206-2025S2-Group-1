"use client";

import { MultiSelect } from "../common/multi-select";
import { getGroup, listGroups } from "@/api/groups";
import { kwMatch } from "@/lib/utils";

function fetchData(search: string) {
  const { data: groups, isLoading, error } = listGroups();

  if (!groups)
    return {
      data: [],
      isLoading,
      error,
    };

  return {
    data: groups.filter((group) => kwMatch(group.name, search)).map((group) => group.id),
    isLoading,
    error,
  };
}

function renderData({ value: id }: { value: string }) {
  const { data: group } = getGroup(id);
  if (!group) return null;
  return <span className="truncate">{group.name}</span>;
}

export function UserGroupSelectV2({
  disabled,
  value,
  onValueChange,
  className = "w-64",
}: {
  disabled?: boolean;
  value: string[];
  onValueChange: (v: string[]) => void;
  className?: string;
}) {
  return (
    <MultiSelect
      disabled={disabled}
      className={className}
      value={value}
      onValueChange={onValueChange}
      fetchData={fetchData}
      renderData={renderData}
    />
  );
}
