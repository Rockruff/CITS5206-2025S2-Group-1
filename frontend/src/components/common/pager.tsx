import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationProps {
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
  // but a trick here is if itemIndex is 0 (due to totalItems === 0), we will to return 1
  const pageIndex = Math.floor(itemIndex / pageSize) + 1;
  return pageIndex;
}

export default function AppPagination({
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
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  return (
    <div className="flex items-center gap-2 select-none max-md:flex-col md:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm text-nowrap">Items Per Page:</span>
        <Select
          defaultValue={String(pageSize)}
          onValueChange={(value) => {
            const newPageSize = Number(value);
            setPageSize(newPageSize);
            const firstDisplayedItem = (currentPage - 1) * pageSize + 1; // we do not care if totalItems is 0 here
            const newCurrentPage = calculatePageIndex(firstDisplayedItem, newPageSize);
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
            if (newCurrentPage < 1) newCurrentPage = 1;
            if (newCurrentPage > totalPages) newCurrentPage = totalPages;
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
