"use client";

import { BubblesIcon, CircleXIcon, EllipsisIcon, LoaderCircleIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { listTrainings, createTraining, updateTraining, deleteTraining } from "@/api/trainings";
import TableHeader from "@/components/common/orderby";
import AppPagination from "@/components/common/pager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSet } from "@/hooks/reactive-set";
import { useQueryParamsState } from "@/hooks/search";
import { cn } from "@/lib/utils";

export default function Trainings() {
  const selection = useSet<string>();

  const [query, setQuery] = useQueryParamsState({
    search: "",
    type: "",
    order_by: "id",
    page: 1,
    page_size: 10,
  });

  const treq = listTrainings(query);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">Training Management</h1>
        <p className="text-muted-foreground">Manage all trainings and their configurations.</p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input
            type="text"
            value={query.search}
            onChange={(e) => setQuery({ search: e.target.value, page: 1 })}
            placeholder="Search Training..."
          />

          {/* Create Training Button */}
          <Button size="icon" onClick={() => alert("TODO: open CreateTrainingDialog")}>
            <PlusIcon />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Selected {selection.length} Trainings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alert("TODO: bulk delete")}>
                Delete Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => selection.clear()}>Clear Selection</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="contents [&>*]:flex-1 [&>*]:border-y">
          {treq.isLoading ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <LoaderCircleIcon className="animate-spin" />
              <span className="text-sm">Loading Data...</span>
            </div>
          ) : treq.error ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CircleXIcon />
              <span className="text-sm">{treq.error.error}</span>
            </div>
          ) : treq.data.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <BubblesIcon />
              <span className="text-sm">Nothing is Found</span>
            </div>
          ) : (
            <table
              className={cn(
                "[&_tbody_tr]:h-16 [&_thead_tr]:h-12",
                "flex flex-col overflow-x-auto overflow-y-hidden [&_thead,tbody]:min-w-160",
                "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto",
                "[&_tbody]:mb-[-1px] [&_tr]:border-b",
                "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8",
                "[&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2",
                "[&_th,td]:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:flex-1"
              )}
            >
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      checked={selection.has(...treq.data.map((training) => training.id))}
                      onCheckedChange={(v) =>
                        (v ? selection.add : selection.remove)(...treq.data.map((training) => training.id))
                      }
                    />
                  </th>
                  <th>
                    <TableHeader
                      orderBy={query.order_by}
                      setOrderBy={(v) => setQuery({ order_by: v })}
                      columns={["Name", "Type", "Expiry"]}
                    />
                  </th>
                  <th>
                    <div className="text-xs font-bold">Action</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {treq.data.map((training) => (
                  <tr key={training.id}>
                    <td>
                      <Checkbox
                        checked={selection.has(training.id)}
                        onCheckedChange={(v) => (v ? selection.add(training.id) : selection.remove(training.id))}
                      />
                    </td>
                    <td>
                      <Link href={`/dashboard/trainings/${training.id}`} className="hover:underline overflow-hidden">
                        <div className="truncate text-sm">{training.name}</div>
                        <div className="text-xs">Type: {training.type}</div>
                        <div className="text-xs">Expiry: {training.expiry} days</div>
                      </Link>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTraining(training.id).then(() => alert("Deleted!"))}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AppPagination
          className="h-16 px-4"
          totalItems={treq.data?.length ?? 0}
          pageSize={query.page_size}
          setPageSize={(v) => setQuery({ page_size: v })}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          currentPage={query.page}
          setCurrentPage={(v) => setQuery({ page: v })}
        />
      </div>
    </>
  );
}
