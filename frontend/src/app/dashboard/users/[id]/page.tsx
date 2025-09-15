"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { use, useEffect, useState } from "react";

import api from "@/api/common";
import { User, UserGroup } from "@/api/users";
import UserGroupSelect from "@/components/app/user-group-select";
import { ButtonIconOnly } from "@/components/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelection } from "@/hooks/selection";

export default function Users({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [user, setUser] = useState<User>();

  const selectedUserGroups = useSelection<UserGroup>([
    { id: "1", name: "HSW Staff" },
    { id: "2", name: "UWA Student" },
    { id: "3", name: "CSSE Staff" },
    { id: "4", name: "Student" },
    { id: "5", name: "HSW Staff" },
    { id: "6", name: "Student" },
  ]);

  useEffect(() => {
    api.get<User>(`/api/users/${id}`).then(setUser);
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">View & edit user details</p>
      </div>

      {/* Config Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
            <label className="text-muted-foreground text-sm font-medium">Name</label>
            <Input defaultValue={user.name} />
          </div>

          {/* Role */}
          <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
            <label className="text-muted-foreground text-sm font-medium">Role</label>
            <Select defaultValue="admin">
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="advisor">Advisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* UWA IDs */}
          <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
            <label className="text-muted-foreground text-sm font-medium">UWA IDs</label>
            <div className="flex flex-wrap items-center gap-2">
              {user.aliases.map((id, index) => (
                <div
                  key={index}
                  className="bg-primary text-primary-foreground flex items-center gap-2 rounded-full px-3 text-xs/6"
                >
                  <span>{id}</span>
                  <ButtonIconOnly
                    className="hover:bg-secondary-foreground/20 rounded-full p-1"
                    icon={XIcon}
                    onClick={() => removeUwaId(user.id, id)}
                  />
                </div>
              ))}
              <ButtonIconOnly icon={PlusIcon} onClick={() => addUwaIdPopup(user.id)}></ButtonIconOnly>
            </div>
          </div>

          {/* Groups */}
          <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
            <label className="text-muted-foreground text-sm font-medium">Groups</label>

            <UserGroupSelect selection={selectedUserGroups} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6"></CardContent>
      </Card>
    </div>
  );
}
