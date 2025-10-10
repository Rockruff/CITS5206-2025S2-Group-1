"use client";

import { EditIcon, EllipsisIcon, PlusIcon, Trash2Icon } from "lucide-react";
import React from "react";
import { useSWRConfig } from "swr";

import {
  BatchDeleteTrainingRecordsDialog,
  CreateTrainingRecordDialog,
  DeleteTrainingRecordDialog,
  EditTrainingRecordDialog,
} from "./dialogs";
import { listTrainingRecords } from "@/api/training-records";
import { TrainingRenderer, TrainingSingleSelect } from "@/components/app/training-select";
import { StatusBadge } from "@/components/app/training-status-badage";
import { UserRenderer } from "@/components/app/user-select";
import DateRangePicker from "@/components/common/date-range-picker";
import TableHeader from "@/components/common/orderby";
import AppPagination from "@/components/common/pager";
import TableErrorDisplay from "@/components/common/table-error-display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSet } from "@/hooks/reactive-set";
import { useQueryParamsState } from "@/hooks/search";
import { cn, formatDate } from "@/lib/utils";

export default function TrainingRecords() {
  const { mutate } = useSWRConfig();
  const selection = useSet<string>();

  const [query, setQuery] = useQueryParamsState({
    search: "",
    training: "",
    order_by: "id",
    page: 1,
    page_size: 10,
    from: "",
    to: "",
  });

  const recordsReq = listTrainingRecords(query);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">Training Records</h1>
        <p className="text-muted-foreground">Manage training completion records.</p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input
            type="text"
            value={query.search}
            onValueChange={(value) => setQuery({ search: value, page: 1 })}
            placeholder="Search by User Name or User ID..."
          />

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">Training:</label>
            <TrainingSingleSelect
              value={query.training}
              onValueChange={(v) => setQuery({ training: v, page: 1 })}
              placeholder="Any Training"
              cleartext="Any Training"
            />
          </div>

          <DateRangePicker
            from={query.from}
            to={query.to}
            onChange={(from, to) => {
              setQuery({ from, to, page: 1 });
            }}
          />

          <CreateTrainingRecordDialog>
            <Button size="icon">
              <PlusIcon />
            </Button>
          </CreateTrainingRecordDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Selected {selection.length} Records</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <BatchDeleteTrainingRecordsDialog selection={selection}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete Selected</DropdownMenuItem>
              </BatchDeleteTrainingRecordsDialog>
              <DropdownMenuItem>Export Records</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => selection.clear()}>Clear Selection</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <table
          className={cn(
            "[&_tbody_tr]:h-16 [&_thead_tr]:h-12", // height config
            "flex flex-1 flex-col overflow-x-auto overflow-y-hidden", // x-scrollable table
            "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto", // y-scrollable tbody
            "border-y [&_tbody]:mb-[-1px] [&_tr]:border-b", // borders, with deduplication at bottom
            "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8", // row style
            "[&_td]:text-sm [&_th]:text-xs [&_th]:font-bold [&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2", // cell style
            "[&_th,td]:w-20 [&_th,td]:last:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:flex-1 [&_th,td]:nth-3:w-64 [&_thead,tbody]:min-w-160", // column width
          )}
        >
          <thead>
            <tr>
              <th>
                <Checkbox
                  checked={selection.has(...(recordsReq.data?.items.map((record) => record.id) || []))}
                  onCheckedChange={(v) =>
                    (v ? selection.add : selection.remove)(...(recordsReq.data?.items.map((record) => record.id) || []))
                  }
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Name", "ID"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Training"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Completed"]}
                />
              </th>
              <th>
                <div className="text-xs font-bold">Status</div>
              </th>
              <th>
                <div className="text-xs font-bold">Action</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {recordsReq.data?.items.map((record) => (
              <tr key={record.id}>
                <td>
                  <Checkbox
                    checked={selection.has(record.id)}
                    onCheckedChange={(v) => (v ? selection.add(record.id) : selection.remove(record.id))}
                  />
                </td>
                <td>
                  <UserRenderer value={record.user} />
                </td>
                <td>
                  <TrainingRenderer value={record.training} />
                </td>
                <td>{formatDate(record.timestamp)}</td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                <td>
                  <div className="flex gap-2">
                    <EditTrainingRecordDialog record={record}>
                      <Button size="icon">
                        <EditIcon />
                      </Button>
                    </EditTrainingRecordDialog>
                    <DeleteTrainingRecordDialog record={record} selection={selection}>
                      <Button size="icon" variant="destructive">
                        <Trash2Icon />
                      </Button>
                    </DeleteTrainingRecordDialog>
                  </div>
                </td>
              </tr>
            ))}
            <TableErrorDisplay colSpan={6} isLoading={recordsReq.isLoading} error={recordsReq.error} />
          </tbody>
        </table>

        <AppPagination
          className="h-16 px-4"
          totalItems={recordsReq.data?.total_items || 0}
          pageSize={query.page_size}
          setPageSize={(v) => setQuery({ page_size: v })}
          pageSizeOptions={[5, 10, 20, 50, 100, 200, 500, 1000]}
          currentPage={query.page}
          setCurrentPage={(v) => setQuery({ page: v })}
        />
      </div>
    </>
  );
}
