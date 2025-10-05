"use client";

import { EditIcon, PlusIcon, Trash2Icon } from "lucide-react";
import cn from "mxcn";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";

import { CreateTrainingDialog } from "./create_dialog";
import DeleteTrainingButton from "./delete_button";
import { UpdateTrainingDialog } from "./update_dialog";
import { listTrainings } from "@/api/trainings";
import { ClearableSelect, SelectClear } from "@/components/common/clearable-select";
import TableHeader from "@/components/common/orderby";
import AppPagination from "@/components/common/pager";
import TableErrorDisplay from "@/components/common/table-error-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParamsState } from "@/hooks/search";

export default function Trainings() {
  const [query, setQuery] = useQueryParamsState({
    search: "",
    type: "",
    order_by: "name",
  });

  const { data: filteredTrainings, isLoading, error } = listTrainings(query);

  // Calculate pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = filteredTrainings.length;
  const _totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTrainings = filteredTrainings.slice(startIndex, endIndex);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Training Management</h1>
        <p className="text-muted-foreground">Manage training courses and their configurations</p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input
            type="text"
            value={query.search}
            onValueChange={(search) => setQuery({ search })}
            placeholder="Search by Name or Description......"
          />

          <div className="flex items-center gap-2">
            <label className="text-muted-foreground text-sm">Type:</label>
            <ClearableSelect value={query.type} onValueChange={(type) => setQuery({ type })}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Any Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectClear>Any Type</SelectClear>
                <SelectItem value="LMS">LMS</SelectItem>
                <SelectItem value="TRYBOOKING">TryBooking</SelectItem>
                <SelectItem value="EXTERNAL">External</SelectItem>
              </SelectContent>
            </ClearableSelect>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <CreateTrainingDialog>
              <Button size="icon">
                <PlusIcon />
              </Button>
            </CreateTrainingDialog>
          </div>
        </div>

        <table
          className={cn(
            "[&_tbody_tr]:h-16 [&_thead_tr]:h-12", // height config
            "flex flex-1 flex-col overflow-x-auto overflow-y-hidden", // x-scrollable table
            "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto", // y-scrollable tbody
            "border-y [&_tbody]:mb-[-1px] [&_tr]:border-b", // borders, with deduplication at bottom
            "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8", // row style
            "[&_td]:text-sm [&_th]:text-xs [&_th]:font-bold [&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2", // cell style
            "[&_th,td]:w-20 [&_th,td]:last:w-20 [&_th,td]:nth-1:w-48 [&_th,td]:nth-2:flex-1 [&_th,td]:nth-3:w-24 [&_thead,tbody]:min-w-200", // column width
          )}
        >
          <thead>
            <tr className="border-b text-left">
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Name"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Description"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Type"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Expiry"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(order_by) => setQuery({ order_by })}
                  columns={["Created"]}
                />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrainings.map((training) => (
              <tr key={training.id} className="border-b last:border-0">
                <td>
                  <Link href={`/dashboard/trainings/${training.id}`}>{training.name}</Link>
                </td>
                <td>{training.description?.trim() ? training.description : "—"}</td>
                <td>{training.type}</td>
                <td>{training.expiry === 0 ? "Never" : `${training.expiry} Days`}</td>
                <td>{new Date(training.timestamp).toLocaleDateString()}</td>
                <td>
                  <UpdateTrainingDialog training={training}>
                    <Button size="icon">
                      <EditIcon />
                    </Button>
                  </UpdateTrainingDialog>
                  <DeleteTrainingButton id={training.id} name={training.name}>
                    <Button size="icon" variant="destructive">
                      <Trash2Icon />
                    </Button>
                  </DeleteTrainingButton>
                </td>
              </tr>
            ))}
            <TableErrorDisplay colSpan={6} isLoading={isLoading} error={error} />
          </tbody>
        </table>

        <AppPagination
          className="h-16 px-4"
          totalItems={totalItems}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </>
  );
}
