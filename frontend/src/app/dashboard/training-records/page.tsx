"use client";

import { BubblesIcon, CalendarIcon, CircleXIcon, EllipsisIcon, LoaderCircleIcon, PlusIcon } from "lucide-react";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSWRConfig } from "swr";

import {
  BatchDeleteTrainingRecordsDialog,
  CreateTrainingRecordDialog,
  DeleteTrainingRecordDialog,
  EditTrainingRecordDialog,
} from "./dialogs";
import { listTrainingRecords } from "@/api/training-records";
import { listTrainings } from "@/api/trainings";
import { listUsers } from "@/api/users";
import AppPagination from "@/components/common/pager";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSet } from "@/hooks/reactive-set";
import { useQueryParamsState } from "@/hooks/search";
import { cn } from "@/lib/utils";

export default function TrainingRecords() {
  const { mutate } = useSWRConfig();
  const selection = useSet<string>();

  const [query, setQuery] = useQueryParamsState({
    search: "",
    user: "",
    training: "",
    order_by: "timestamp",
    page: 1,
    page_size: 10,
  });

  const [dateRange, setDateRange] = React.useState<[Date | null, Date | null]>([null, null]);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const recordsReq = listTrainingRecords(query);
  const usersReq = listUsers({ page_size: 1000 });
  const trainingsReq = listTrainings();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingRecordId, setEditingRecordId] = React.useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (isExpired: boolean) => {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          isExpired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
        )}
      >
        {isExpired ? "Expired" : "Valid"}
      </span>
    );
  };

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">Training Records</h1>
        <p className="text-muted-foreground">Manage training completion records and assignments.</p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input
            type="text"
            value={query.search}
            onValueChange={(value) => setQuery({ search: value, page: 1 })}
            placeholder="Search by user or training..."
          />

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">User:</label>
            <Select value={query.user} onValueChange={(v) => setQuery({ user: v ?? "", page: 1 })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Any User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as unknown as string}>Any User</SelectItem>
                {usersReq.data?.items.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">Training:</label>
            <Select value={query.training} onValueChange={(v) => setQuery({ training: v ?? "", page: 1 })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Any Training" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as unknown as string}>Any Training</SelectItem>
                {trainingsReq.data?.map((training) => (
                  <SelectItem key={training.id} value={training.id}>
                    {training.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Button
              size="icon"
              variant={dateRange[0] && dateRange[1] ? "default" : "outline"}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title={
                dateRange[0] && dateRange[1]
                  ? `${dateRange[0].toLocaleDateString()} - ${dateRange[1].toLocaleDateString()}`
                  : "Select date range"
              }
            >
              <CalendarIcon />
            </Button>
            {showDatePicker && (
              <div className="absolute top-full right-0 z-10 mt-1 rounded-md border bg-white shadow-lg">
                <DatePicker
                  selectsRange={true}
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  onChange={(update) => {
                    setDateRange(update);
                    if (update[0] && update[1]) {
                      setShowDatePicker(false);
                      // Update query with date range
                      setQuery({
                        page: 1,
                      });
                    }
                  }}
                  isClearable={true}
                  inline
                />
              </div>
            )}
          </div>

          <CreateTrainingRecordDialog selection={selection}>
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

        <div className="contents [&>*]:flex-1 [&>*]:border-y">
          {recordsReq.isLoading ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <LoaderCircleIcon className="animate-spin" />
              <span className="text-sm">Loading Data...</span>
            </div>
          ) : recordsReq.error ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CircleXIcon />
              <span className="text-sm">{recordsReq.error.error}</span>
            </div>
          ) : recordsReq.data?.results.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <BubblesIcon />
              <span className="text-sm">No Training Records Found</span>
            </div>
          ) : (
            <table
              className={cn(
                "[&_tbody_tr]:h-16 [&_thead_tr]:h-12",
                "flex flex-col overflow-hidden",
                "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto",
                "[&_tbody]:mb-[-1px] [&_tr]:border-b",
                "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-4 [&_tr]:px-4",
                "[&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2",
                "[&_th,td]:nth-1:w-12 [&_th,td]:nth-2:w-48 [&_th,td]:nth-3:w-56 [&_th,td]:nth-4:w-32 [&_th,td]:nth-5:w-20 [&_th,td]:nth-6:w-32",
              )}
            >
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      checked={selection.has(...(recordsReq.data?.results.map((record) => record.id) || []))}
                      onCheckedChange={(v) =>
                        (v ? selection.add : selection.remove)(
                          ...(recordsReq.data?.results.map((record) => record.id) || []),
                        )
                      }
                    />
                  </th>
                  <th>
                    <div className="text-xs font-bold">User</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Training</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Completed</div>
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
                {recordsReq.data?.results.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <Checkbox
                        checked={selection.has(record.id)}
                        onCheckedChange={(v) => (v ? selection.add(record.id) : selection.remove(record.id))}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="hoctive:underline overflow-hidden text-left"
                        onClick={() => {
                          setEditingRecordId(record.id);
                          setEditOpen(true);
                        }}
                      >
                        <div className="truncate text-sm">
                          {usersReq.data?.items.find((u) => u.id === record.user)?.name || `User ${record.user}`}
                        </div>
                        <div className="text-muted-foreground text-xs">{record.user}</div>
                      </button>
                    </td>
                    <td>
                      <div className="overflow-hidden text-left">
                        <div className="truncate text-sm">
                          {trainingsReq.data?.find((t) => t.id === record.training)?.name ||
                            `Training ${record.training}`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{formatDate(record.timestamp)}</div>
                    </td>
                    <td>{getStatusBadge(record.expired)}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingRecordId(record.id);
                            setEditOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <DeleteTrainingRecordDialog record={record} selection={selection}>
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </DeleteTrainingRecordDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AppPagination
          className="h-16 px-4"
          totalItems={recordsReq.data?.count || 0}
          pageSize={query.page_size}
          setPageSize={(v) => setQuery({ page_size: v })}
          pageSizeOptions={[5, 10, 20, 50, 100, 200, 500, 1000]}
          currentPage={query.page}
          setCurrentPage={(v) => setQuery({ page: v })}
        />
      </div>

      <EditTrainingRecordDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        record={recordsReq.data?.results.find((r) => r.id === editingRecordId) || null}
        onSaved={() => {
          mutate(
            (key) =>
              (typeof key === "string" && key.startsWith("/api/training-records")) ||
              (Array.isArray(key) && key[0] === "/api/training-records"),
            undefined,
            { revalidate: true },
          );
        }}
      />
    </>
  );
}
