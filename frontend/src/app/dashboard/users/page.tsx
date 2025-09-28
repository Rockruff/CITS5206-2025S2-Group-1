"use client";

import { BubblesIcon, CircleXIcon, EllipsisIcon, LoaderCircleIcon, PlusIcon } from "lucide-react";
import React from "react";
import { useSWRConfig } from "swr";

import { CreateUserDialog, DeleteUserDialog, UserAddRemoveGroupDialog } from "./dialogs";
import { EditUserDialog } from "./dialogs";
import { listGroups } from "@/api/groups";
import { listUsers } from "@/api/users";
import TableHeader from "@/components/common/orderby";
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

export default function Users() {
  const { mutate } = useSWRConfig();
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
  const greq = listGroups();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);

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
            placeholder="Search User..."
          />

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">Group:</label>
            <Select value={query.group} onValueChange={(v) => setQuery({ group: v ?? "", page: 1 })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Any Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as unknown as string /* workaround */}>Any Group</SelectItem>
                {greq.data.map((group) => {
                  return (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 max-md:hidden">
            <label className="text-muted-foreground text-sm">Role:</label>
            <Select value={query.role} onValueChange={(v) => setQuery({ role: v ?? "", page: 1 })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Any Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as unknown as string /* workaround */}>Any Role</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="VIEWER">Viewers</SelectItem>
              </SelectContent>
            </Select>
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

        <div className="contents [&>*]:flex-1 [&>*]:border-y">
          {ureq.isLoading ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <LoaderCircleIcon className="animate-spin" />
              <span className="text-sm">Loading Data...</span>
            </div>
          ) : ureq.error ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CircleXIcon />
              <span className="text-sm">{ureq.error.error}</span>
            </div>
          ) : ureq.data.items.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <BubblesIcon />
              <span className="text-sm">Nothing is Found</span>
            </div>
          ) : (
            <table
              className={cn(
                "[&_tbody_tr]:h-16 [&_thead_tr]:h-12", // height config
                "flex flex-col overflow-x-auto overflow-y-hidden [&_thead,tbody]:min-w-160", // x-scrollable table
                "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto", // y-scrollable tbody
                "[&_tbody]:mb-[-1px] [&_tr]:border-b", // borders, with deduplication at bottom
                "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8", // row style
                "[&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2", // cell style
                "[&_th,td]:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:flex-1", // column width
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

                        <button
                          type="button"
                          className="hoctive:underline overflow-hidden text-left"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditOpen(true);
                          }}
                        >
                          <div className="truncate text-sm">{user.name}</div>
                          <div className="text-xs before:content-['('] after:content-[')']">
                            {user.id}
                            {user.aliases.length > 1 && `, +${user.aliases.length - 1} alias`}
                            {user.aliases.length > 2 && `es`}
                          </div>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm lowercase [&:first-letter]:uppercase">{user.role}</div>
                    </td>
                    <td>
                      <DeleteUserDialog user={user} selection={selection}>
                        <Button size="sm" variant="destructive">
                          Delete
                        </Button>
                      </DeleteUserDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        userId={editingUserId}
        onSaved={() => {
          mutate(
            (key) =>
              (typeof key === "string" && key.startsWith("/api/users")) ||
              (Array.isArray(key) && key[0] === "/api/users"),
            undefined,
            { revalidate: true },
          );
        }}
      />
    </>
  );
}
