import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { User, UserGroup } from "@/api/users";
import UserGroupSelect from "@/components/app/user-group-select";
import UserSelect from "@/components/app/user-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Selection } from "@/hooks/selection";
import { sleep } from "@/lib/utils";

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

export function CreateUserDialog() {
  const title = "Create User";
  const description = "After creation, users will automatically be added to selection.";
  const confirm = "Create";

  const [uwaId, setUwaId] = useState("");
  const [name, setName] = useState("");

  const reset = () => {
    setUwaId("");
    setName("");
  };

  const submit = async () => {
    if (!uwaId) throw Error("Please enter UWA ID");
    if (!name) throw Error("Please enter name");
    await sleep(500);
  };

  const children = (
    <>
      <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
        <label className="text-muted-foreground text-sm">UWA ID</label>
        <Input defaultValue={uwaId} onChange={(e) => setUwaId(e.target.value)} />
      </div>
      <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
        <label className="text-muted-foreground text-sm">Name</label>
        <Input defaultValue={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </>
  );

  return DialogForm({
    title,
    description,
    confirm,
    submit,
    reset,
    children,
  });
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
