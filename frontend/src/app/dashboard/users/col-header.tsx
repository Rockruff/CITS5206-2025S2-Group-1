import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, EyeOff } from "lucide-react";
import { HTMLAttributes, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface IDataGridColumnHeader<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title?: string;
  filter?: ReactNode;
}

export function DataGridColumnHeader<TData, TValue>({
  column,
  title = "",
  className,
  filter,
}: IDataGridColumnHeader<TData, TValue>) {
  if (!filter && !column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  if (!filter && !column.getCanHide() && column.getCanSort()) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("data-[state=open]:bg-accent -ms-3 h-8 !ring-0 !ring-offset-0", className)}
        onClick={() => {
          // Determine the current sorting state
          const isSorted = column.getIsSorted();
          if (isSorted === "asc") {
            column.toggleSorting(true); // Switch to desc
          } else if (isSorted === "desc") {
            column.clearSorting(); // Clear to unsorted
          } else {
            column.toggleSorting(false); // Switch to asc
          }
        }}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDown className="!size-[0.825rem]" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp className="!size-[0.825rem]" />
        ) : (
          <ChevronsUpDown className="!size-[0.825rem]" />
        )}
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("data-[state=open]:bg-accent -ms-3 h-8 text-xs !ring-0 !ring-offset-0", className)}
          >
            <span className="">{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="!size-[1em]" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="!size-[1em]" />
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {filter && (
            <>
              <DropdownMenuLabel>{filter}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="text-muted-foreground/90 !size-[0.825rem]" />
                <span className="grow">Asc</span>
                {column.getIsSorted() === "asc" && <Check className="text-muted-foreground/90 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="text-muted-foreground/90 !size-[0.825rem]" />
                <span className="grow">Desc</span>
                {column.getIsSorted() === "desc" && <Check className="text-muted-foreground/90 size-4" />}
              </DropdownMenuItem>
            </>
          )}

          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="text-muted-foreground/90 !size-[0.825rem]" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
