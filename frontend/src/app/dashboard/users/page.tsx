"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EditIcon, FolderPlus, TrashIcon, UserRoundPlus } from "lucide-react";
import { Group } from "next/dist/shared/lib/router/utils/route-regex";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DataGridColumnHeader } from "./col-header";
import { AddUserToGroupDialog, CreateUserDialog, RemoveUserFromGroupDialog } from "./dialogs";
import api from "@/api/common";
import { User, UserGroup } from "@/api/users";
import UserSelect from "@/components/app/user-select";
import AppPagination from "@/components/common/pager";
import Table from "@/components/common/table";
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
import { useSelection } from "@/hooks/selection";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const selectedUsers = useSelection<User>([]);

  const selectedUserGroups = useSelection<UserGroup>([
    { id: "1", name: "HSW Staff" },
    { id: "2", name: "UWA Student" },
    { id: "3", name: "CSSE Staff" },
    { id: "4", name: "Student" },
    { id: "5", name: "HSW Staff" },
    { id: "6", name: "Student" },
  ]);

  useEffect(() => {
    api.get<User[]>("/api/users").then(setUsers);
  }, []);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      size: 64,
      enableResizing: false,
      header: () => (
        <div className="flex items-center">
          <Checkbox
            className="bg-background"
            defaultChecked={selectedUsers.has(...users)}
            onCheckedChange={(checked) => {
              if (checked) selectedUsers.add(...users);
              else selectedUsers.remove(...users);
            }}
          />
        </div>
      ),
      cell: ({ row: { original } }) => (
        <div className="flex items-center">
          <Checkbox
            defaultChecked={selectedUsers.has(original)}
            onCheckedChange={(checked) => {
              if (checked) selectedUsers.add(original);
              else selectedUsers.remove(original);
            }}
          />
        </div>
      ),
    },
    {
      accessorKey: "name",
      size: 1920,
      header: (props) => {
        return <DataGridColumnHeader title="NAME" column={props.column} />;
      },
      cell: ({ row: { original: user } }) => {
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full"
                src={`https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(user.name)}`}
                alt={user.name}
              />
            </div>
            <Link href={`/dashboard/users/${user.id}`} className="hoctive:underline ml-4">
              <div className="text-sm">{user.name}</div>
              <div className="text-xs before:content-['('] after:content-[')']">{user.uwa_ids.join(", ")}</div>
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      size: 20,
      header: (props) => {
        return <DataGridColumnHeader title="ROLE" column={props.column} />;
      },
      cell: ({ row: { original: user } }) => {
        return (
          <Select defaultValue={user.role}>
            <SelectTrigger className="w-[12ch]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "actions",
      size: 64,
      enableResizing: false,
      header: "Actions",
      cell: ({ row: { original } }) => (
        <>
          <button className="edit-btn mr-3 text-indigo-600 hover:text-indigo-900" data-id="USR001">
            <EditIcon />
          </button>
          <button className="delete-btn text-red-600 hover:text-red-900" data-id="USR001">
            <TrashIcon />
          </button>
        </>
      ),
    },
  ];

  // Dummy groups for UI
  const groups: Group[] = [
    { id: 2, name: "Group A" },
    { id: 3, name: "Group B" },
    { id: 4, name: "Group C" },
    { id: 5, name: "Group D" },
    { id: 6, name: "Group E" },
    { id: 7, name: "Group F" },
    { id: 8, name: "Group G" },
    { id: 9, name: "Group H" },
    { id: 10, name: "Group I" },
    { id: 11, name: "Group J" },
    { id: 12, name: "Group K" },
    { id: 13, name: "Group L" },
    { id: 14, name: "Group M" },
    { id: 15, name: "Group N" },
    { id: 16, name: "Group O" },
  ];

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50, 100, 200, 500, 1000];

  const createUserDialog = CreateUserDialog();
  const addUserToGroupDialog = AddUserToGroupDialog(selectedUsers, selectedUserGroups);
  const removeUserFromGroupDialog = RemoveUserFromGroupDialog(selectedUsers, selectedUserGroups);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage people and groups</p>
      </div>

      <UserSelect selection={selectedUsers} />

      <div className="flex gap-2">
        <Button variant="default">
          <UserRoundPlus />
          Add User
        </Button>

        <Button variant="default">
          <FolderPlus />
          Add Group
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center">
          <Input type="text" placeholder="Search User..." />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Group:</span>
            <Select defaultValue="All Users">
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Users">All Users</SelectItem>
                {groups.map((group) => {
                  return (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

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

        <Table columns={columns} data={users}></Table>

        <div className="px-4 py-3">
          <AppPagination
            totalItems={totalItems}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageSizeOptions={pageSizeOptions}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {createUserDialog.node}
      {addUserToGroupDialog.node}
      {removeUserFromGroupDialog.node}
    </>
  );
}
