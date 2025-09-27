"use client";

import { EllipsisIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { CreateGroupDialog } from "./create_dialog";
import DeleteGroupButton from "./delete_button";
import { GroupTrainingAssignmentDialog } from "./training_assignment_dialog";
import { UpdateGroupDialog } from "./update_dialog";
import { listGroups } from "@/api/groups";
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
import { cn, kwMatch } from "@/lib/utils";

export default function () {
  const { data: groups } = listGroups();
  const selection = useSet<string>();

  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(
    () => groups.filter((g) => kwMatch(g.name, q) || kwMatch(g.description, q)),
    [q, groups],
  );

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">User Group Management</h1>
        <p className="text-muted-foreground">Manage groups and their training assignments.</p>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg shadow">
        <div className="flex h-16 items-center gap-4 px-4">
          <Input value={q} onValueChange={setQ} placeholder="Search groups by name or description…" />
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
            "flex-1 border-y",
            "[&_tbody_tr]:h-16 [&_thead_tr]:h-12", // height config
            "flex flex-col overflow-x-auto overflow-y-hidden [&_thead,tbody]:min-w-200", // x-scrollable table
            "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto", // y-scrollable tbody
            "[&_tbody]:mb-[-1px] [&_tr]:border-b", // borders, with deduplication at bottom
            "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8", // row style
            "[&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2", // cell style
            "[&_th,td]:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:w-36 [&_th,td]:nth-3:flex-1 [&_th,td]:nth-5:w-40", // column width
          )}
        >
          <thead>
            <tr>
              <th>
                <Checkbox
                  checked={selection.has(...filtered.map((g) => g.id))}
                  onCheckedChange={(v) => (v ? selection.add : selection.remove)(...filtered.map((g) => g.id))}
                />
              </th>
              <th>
                <div className="text-xs font-bold">Name</div>
              </th>
              <th>
                <div className="text-xs font-bold">Description</div>
              </th>
              <th>
                <div className="text-xs font-bold">Created</div>
              </th>
              <th>
                <div className="mx-auto text-xs font-bold">Action</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id}>
                <td>
                  <Checkbox
                    checked={selection.has(g.id)}
                    onCheckedChange={(v) => (v ? selection.add(g.id) : selection.remove(g.id))}
                  />
                </td>
                <td className="truncate text-sm">{g.name}</td>
                <td className="truncate text-sm">{g.description}</td>
                <td className="text-sm"> {new Date(g.timestamp).toLocaleDateString()}</td>
                <td className="text-sm">
                  <DeleteGroupButton group={g} />
                  <UpdateGroupDialog group={g}>
                    <Button size="sm">Update</Button>
                  </UpdateGroupDialog>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="p-0! [&,&>*]:size-full!">
                <td colSpan={5} className="text-muted-foreground justify-center">
                  No groups match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
