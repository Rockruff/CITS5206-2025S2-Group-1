import { useState } from "react";
import { toast } from "sonner";

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

export default function DeleteTrainingButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const handleDelete = async () => {
    setWorking(true);
    try {
      await deleteTraining(id);
      revalidatePath("/api/trainings");
      setOpen(false);
      toast.success("Training Deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete training");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Training</DialogTitle>
          <DialogDescription>Are you sure you want to delete "{name}"? This action cannot be undone.</DialogDescription>
        </DialogHeader>
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
