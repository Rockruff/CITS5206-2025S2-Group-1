"use client";

import cn from "mxcn";
import { use } from "react";

import { swr } from "@/api/common";
import { getUser } from "@/api/users";
import { TrainingRenderer } from "@/components/app/training-select";
import { StatusBadge } from "@/components/app/training-status-badage";
import TableErrorDisplay from "@/components/common/table-error-display";

export default function TrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  let { data, error, isLoading } = swr<
    {
      training: string;
      status: string;
    }[]
  >(`/api/users/${id}/trainings`);

  const { data: user } = getUser(id);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">User Detail</h1>
        <p className="text-muted-foreground">
          Viewing assigned trainings and their completion status for user{" "}
          {user && (
            <span className="font-bold">
              {user.name} ({user.id})
            </span>
          )}
        </p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
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
              <th>Training</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.map(({ training, status }) => (
              <tr key={training}>
                <td>
                  <TrainingRenderer value={training} />
                </td>
                <td>
                  <StatusBadge status={status} />
                </td>
              </tr>
            ))}
            <TableErrorDisplay colSpan={4} isLoading={isLoading} error={error} />
          </tbody>
        </table>
      </div>
    </>
  );
}
