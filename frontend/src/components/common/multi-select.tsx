"use client";

import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function MultiSelect({
  disabled,
  value,
  onValueChange,
  className,
  fetchData,
  renderData: RenderItem,
}: {
  disabled?: boolean;
  value: string[];
  onValueChange: (v: string[]) => void;
  className?: string;
  fetchData: (search: string) => { data: string[]; needMoreSearch?: boolean; isLoading?: boolean; error?: any };
  renderData: ({ value }: { value: string }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<string>("");
  const { needMoreSearch, data, isLoading, error } = fetchData(search);

  const candidates = data;
  const selected = value;
  const unselected = candidates.filter((v) => !selected.includes(v));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          <span className="truncate">{selected.length} Selected</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" onWheel={(e) => e.stopPropagation()}>
        <Command className="max-h-[40vh]">
          {!disabled && (
            <div className="flex h-9 flex-none items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 opacity-50" />
              <input
                className="w-full bg-transparent text-sm outline-hidden"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
              />
            </div>
          )}
          <CommandList>
            {selected.length > 0 && (
              <CommandGroup className="border-b">
                {selected.map((v) => (
                  <CommandItem
                    key={v}
                    value={v}
                    onSelect={() => {
                      if (!disabled) onValueChange(selected.filter((x) => x !== v));
                    }}
                  >
                    <RenderItem value={v} />
                    <CheckIcon className="ml-auto" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {disabled ? null : error ? (
              <div className="text-muted-foreground flex h-10 items-center justify-center gap-2">
                <span className="text-sm/none">Failed to load data</span>
              </div>
            ) : needMoreSearch ? (
              <div className="text-muted-foreground flex h-10 items-center justify-center gap-2">
                <span className="text-sm/none">Search to find options</span>
              </div>
            ) : isLoading ? (
              <div className="text-muted-foreground flex h-10 items-center justify-center gap-2">
                <LoaderCircleIcon className="size-4 animate-spin" />
                <span className="text-sm/none">Loading...</span>
              </div>
            ) : unselected.length === 0 ? (
              <div className="text-muted-foreground flex h-10 items-center justify-center gap-2">
                <span className="text-sm/none">No options found</span>
              </div>
            ) : (
              <CommandGroup>
                {unselected.map((v) => (
                  <CommandItem key={v} value={v} onSelect={() => onValueChange([v, ...selected])}>
                    <RenderItem value={v} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
