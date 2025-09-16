import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

export default function ({
  orderBy,
  setOrderBy,
  columns,
}: {
  orderBy: string;
  setOrderBy: (v: string) => void;
  columns: string[];
}) {
  return (
    <Select value={orderBy} onValueChange={setOrderBy}>
      <SelectTrigger size="sm" className="-mx-4 border-none bg-transparent px-4 shadow-none [&>:last-child]:hidden">
        {columns.map((column, index) => {
          const asc = column.toLowerCase();
          const desc = `-${asc}`;
          return (
            <div key={index} className="group contents">
              <span className="group-first:hidden">/</span>
              <span className="text-xs font-bold">{column}</span>
              {orderBy === asc && <ArrowUpIcon className="size-3" />}
              {orderBy === desc && <ArrowDownIcon className="size-3" />}
            </div>
          );
        })}
      </SelectTrigger>
      <SelectContent>
        {columns.map((column, index) => {
          const asc = column.toLowerCase();
          const desc = `-${asc}`;
          return (
            <React.Fragment key={index}>
              <SelectItem value={asc}>
                <ArrowUpIcon className="size-4" />
                <span>{columns.length > 1 && column} Ascending</span>
              </SelectItem>
              <SelectItem value={desc}>
                <ArrowDownIcon className="size-4" />
                <span>{columns.length > 1 && column} Descending</span>
              </SelectItem>
            </React.Fragment>
          );
        })}
      </SelectContent>
    </Select>
  );
}
