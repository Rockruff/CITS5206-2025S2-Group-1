"use client";

import { FolderPlus, UserRoundPlus } from "lucide-react";
import React, { useEffect, useState } from "react";

import AppPagination from "@/components/common/pager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type User = {
  id: number;
  uwa_ids: string[];
  name: string;
  role: "Admin" | "User";
};

type Group = {
  id: number;
  name: string;
};

function UserRow(user: User) {
  return (
    <tr key={user.id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <Checkbox />
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{user.uwa_ids.join(", ")}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full"
              src={`https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(user.name)}`}
              alt={user.name}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex rounded-full bg-purple-100 px-2 text-xs leading-5 font-semibold text-purple-800">
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
        <button className="edit-btn mr-3 text-indigo-600 hover:text-indigo-900" data-id="USR001">
          <i className="fas fa-edit"></i>
        </button>
        <button className="delete-btn text-red-600 hover:text-red-900" data-id="USR001">
          <i className="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  );
}

export default function Users() {
  const users: User[] = [
    { id: 1, uwa_ids: ["UWA001"], name: "Alice Johnson", role: "Admin" },
    { id: 2, uwa_ids: ["UWA002"], name: "Bob Smith", role: "User" },
    { id: 3, uwa_ids: ["UWA003"], name: "Charlie Brown", role: "User" },
    { id: 4, uwa_ids: ["UWA004"], name: "Diana Prince", role: "Admin" },
    { id: 5, uwa_ids: ["UWA005"], name: "Ethan Hunt", role: "User" },
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

  useEffect(() => {
    setTimeout(() => {
      setTotalItems(5000);
      setCurrentPage(5000);
    }, 1000);
  }, []);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage people and groups</p>
      </div>

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
        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-3 md:flex-row md:items-center">
          <Input type="text" placeholder="Search User..." />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Group:</span>
            <Select>
              <SelectTrigger className="w-[180px]" value="All Users">
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
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  <Checkbox />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  UWA ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white" id="userTableBody">
              {users.map(UserRow)}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-4 py-3">
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
    </>
  );
}
