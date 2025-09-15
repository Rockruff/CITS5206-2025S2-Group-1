"use client";

import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { UserGroup, useGroups } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Selection } from "@/hooks/selection";
import { cn } from "@/lib/utils";

const renderItem = (userGroup: UserGroup) => <span className="truncate">{userGroup.name}</span>;

export default function UserGroupSelect({
  selection,
  className = "w-64",
}: {
  selection: Selection<UserGroup>;
  className?: string;
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: groups = [], isLoading } = useGroups();

  const [open, setOpen] = useState(false);
  const unSelectedItems = groups.filter((item) => !selection.has(item));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          <span className="truncate">{selection.length} Selected</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" onWheel={(e) => e.stopPropagation()}>
        <Command className="max-h-[40vh]">
          <div className="flex h-9 flex-none items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              className="w-full bg-transparent text-sm outline-hidden"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
            />
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
                <span className="text-sm/none">{!searchQuery ? "Search to find options" : "No options found"}</span>
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
