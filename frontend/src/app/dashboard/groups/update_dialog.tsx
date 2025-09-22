import React, { useState } from "react";
import { toast } from "sonner";

import { patch, revalidatePath } from "@/api/common";
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
import { Input } from "@/components/ui/input";
import { useForm } from "@/hooks/form";

export function UpdateGroupDialog({ group, children }: { group: UserGroup; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const { useField, error, working, reset, submit } = useForm();
  const [name, setName] = useField(group.name);
  const [description, setDescription] = useField(group.description);

  const handleUpdate = submit(async () => {
    await patch(`/api/groups/${group.id}`, { name, description });
    revalidatePath("/api/groups");
    setOpen(false);
    toast.success("Group Updated");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Properties </DialogTitle>
          <DialogDescription>Update & Delete user group</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm">Name</label>
            <Input placeholder="e.g. CSSE Staff" value={name} onValueChange={setName} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Description</label>
            <Input placeholder="e.g. For CSSE Faculty Training" value={description} onValueChange={setDescription} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Associated Trainings</label>
            <Input />
          </div>
          <div className="text-destructive text-sm empty:hidden">{error}</div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <SubmitButton disabled={working} onClick={handleUpdate}>
            Update
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
