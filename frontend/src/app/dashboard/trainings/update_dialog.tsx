import { useState } from "react";

import { revalidatePath } from "@/api/common";
import { Training, TrainingUpdateRequest, updateTraining } from "@/api/trainings";
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
import { Input, NumberInput } from "@/components/ui/input";
import { useForm } from "@/hooks/form";

export function UpdateTrainingDialog({ training, children }: { training: Training; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const { useField, error, working, submit } = useForm();
  const [name, setName] = useField(training.name);
  const [description, setDescription] = useField(training.description);
  const [expiry, setExpiry] = useField<number>(training.expiry);
  const [completanceScore, setCompletanceScore] = useField<number>(training.config.completance_score || 100);
  const [groups, setGroups] = useField<string[]>(training.groups);

  const handleUpdate = submit(async () => {
    const config: Record<string, any> = { ...training.config };

    // LMS type requires completance_score
    if (training.type === "LMS") {
      config.completance_score = completanceScore;
    } else {
      // Remove completance_score if not LMS type
      delete config.completance_score;
    }

    const data: TrainingUpdateRequest = {
      name,
      description,
      expiry,
      config,
      groups,
    };

    await updateTraining(training.id, data);
    revalidatePath("/api/trainings");
    revalidatePath("/api/groups");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Training</DialogTitle>
          <DialogDescription>Update the training course details.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Name</label>
          <Input placeholder="e.g. Laboratory Safety Training" value={name} onValueChange={setName} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="e.g. Basic laboratory safety procedures for students"
            value={description}
            onValueChange={setDescription}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Groups</label>
          <UserGroupSelectV2 value={groups} onValueChange={setGroups} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Expiry (days)</label>
          <NumberInput value={expiry} onValueChange={setExpiry} />
          <p className="text-muted-foreground text-xs">
            Validaty period of the underlying training records in days. (0 = no expiry)
          </p>
        </div>

        {training.type === "LMS" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Completion Score</label>
            <NumberInput value={completanceScore} onValueChange={setCompletanceScore} />
            <p className="text-muted-foreground text-xs">Minimum score required to complete the training</p>
          </div>
        )}

        <div className="text-destructive text-sm empty:hidden">{error}</div>

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
