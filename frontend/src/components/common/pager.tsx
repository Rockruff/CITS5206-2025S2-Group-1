import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaginationProps {
  // style
  className?: string;
  // in
  totalItems: number;
  pageSizeOptions: number[];
  // in/out
  pageSize: number;
  setPageSize: (_size: number) => void;
  currentPage: number;
  setCurrentPage: (_page: number) => void;
}

function calculatePageIndex(itemIndex: number, pageSize: number): number {
  // itemIndex is 1-based, pageIndex is 1-based
  // return value can be 0 if itemIndex === 0 due to totalItems === 0
  const pageIndex = Math.ceil(itemIndex / pageSize);
  return pageIndex;
}

export default function AppPagination({
  className,
  totalItems,
  pageSizeOptions,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
}: PaginationProps) {
  // validate total items
  if (!Number.isSafeInteger(totalItems) || totalItems < 0) {
    throw new Error("totalItems must be a non-negative integer");
  }
  // validate page size options
  for (const pageSizeOption of pageSizeOptions)
    if (!Number.isSafeInteger(pageSizeOption) || pageSizeOption <= 0)
      throw new Error("pageSizeOptions must be positive integers");
  if (pageSizeOptions.indexOf(pageSize) < 0) {
    throw new Error("pageSize must be one of pageSizeOptions");
  }

  // if the current page is invalid, we will just correct it for user
  // note that, the correction only happens for this component
  // it does not correct the input state
  // input state will be updated when user navigates to a different page
  const totalPages = calculatePageIndex(totalItems, pageSize);
  if (!Number.isInteger(currentPage)) {
    throw new Error("currentPage must be a positive integer");
  }
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const firstDisplayedItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const lastDisplayedItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn("flex items-center justify-center gap-4 select-none md:justify-between", className)}>
      <div className="flex items-center gap-2 max-md:hidden">
        <span className="text-muted-foreground text-sm text-nowrap">Items Per Page:</span>
        <Select
          defaultValue={String(pageSize)}
          onValueChange={(value) => {
            const newPageSize = Number(value);
            setPageSize(newPageSize);
            let newCurrentPage = calculatePageIndex(firstDisplayedItem, newPageSize);
            if (newCurrentPage < 1) newCurrentPage = 1;
            setCurrentPage(newCurrentPage);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground text-sm max-md:hidden">
        Showing {firstDisplayedItem}-{lastDisplayedItem} of {totalItems} items
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
          <ChevronLeftIcon />
        </Button>
        <span className="text-muted-foreground text-sm text-nowrap">Page</span>
        <Input
          className="text-sm"
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            let newCurrentPage = e.target.valueAsNumber;
            if (!Number.isSafeInteger(newCurrentPage)) return;
            if (newCurrentPage > totalPages) newCurrentPage = totalPages;
            if (newCurrentPage < 1) newCurrentPage = 1;
            setCurrentPage(newCurrentPage);
          }}
        />
        <span className="text-muted-foreground text-sm text-nowrap">of {totalPages}</span>
        <Button variant="ghost" size="icon" onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
