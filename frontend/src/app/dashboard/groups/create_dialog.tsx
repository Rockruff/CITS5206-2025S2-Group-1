import { useState } from "react";

import { post, revalidatePath } from "@/api/common";
import { TrainingSelect } from "@/components/app/training-select";
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

export function CreateGroupDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const { useField, error, working, reset, submit } = useForm();
  const [name, setName] = useField("");
  const [description, setDescription] = useField("");
  const [trainings, setTrainings] = useField<string[]>([]);

  const handleCreate = submit(async () => {
    await post("/api/groups", { name, description, trainings });
    revalidatePath("/api/groups");
    revalidatePath("/api/trainings");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>Create user group by specifying name and description.</DialogDescription>
        </DialogHeader>

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
          <TrainingSelect value={trainings} onValueChange={setTrainings} />
        </div>

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <SubmitButton disabled={working} onClick={handleCreate}>
            Create
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
