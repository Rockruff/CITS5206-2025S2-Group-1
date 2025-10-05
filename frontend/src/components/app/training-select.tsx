"use client";

import { ClearableSelect, SelectClear } from "../common/clearable-select";
import { MultiSelect } from "../common/multi-select";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getTraining, listTrainings } from "@/api/trainings";
import { kwMatch } from "@/lib/utils";

function fetchData(search: string) {
  const { data: trainings, isLoading, error } = listTrainings({});

  if (!trainings)
    return {
      data: [],
      isLoading,
      error,
    };

  return {
    data: trainings.filter((training) => kwMatch(training.name, search)).map((training) => training.id),
    isLoading,
    error,
  };
}

export function TrainingRenderer({ value: id }: { value: string }) {
  const { data: training } = getTraining(id);
  if (!training) return null;
  return (
    <div className="flex flex-col">
      <span className="truncate">{training.name}</span>
      <span className="text-muted-foreground text-[.5em]/normal">{training.type}</span>
    </div>
  );
}

export function TrainingSelect({
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
      renderData={TrainingRenderer}
    />
  );
}

export function TrainingSingleSelect({
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
  let { data: trainings, isLoading, error } = listTrainings({});

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
        ) : !trainings || trainings.length === 0 ? (
          <SelectClear disabled={true}>(No Options Available)</SelectClear>
        ) : (
          <>
            {cleartext && <SelectClear>{cleartext}</SelectClear>}
            {trainings.map((training) => (
              <SelectItem key={training.id} value={training.id}>
                {training.name}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </ClearableSelect>
  );
}
