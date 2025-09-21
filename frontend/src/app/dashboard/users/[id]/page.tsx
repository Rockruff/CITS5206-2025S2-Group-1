"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { use } from "react";
import { useEffect, useState } from "react";

import api from "@/api/common";
import { User, UserGroup } from "@/api/users";
import UserGroupSelect from "@/components/app/user-group-select";
import { ButtonIconOnly } from "@/components/common/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelection } from "@/hooks/selection";

export default function Users({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [user, setUser] = useState<User>();

  const selectedUserGroups = useSelection<UserGroup>([]);

  /*  
  useEffect(() => {
    api.get<User>(`/api/users/${id}`).then(setUser);
  }, []);
*/
  useEffect(() => {
    (async () => {
      const u = await api.get<User>(`/api/users/${id}`);
      setUser(u);
      const all = await api.get<UserGroup[]>(`/api/groups`);
      selectedUserGroups.clear?.();
      all.filter((g) => u.groups.includes(g.id)).forEach((g) => selectedUserGroups.add?.(g));
    })();
  }, [id]);

  const [saving, setSaving] = useState(false);
  async function onSave() {
    setSaving(true);
    try {
      const items = (selectedUserGroups as any).items ?? [];
      await api.put(`/api/users/${id}/groups`, { groups: items.map((g: UserGroup) => g.id) });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">View & edit user details</p>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
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
