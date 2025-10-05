"use client";

import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Converts open range [from, to + 1day) into display range [from, to].
 */
function deserializeRange(from: string, to: string): DateRange | undefined {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // if any invalid, return undefined
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return undefined;
  }

  // ensure order
  let start = fromDate;
  let end = toDate;
  if (start > end) [start, end] = [end, start];

  // adjust for inclusive display ([from, to])
  const displayTo = new Date(end);
  displayTo.setDate(displayTo.getDate() - 1);

  return { from: start, to: displayTo };
}

/**
 * Converts user-selected display range [from, to] into open range [from, to + 1day) for processing.
 */
function serializeRange(range: DateRange | undefined): [string, string] {
  if (!range || !range.from || !range.to) return ["", ""];

  let { from, to } = range;
  if (from > to) [from, to] = [to, from];

  const backendTo = new Date(to);
  backendTo.setDate(backendTo.getDate() + 1);

  return [from.toISOString(), backendTo.toISOString()];
}

export default function DateRangePicker({
  className,
  from,
  to,
  onChange,
}: {
  className?: string;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const range = deserializeRange(from, to);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant={range ? "default" : "outline"}>
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={(d: DateRange | undefined) => {
              const [fromStr, toStr] = serializeRange(d);
              onChange(fromStr, toStr);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
