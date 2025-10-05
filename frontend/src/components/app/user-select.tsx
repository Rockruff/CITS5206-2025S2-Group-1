"use client";

import { MultiSelect } from "../common/multi-select";
import { getUser, listUsers } from "@/api/users";

function fetchData(search: string) {
  const { data, isLoading, error } = listUsers({ search });

  if (!search)
    return {
      data: [],
      needMoreSearch: true,
    };

  if (!data)
    return {
      data: [],
      isLoading,
      error,
    };

  const users = data.items;

  return {
    data: users.map((user) => user.id),
    isLoading,
    error,
  };
}

export function UserRenderer({ value: id }: { value: string }) {
  const { data: user } = getUser(id);
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 flex-shrink-0">
        <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
      </div>
      <div>
        <div className="text-sm">{user.name}</div>
        <div className="text-xs before:content-['('] after:content-[')']">{user.id}</div>
      </div>
    </div>
  );
}

export function UserSelect({
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
      renderData={UserRenderer}
    />
  );
}
