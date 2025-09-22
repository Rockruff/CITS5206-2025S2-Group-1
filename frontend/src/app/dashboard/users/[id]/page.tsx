"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { use } from "react";
import { useEffect } from "react";

import { getUser } from "@/api/users";
import UserGroupSelect from "@/components/app/user-group-select";
import { ButtonIconOnly } from "@/components/common/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@/hooks/form";
import { useSet } from "@/hooks/selection-v2";

function UserProfileSection({ id: uid }: { id: string }) {
  const { data: user } = getUser(uid);

  const aliases = useSet<string>();
  const groups = useSet<string>();

  const { useField, error, working, reset, submit } = useForm();

  const [id, setId] = useField("");
  const [name, setName] = useField("");
  const [role, setRole] = useField("");

  useEffect(() => {
    if (!user) return;
    setId(user.id);
    setName(user.name);
    setRole(user.role);

    aliases.clear();
    aliases.add(...user.aliases);

    groups.clear();
    groups.add(...user.groups);
  }, [user]);

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm font-medium">ID</label>
          <Input value={id} onValueChange={setId} />
        </div>

        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm font-medium">Name</label>
          <Input value={name} onValueChange={setName} />
        </div>

        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm font-medium">Role</label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
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
          <UserGroupSelect selection={groups} />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="ml-auto">Save</Button>
      </CardFooter>
    </Card>
  );
}

export default function Users({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">View & edit user details</p>
      </div>

      <UserProfileSection id={id} />

      <Card>
        <CardHeader>
          <CardTitle>Training History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6"></CardContent>
      </Card>
    </div>
  );
}
