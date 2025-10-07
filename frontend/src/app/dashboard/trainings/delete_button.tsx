import { useState } from "react";

import { revalidatePath } from "@/api/common";
import { deleteTraining } from "@/api/trainings";
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

export default function DeleteTrainingButton({
  children,
  id,
  name,
}: {
  children: React.ReactNode;
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const { working, error, submit } = useForm();

  const handleDelete = submit(async () => {
    await deleteTraining(id);
    revalidatePath("/api/trainings");
    revalidatePath("/api/groups");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Training</DialogTitle>
          <DialogDescription>Are you sure you want to delete "{name}"? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="text-destructive text-sm empty:hidden">{error}</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={working} onClick={handleDelete}>
            {working ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
