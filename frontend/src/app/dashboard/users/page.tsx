"use client";

import { EditIcon, EllipsisIcon, PlusIcon, Trash2Icon } from "lucide-react";
import React from "react";

import { CreateUserDialog, DeleteUserDialog, UserAddRemoveGroupDialog } from "./dialogs";
import { EditUserDialog } from "./dialogs";
import { listUsers } from "@/api/users";
import { UserGroupSingleSelect } from "@/components/app/user-group-select";
import { ClearableSelect, SelectClear } from "@/components/common/clearable-select";
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
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSet } from "@/hooks/reactive-set";
import { useQueryParamsState } from "@/hooks/search";
import { cn } from "@/lib/utils";

export default function Users() {
  const selection = useSet<string>();

  const [query, setQuery] = useQueryParamsState({
    search: "",
    group: "",
    role: "",
    order_by: "id",
    page: 1,
    page_size: 10,
  });

  const ureq = listUsers(query);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users and their group assignments.</p>
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
            <label className="text-muted-foreground text-sm">Group:</label>
            <UserGroupSingleSelect
              value={query.group}
              onValueChange={(v) => setQuery({ group: v, page: 1 })}
              placeholder="Any Group"
              cleartext="Any Group"
            />
          </div>

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">Role:</label>
            <ClearableSelect value={query.role} onValueChange={(v) => setQuery({ role: v ?? "", page: 1 })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Any Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectClear>Any Role</SelectClear>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="VIEWER">Viewers</SelectItem>
              </SelectContent>
            </ClearableSelect>
          </div>

          <CreateUserDialog selection={selection}>
            <Button size="icon">
              <PlusIcon />
            </Button>
          </CreateUserDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Selected {selection.length} Users</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <UserAddRemoveGroupDialog mode="add" selection={selection}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Assign to Group</DropdownMenuItem>
              </UserAddRemoveGroupDialog>
              <UserAddRemoveGroupDialog mode="remove" selection={selection}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Remove From Group</DropdownMenuItem>
              </UserAddRemoveGroupDialog>
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
            "[&_th,td]:w-20 [&_th,td]:last:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:flex-1 [&_thead,tbody]:min-w-160", // column width
          )}
        >
          <thead>
            <tr>
              <th>
                <Checkbox
                  checked={selection.has(...ureq.data.items.map((user) => user.id))}
                  onCheckedChange={(v) =>
                    (v ? selection.add : selection.remove)(...ureq.data.items.map((user) => user.id))
                  }
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(v) => setQuery({ order_by: v })}
                  columns={["Name", "ID"]}
                />
              </th>
              <th>
                <TableHeader
                  orderBy={query.order_by}
                  setOrderBy={(v) => setQuery({ order_by: v })}
                  columns={["Role"]}
                />
              </th>
              <th>
                <div className="text-xs font-bold">Action</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {ureq.data.items.map((user) => (
              <tr key={user.id}>
                <td>
                  <Checkbox
                    checked={selection.has(user.id)}
                    onCheckedChange={(v) => (v ? selection.add(user.id) : selection.remove(user.id))}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-4">
                    <img className="size-10 flex-none rounded-full" src={user.avatar} />
                    <div className="overflow-hidden text-left">
                      <div className="truncate text-sm">{user.name}</div>
                      <div className="text-xs before:content-['('] after:content-[')']">
                        {user.id}
                        {user.aliases.length > 1 && `, +${user.aliases.length - 1} alias`}
                        {user.aliases.length > 2 && `es`}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="lowercase [&:first-letter]:uppercase">{user.role}</div>
                </td>
                <td>
                  <EditUserDialog user={user}>
                    <Button size="icon">
                      <EditIcon />
                    </Button>
                  </EditUserDialog>
                  <DeleteUserDialog user={user} selection={selection}>
                    <Button size="icon" variant="destructive">
                      <Trash2Icon />
                    </Button>
                  </DeleteUserDialog>
                </td>
              </tr>
            ))}
            <TableErrorDisplay colSpan={4} isLoading={ureq.isLoading} error={ureq.error} />
          </tbody>
        </table>

        <AppPagination
          className="h-16 px-4"
          totalItems={ureq.data.total_items}
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
