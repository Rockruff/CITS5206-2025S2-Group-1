import { CheckedState } from "@radix-ui/react-checkbox";
import { FileIcon, Loader2Icon } from "lucide-react";
import prettyBytes from "pretty-bytes";
import { useState } from "react";
import { toast } from "sonner";

import { del, post, revalidatePath } from "@/api/common";
import { UserGroup } from "@/api/groups";
import { User } from "@/api/users";
import UserGroupSelect from "@/components/app/user-group-select";
import UserSelect from "@/components/app/user-select";
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
import { Selection } from "@/hooks/selection";
import { pickFile, sleep } from "@/lib/utils";

export function DeleteUserDialog({
  children,
  user,
  selectedUsers,
}: {
  children: React.ReactNode;
  user?: User;
  selectedUsers: Selection<User>;
}) {
  const [open, setOpen] = useState(false);
  const [working, setIsWorking] = useState(false);

  const handleDelete = async () => {
    setIsWorking(true);

    const results = await Promise.allSettled(
      (user ? [user] : selectedUsers).map(
        (u) => del(`/api/users/${u.id}`).then(() => u), // return the user if deleted
      ),
    );

    revalidatePath("/api/users");

    setIsWorking(false);
    setOpen(false);

    const fulfilled = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    selectedUsers.remove(...fulfilled);

    const rejected = results.length - fulfilled.length;
    if (rejected === 0) {
      toast.success("Delete User: Success");
    } else if (rejected > 0) {
      toast.warning(`Delete User: ${rejected} Failed`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            {user
              ? `Are you sure you want to delete ${user.name} (${user.id})?`
              : "Are you sure you want to delete the selected users?"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
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
  selectedUsers,
}: {
  children: React.ReactNode;
  selectedUsers: Selection<User>;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("single");
  const [addToSelection, setAddToSelection] = useState<CheckedState>(true);

  const { useField, error, working, reset, submit } = useForm();
  const [id, setId] = useField("");
  const [name, setName] = useField("");
  const [file, setFile] = useField<File | null>(null);

  const handleSingleCreate = submit(async () => {
    console.log("submit 2");
    const user = await post<User>("/api/users", { id, name });
    revalidatePath("/api/users");
    setOpen(false); // close after success
    if (addToSelection) selectedUsers.add(user);
    toast.success("Create User: Success");
  });

  const handleBatchCreate = submit(async () => {
    const formData = new FormData();
    formData.append("file", file!); // let backend handle null here
    const users = await post<User[]>("/api/users/batch", formData);
    revalidatePath("/api/users");
    setOpen(false); // close after success
    if (addToSelection) selectedUsers.add(...users);
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

        <div className="flex flex-col gap-4">
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
                During batch operations, if a user with the same ID (considering aliases) and name already exists, the
                row will be treated as valid and skipped without creating a new user.
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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <SubmitButton disabled={working} onClick={mode === "single" ? handleSingleCreate : handleBatchCreate}>
            Create
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The code below is to be migrated

interface DialogFormProps {
  title: string;
  description: string;
  confirm: string;
  submit: () => Promise<void>;
  reset?: () => any;
  children: React.ReactNode;
}

function DialogForm(props: DialogFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setError("");
    if (props.reset) props.reset();
  };

  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const node = (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">{props.children}</div>
        <div className="text-destructive text-sm empty:hidden">{error}</div>
        <DialogFooter>
          {isWorking ? (
            <Button disabled>
              <Loader2Icon className="animate-spin" />
              Please Wait...
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setIsWorking(true);
                  try {
                    await props.submit();
                    close();
                  } catch (e) {
                    setError(String(e));
                  } finally {
                    setIsWorking(false);
                  }
                }}
              >
                {props.confirm}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { node, open, close };
}

export function AddUserToGroupDialog(users: Selection<User>, groups: Selection<UserGroup>) {
  const title = "Add To User Group";
  const description = "Operations will be ignored for users already in the target groups.";
  const confirm = "Add to Target";

  const submit = async () => {
    if (!users.length) throw Error("Please select User");
    if (!groups.length) throw Error("Please select Group");
    await sleep(500);
  };

  const children = (
    <>
      <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
        <label className="text-muted-foreground text-sm">Users</label>
        <UserSelect className="w-64 max-md:w-full" selection={users} />
      </div>
      <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
        <label className="text-muted-foreground text-sm">Target Groups</label>
        <UserGroupSelect className="w-64 max-md:w-full" selection={groups} />
      </div>
    </>
  );

  return DialogForm({
    title,
    description,
    confirm,
    submit,
    children,
  });
}

export function RemoveUserFromGroupDialog(users: Selection<User>, groups: Selection<UserGroup>) {
  const title = "Remove From User Group";
  const description = "Operations will be ignored for users not in the target groups.";
  const confirm = "Remove from Target";

  const submit = async () => {
    if (!users.length) throw Error("Please select User");
    if (!groups.length) throw Error("Please select Group");
    await sleep(500);
  };

  const children = (
    <>
      <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
        <label className="text-muted-foreground text-sm">Users</label>
        <UserSelect className="w-64 max-md:w-full" selection={users} />
      </div>
      <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
        <label className="text-muted-foreground text-sm">Target Groups</label>
        <UserGroupSelect className="w-64 max-md:w-full" selection={groups} />
      </div>
    </>
  );

  return DialogForm({
    title,
    description,
    confirm,
    submit,
    children,
  });
}
