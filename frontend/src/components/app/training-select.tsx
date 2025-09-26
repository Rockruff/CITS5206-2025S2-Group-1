"use client";

import { MultiSelect } from "../common/multi-select";
import { getTraining, listTrainings } from "@/api/trainings";
import { kwMatch } from "@/lib/utils";

function fetchData(search: string) {
  const { data: trainings, isLoading, error } = listTrainings();

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

function renderData({ value: id }: { value: string }) {
  const { data: training } = getTraining(id);
  if (!training) return null;
  return <span className="truncate">{training.name}</span>;
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
      renderData={renderData}
    />
  );
}
