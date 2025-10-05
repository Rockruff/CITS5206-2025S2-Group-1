"use client";

import { ClearableSelect, SelectClear } from "../common/clearable-select";
import { MultiSelect } from "../common/multi-select";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getGroup, listGroups } from "@/api/groups";
import { kwMatch } from "@/lib/utils";

function fetchData(search: string) {
  const { data: groups, isLoading, error } = listGroups({});

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

export function UserGroupSingleSelect({
  disabled,
  value,
  onValueChange,
  className = "w-40",
  placeholder = "Please Select...",
  cleartext,
}: {
  disabled?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  cleartext?: string;
}) {
  let { data: groups, isLoading, error } = listGroups({});

  return (
    <ClearableSelect
      disabled={disabled}
      value={value}
      onValueChange={(v) => {
        if (v === undefined) onValueChange("");
        else onValueChange(v);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {error ? (
          <SelectClear disabled={true}>(Error Loading Options)</SelectClear>
        ) : isLoading ? (
          <SelectClear disabled={true}>(Loading...)</SelectClear>
        ) : !groups || groups.length === 0 ? (
          <SelectClear disabled={true}>(No Options Available)</SelectClear>
        ) : (
          <>
            {cleartext && <SelectClear>{cleartext}</SelectClear>}
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </ClearableSelect>
  );
}
