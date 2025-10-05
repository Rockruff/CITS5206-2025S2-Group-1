"use client";

import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SingleDatePickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onValueChange, placeholder = "Select date", className }: SingleDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = value ? new Date(value) : undefined;
  const isValid = date && !isNaN(date.getTime());
  const selected = isValid ? date : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-48 justify-between text-left font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 opacity-60" />
            {selected ? selected.toLocaleDateString() : placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          onSelect={(date) => {
            if (!date) {
              onValueChange?.("");
              setOpen(false);
              return;
            }
            onValueChange?.(date.toISOString());
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
