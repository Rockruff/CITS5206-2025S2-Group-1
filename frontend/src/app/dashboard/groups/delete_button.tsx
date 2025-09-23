"use client";

import * as React from "react";
import { toast } from "sonner";

import { del, revalidatePath } from "@/api/common";
import { UserGroup } from "@/api/groups";
import SubmitButton from "@/components/common/submit";
import { Button } from "@/components/ui/button";
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
import { useForm } from "@/hooks/form";

export default function DeleteGroupButton({ group }: { group: UserGroup }) {
  const [open, setOpen] = React.useState(false);

  const { working, error, submit } = useForm();

  const onDelete = submit(async () => {
    await del(`/api/groups/${group.id}`);
    revalidatePath("/api/groups");
    setOpen(false);
    toast.success("Group Deleted");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
          <DialogDescription>Are you sure? This will permanently delete the user group.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <span className="font-bold">Name</span>
          <span className="col-span-2">{group.name}</span>
          <span className="font-bold">Description</span>
          <span className="col-span-2">{group.description}</span>
        </div>

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={working}>
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton variant="destructive" onClick={onDelete} disabled={working}>
            Delete
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
