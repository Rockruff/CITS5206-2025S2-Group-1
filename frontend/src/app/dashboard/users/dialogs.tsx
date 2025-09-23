import { CheckedState } from "@radix-ui/react-checkbox";
import { FileIcon } from "lucide-react";
import prettyBytes from "pretty-bytes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { del, patch, post, revalidatePath } from "@/api/common";
import { User } from "@/api/users";
import { UserGroupSelectV2 } from "@/components/app/user-group-select";
import { UserSelect } from "@/components/app/user-select";
import SubmitButton from "@/components/common/submit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@/hooks/form";
import { ReactiveSet } from "@/hooks/reactive-set";
import { pickFile } from "@/lib/utils";

export function DeleteUserDialog({
  children,
  user,
  selection,
}: {
  children: React.ReactNode;
  user: User;
  selection: ReactiveSet<string>;
}) {
  const [open, setOpen] = useState(false);

  const { working, error, submit } = useForm();

  const handleDelete = submit(async () => {
    await del(`/api/users/${user.id}`);
    selection.remove(user.id);
    revalidatePath("/api/users");
    setOpen(false);
    toast.success("User Deleted");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>Are you sure? This will permanently delete the user.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <img className="size-10 flex-none rounded-full" src={user.avatar} />
          <div className="overflow-hidden">
            <div className="truncate text-sm">{user.name}</div>
            <div className="text-xs before:content-['('] after:content-[')']">{user.id}</div>
          </div>
        </div>

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={working} variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton variant="destructive" disabled={working} onClick={handleDelete}>
            Delete
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateUserDialog({
  children,
  selection,
}: {
  children: React.ReactNode;
  selection: ReactiveSet<string>;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("single");
  const [addToSelection, setAddToSelection] = useState<CheckedState>(true);

  const { useField, error, working, reset, submit } = useForm();
  const [id, setId] = useField("");
  const [name, setName] = useField("");
  const [file, setFile] = useField<File | null>(null);

  const handleSingleCreate = submit(async () => {
    const user = await post<User>("/api/users", { id, name });
    revalidatePath("/api/users");
    setOpen(false); // close after success
    if (addToSelection) selection.add(user.id);
    toast.success("Create User: Success");
  });

  const handleBatchCreate = submit(async () => {
    const formData = new FormData();
    formData.append("file", file!); // let backend handle null here
    const users = await post<User[]>("/api/users/batch", formData);
    revalidatePath("/api/users");
    setOpen(false); // close after success
    if (addToSelection) selection.add(...users.map((user) => user.id));
    toast.success("Create User: Success");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Create user by specifying ID and full name, or upload a file.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm">Mode</label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
            </SelectContent>
          </Select>
          {mode !== "single" && (
            <div className="text-muted-foreground text-sm">
              During batch operations, if a user with the same ID (considering aliases) and name already exists, the row
              will be treated as valid and skipped without creating a new user.
            </div>
          )}
        </div>

        {mode === "single" ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm">UWA ID</label>
              <Input placeholder="e.g. 12345678" value={id} onValueChange={setId} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Full Name</label>
              <Input placeholder="e.g. John Doe" value={name} onValueChange={setName} />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-sm">File (Accept CSV and XLSX)</label>
            {file && (
              <>
                <FileIcon className="mx-auto" />
                <div className="text-center text-xs">
                  {file.name} ({prettyBytes(file.size)})
                </div>
              </>
            )}
            <Button
              onClick={async () => {
                const file = await pickFile(".csv");
                if (file) setFile(file);
              }}
            >
              {!file ? "Select File" : "Pick Another File"}
            </Button>
          </div>
        )}

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={addToSelection} onCheckedChange={setAddToSelection} />
            <label className="text-sm">Add to current selection</label>
          </div>
          <div className="text-muted-foreground text-sm">
            Automatically include created users in your active selection so you can apply other actions right away.
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={working} variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton disabled={working} onClick={mode === "single" ? handleSingleCreate : handleBatchCreate}>
            Create
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserAddRemoveGroupDialog({
  children,
  mode,
  selection,
}: {
  children: React.ReactNode;
  mode: "add" | "remove";
  selection: ReactiveSet<string>;
}) {
  const [open, setOpen] = useState(false);

  const { useField, working, error, submit } = useForm();

  const [users, setUsers] = useField<string[]>(selection.values());
  const [groups, setGroups] = useField<string[]>([]);

  useEffect(() => {
    selection.clear();
    selection.add(...users);
  }, [users]);

  const handler = submit(async () => {
    if (users.length === 0) throw new Error("Please select at least 1 user");
    if (groups.length === 0) throw new Error("Please select at least 1 group");

    if (mode === "remove") {
      await patch(
        `/api/groups/batch/users`,
        groups.map((id: string) => ({
          group: id,
          remove: users,
        })),
      );
    } else {
      await patch(
        `/api/groups/batch/users`,
        groups.map((id: string) => ({
          group: id,
          add: users,
        })),
      );
    }

    revalidatePath("/api/users");
    revalidatePath("/api/groups");
    setOpen(false);
    toast.success("Success");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "remove" ? "Remove From Group" : "Assign To Group"}</DialogTitle>
          <DialogDescription>
            {mode === "remove"
              ? "Operations will be ignored for users not in the target groups."
              : "Operations will be ignored for users already in the target groups."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm">Users</label>
          <UserSelect className="w-64 max-md:w-full" value={users} onValueChange={setUsers} />
        </div>
        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm">Target Groups</label>
          <UserGroupSelectV2 className="w-64 max-md:w-full" value={groups} onValueChange={setGroups} />
        </div>

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={working} variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton variant="destructive" disabled={working} onClick={handler}>
            {mode === "remove" ? "Remove" : "Add"}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
