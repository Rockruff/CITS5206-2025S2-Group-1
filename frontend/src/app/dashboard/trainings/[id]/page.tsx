"use client";

import cn from "mxcn";
import { use } from "react";

import { swr } from "@/api/common";
import { getTraining } from "@/api/trainings";
import { StatusBadge } from "@/components/app/training-status-badage";
import { UserRenderer } from "@/components/app/user-select";
import { ClearableSelect, SelectClear } from "@/components/common/clearable-select";
import TableHeader from "@/components/common/orderby";
import AppPagination from "@/components/common/pager";
import TableErrorDisplay from "@/components/common/table-error-display";
import { Input } from "@/components/ui/input";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParamsState } from "@/hooks/search";

interface ListUserForTrainingResponse {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  items: { id: string; status: string }[];
}

function listUsersForTraining(
  training: string,
  {
    search,
    status,
    order_by,
    page,
    page_size,
  }: {
    search: string;
    status: string;
    order_by: string;
    page: number;
    page_size: number;
  },
) {
  const params: Record<string, any> = {};

  if (search) {
    const id = parseInt(search);
    const key = Number.isNaN(id) ? "name" : "id";
    params[key] = search;
  }
  if (status) params.status = status;
  if (order_by) params.order_by = order_by;

  params.page = page;
  params.page_size = page_size;

  let { data, error, isLoading } = swr<ListUserForTrainingResponse>(`/api/trainings/${training}/users`, params);

  if (!data || error || isLoading) {
    data = {
      page: page,
      page_size: page_size,
      total_pages: 0,
      total_items: 0,
      items: [],
    } satisfies ListUserForTrainingResponse;
  }

  return { data, error, isLoading };
}

export default function TrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [query, setQuery] = useQueryParamsState({
    search: "",
    status: "",
    order_by: "id",
    page: 1,
    page_size: 10,
  });

  const { data, isLoading, error } = listUsersForTraining(id, query);
  const { data: training } = getTraining(id);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">Training Detail</h1>
        <p className="text-muted-foreground">
          Viewing assigned users and their completion status for training{" "}
          <span className="font-bold">{training?.name}</span>
        </p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input
            type="text"
            value={query.search}
            onValueChange={(value) => setQuery({ search: value, page: 1 })}
            placeholder="Search by Name or ID..."
          />

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">Status:</label>
            <ClearableSelect value={query.status} onValueChange={(status) => setQuery({ status, page: 1 })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectClear>Any Status</SelectClear>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PASSED">Passed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </ClearableSelect>
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
            "[&_th,td]:w-20 [&_th,td]:nth-1:flex-1 [&_thead,tbody]:min-w-160", // column width
          )}
        >
          <thead>
            <tr>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(v) => setQuery({ order_by: v })}
                  columns={["Name", "ID"]}
                />
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(({ id, status }) => (
              <tr key={id}>
                <td>
                  <UserRenderer value={id} />
                </td>
                <td>
                  <StatusBadge status={status} />
                </td>
              </tr>
            ))}
            <TableErrorDisplay colSpan={4} isLoading={isLoading} error={error} />
          </tbody>
        </table>

        <AppPagination
          className="h-16 px-4"
          totalItems={data.total_items}
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
