import { useEffect, useState } from "react";

import { patch, revalidatePath } from "@/api/common";
import { UserGroup } from "@/api/groups";
// Training select component (we'll need to create this)
import { TrainingSelect } from "@/components/app/training-select";
import { UserGroupSelectV2 } from "@/components/app/user-group-select";
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
import { ReactiveSet } from "@/hooks/reactive-set";

export function GroupTrainingAssignmentDialog({
  children,
  group,
  mode,
  selection,
}: {
  children: React.ReactNode;
  group?: UserGroup;
  mode: "add" | "remove";
  selection?: ReactiveSet<string>;
}) {
  const [open, setOpen] = useState(false);

  const { useField, working, error, submit } = useForm();
  const [groups, setGroups] = useField<string[]>(group ? [group.id] : []);
  const [trainings, setTrainings] = useField<string[]>([]);

  useEffect(() => {
    if (selection && !group) {
      setGroups(selection.values());
    }
  }, [selection, group]);

  const handler = submit(async () => {
    if (groups.length === 0) throw new Error("Please select at least 1 group");
    if (trainings.length === 0) throw new Error("Please select at least 1 training");

    await patch(
      `/api/groups/batch/trainings`,
      groups.map((id: string) => ({
        group: id,
        [mode === "remove" ? "remove" : "add"]: trainings,
      })),
    );

    revalidatePath("/api/groups");
    revalidatePath("/api/trainings");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "remove" ? "Remove from Training" : "Assign to Training"}</DialogTitle>
          <DialogDescription>
            {mode === "remove"
              ? "Remove selected groups from the selected trainings."
              : "Assign selected groups to the selected trainings."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm">Groups</label>
          <UserGroupSelectV2 className="w-64 max-md:w-full" value={groups} onValueChange={setGroups} />
        </div>
        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <label className="text-muted-foreground text-sm">Target Trainings</label>
          <TrainingSelect className="w-64 max-md:w-full" value={trainings} onValueChange={setTrainings} />
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
