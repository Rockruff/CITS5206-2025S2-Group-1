//For Delete Button in Groups Page
//used in groups_client.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";

import { del, revalidatePath } from "@/api/common";
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

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page
//used in groups_client.tsx

//For Delete Button in Groups Page

export default function DeleteGroupButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);

  const { working, error, submit } = useForm();

  const onDelete = submit(async () => {
    await del(`/api/groups/${id}`);
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
          <DialogTitle>Delete group</DialogTitle>
          <DialogDescription>
            This will permanently remove <span className="font-semibold">{name}</span>.
          </DialogDescription>
        </DialogHeader>

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
