"use client";

import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedFetch } from "@/hooks/debounced-fetch";
import { Selection } from "@/hooks/selection";
import { cn } from "@/lib/utils";

export default function DynamicMultiSelect<T extends { id: string }>({
  selection,
  renderItem,
  fetchData,
  className = "w-64",
  allowEmptyQuery = false,
}: {
  selection: Selection<T>;
  renderItem: (_item: T) => React.ReactNode;
  fetchData: (_searchQuery: string) => Promise<T[]>;
  className?: string; // should be used to set width only
  allowEmptyQuery?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [candidateItems, isLoading] = useDebouncedFetch<T[]>(
    () => {
      if (!searchQuery && !allowEmptyQuery) return Promise.resolve([]);
      return fetchData(searchQuery);
    },
    [searchQuery],
    200,
  );

  const [open, setOpen] = useState(false);

  const unSelectedItems = (candidateItems || []).filter((item) => {
    return !selection.has(item);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          <span className="truncate">{selection.length} Selected</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <div className="flex h-9 items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              className="w-full bg-transparent text-sm outline-hidden"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
            ></input>
          </div>
          <CommandList>
            {selection.length > 0 && (
              <CommandGroup className="border-b">
                {selection.map((item) => (
                  <CommandItem key={item.id} value={item.id} onSelect={() => selection.remove(item)}>
                    {renderItem(item)}
                    <CheckIcon className="ml-auto" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isLoading ? (
              <div className="text-muted-foreground flex h-10 items-center justify-center gap-2">
                <LoaderCircleIcon className="size-4 animate-spin" />
                <span className="text-sm/none">Loading...</span>
              </div>
            ) : unSelectedItems.length === 0 ? (
              <div className="text-muted-foreground flex h-10 items-center justify-center gap-2">
                <span className="text-sm/none">
                  {!searchQuery && !allowEmptyQuery ? "Search to find options" : "No options found"}
                </span>
              </div>
            ) : (
              <CommandGroup>
                {unSelectedItems.map((item) => (
                  <CommandItem key={item.id} value={item.id} onSelect={() => selection.add(item)}>
                    {renderItem(item)}
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
