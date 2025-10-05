"use client";

import { EditIcon, EllipsisIcon, PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";

import { CreateGroupDialog } from "./create_dialog";
import DeleteGroupDialog from "./delete_button";
import { GroupTrainingAssignmentDialog } from "./training_assignment_dialog";
import { UpdateGroupDialog } from "./update_dialog";
import { listGroups } from "@/api/groups";
import TableHeader from "@/components/common/orderby";
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

export default function () {
  const [query, setQuery] = useQueryParamsState({
    search: "",
    order_by: "name",
  });

  const { data: groups, isLoading, error } = listGroups(query);
  const selection = useSet<string>();

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">User Group Management</h1>
        <p className="text-muted-foreground">Manage groups and their training assignments.</p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input
            value={query.search}
            onValueChange={(v) => setQuery({ search: v })}
            placeholder="Search by Name or Description..."
          />
          <CreateGroupDialog>
            <Button size="icon">
              <PlusIcon />
            </Button>
          </CreateGroupDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Selected {selection.length} Groups</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <GroupTrainingAssignmentDialog mode="add" selection={selection}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Assign to Training</DropdownMenuItem>
              </GroupTrainingAssignmentDialog>
              <GroupTrainingAssignmentDialog mode="remove" selection={selection}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Remove from Training</DropdownMenuItem>
              </GroupTrainingAssignmentDialog>
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
            "[&_th,td]:w-20 [&_th,td]:last:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:w-36 [&_th,td]:nth-3:flex-1 [&_thead,tbody]:min-w-200", // column width
          )}
        >
          <thead>
            <tr>
              <th>
                <Checkbox
                  checked={selection.has(...groups.map((g) => g.id))}
                  onCheckedChange={(v) => (v ? selection.add : selection.remove)(...groups.map((g) => g.id))}
                />
              </th>
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
                  columns={["Created"]}
                />
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td>
                  <Checkbox
                    checked={selection.has(g.id)}
                    onCheckedChange={(v) => (v ? selection.add(g.id) : selection.remove(g.id))}
                  />
                </td>
                <td className="truncate">{g.name}</td>
                <td className="truncate">{g.description}</td>
                <td>{formatDate(g.timestamp)}</td>
                <td>
                  <UpdateGroupDialog group={g}>
                    <Button size="icon">
                      <EditIcon />
                    </Button>
                  </UpdateGroupDialog>
                  <DeleteGroupDialog group={g}>
                    <Button size="icon" variant="destructive">
                      <Trash2Icon />
                    </Button>
                  </DeleteGroupDialog>
                </td>
              </tr>
            ))}
            <TableErrorDisplay colSpan={5} isLoading={isLoading} error={error} />
          </tbody>
        </table>
      </div>
    </>
  );
}
