"use client";

import { BubblesIcon, CircleXIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { AddUserToGroupDialog, CreateUserDialog, RemoveUserFromGroupDialog } from "./dialogs";
import { User, UserGroup, useGroups, useUsers } from "@/api/users";
import UserSelect from "@/components/app/user-select";
import TableHeader from "@/components/common/orderby";
import AppPagination from "@/components/common/pager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParamsState } from "@/hooks/search";
import { useSelection } from "@/hooks/selection";
import { cn } from "@/lib/utils";

export default function Users() {
  const selectedUsers = useSelection<User>([]);
  const selectedGroups = useSelection<UserGroup>([]);

  const [query, setQuery] = useQueryParamsState({
    search: "",
    group: "",
    role: "",
    order_by: "id",
    page: 1,
    page_size: 10,
  });

  const ureq = useUsers(query);
  const greq = useGroups();

  const createUserDialog = CreateUserDialog();
  const addUserToGroupDialog = AddUserToGroupDialog(selectedUsers, selectedGroups);
  const removeUserFromGroupDialog = RemoveUserFromGroupDialog(selectedUsers, selectedGroups);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage people and groups</p>
      </div>

      <div className="bg-background overflow-hidden rounded-lg shadow">
        <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center">
          <Input
            type="text"
            value={query.search}
            onChange={(e) => setQuery({ search: e.target.value, page: 1 })}
            placeholder="Search User..."
          />

          <div className="flex items-center gap-2">
            <label className="text-muted-foreground text-sm">Group:</label>
            <Select value={query.group} onValueChange={(v) => setQuery({ group: v ?? "", page: 1 })}>
              <SelectTrigger>
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

          <div className="flex items-center gap-2">
            <label className="text-muted-foreground text-sm">Role:</label>
            <Select value={query.role} onValueChange={(v) => setQuery({ role: v ?? "", page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="Any Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as unknown as string /* workaround */}>Any Role</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="VIEWER">Viewers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <UserSelect selection={selectedUsers} />

          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>...</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={createUserDialog.open}>Create New User</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={addUserToGroupDialog.open}>Add To Group</MenubarItem>
                <MenubarItem onClick={removeUserFromGroupDialog.open}>Remove From Group</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Delete Selected User</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Import Users</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        <div className="h-92 overflow-x-auto overflow-y-auto border-y">
          {ureq.isLoading ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <LoaderCircleIcon className="animate-spin" />
              <span className="text-sm">Loading Data...</span>
            </div>
          ) : !ureq.data || ureq.error ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <CircleXIcon />
              <span className="text-sm">{`${ureq.error}`}</span>
            </div>
          ) : ureq.data.items.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <BubblesIcon />
              <span className="text-sm">Nothing is Found</span>
            </div>
          ) : (
            <table
              className={cn(
                "w-full [&_tbody_tr]:h-16 [&_thead_tr]:h-12", // row heights + width
                "[&_tbody]:mb-[-1px] [&_tr]:border-b", // borders
                "[&_tr]:px-8", // row padding
                "[&_th,td]:gap-2", // cell gap
                "[&_th,td]:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:w-auto",
              )}
            >
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      checked={selectedUsers.has(...ureq.data.items)}
                      onCheckedChange={(v) => (v ? selectedUsers.add : selectedUsers.remove)(...ureq.data.items)}
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
                        checked={selectedUsers.has(user)}
                        onCheckedChange={(v) => (v ? selectedUsers.add(user) : selectedUsers.remove(user))}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-4">
                        <img
                          className="size-10 flex-none rounded-full"
                          src={`https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(user.name)}`}
                        />
                        <Link href={`/dashboard/users/${user.id}`} className="hoctive:underline overflow-hidden">
                          <div className="truncate text-sm">{user.name}</div>
                          <div className="text-xs before:content-['('] after:content-[')']">
                            {user.id}
                            {user.aliases.length > 1 && `, +${user.aliases.length - 1} alias`}
                            {user.aliases.length > 2 && `es`}
                          </div>
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm lowercase [&:first-letter]:uppercase">{user.role}</div>
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        {query.group ? (
                          <Button size="sm" variant="default">
                            Remove
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-4 py-3">
          <AppPagination
            totalItems={ureq.data.total_items}
            pageSize={query.page_size}
            setPageSize={(v) => setQuery({ page_size: v })}
            pageSizeOptions={[5, 10, 20, 50, 100, 200, 500, 1000]}
            currentPage={query.page}
            setCurrentPage={(v) => setQuery({ page: v })}
          />
        </div>
      </div>

      {createUserDialog.node}
      {addUserToGroupDialog.node}
      {removeUserFromGroupDialog.node}
    </>
  );
}
