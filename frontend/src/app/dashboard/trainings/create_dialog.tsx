import { useState } from "react";
import { toast } from "sonner";

import { revalidatePath } from "@/api/common";
import { TrainingCreateRequest, createTraining } from "@/api/trainings";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@/hooks/form";

export function CreateTrainingDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const { useField, error, working, reset, submit } = useForm();
  const [name, setName] = useField("");
  const [description, setDescription] = useField("");
  const [type, setType] = useField<"LMS" | "TRYBOOKING" | "EXTERNAL">("LMS");
  const [expiry, setExpiry] = useField("");
  const [completanceScore, setCompletanceScore] = useField("");

  const handleCreate = submit(async () => {
    const config: Record<string, any> = {};

    // LMS type requires completance_score
    if (type === "LMS") {
      config.completance_score = parseInt(completanceScore) || 0;
    }

    const data: TrainingCreateRequest = {
      name,
      description,
      type,
      expiry: parseInt(expiry) || 0,
      config,
    };

    await createTraining(data);
    revalidatePath("/api/trainings");
    reset();
    setOpen(false);
    toast.success("Training Created");
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Training</DialogTitle>
          <DialogDescription>Create a new training course by specifying its details.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={(value: "LMS" | "TRYBOOKING" | "EXTERNAL") => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select training type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LMS">LMS</SelectItem>
                <SelectItem value="TRYBOOKING">TryBooking</SelectItem>
                <SelectItem value="EXTERNAL">External</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Expiry (days)</label>
            <Input type="number" placeholder="0 for no expiry" value={expiry} onValueChange={setExpiry} min="0" />
            <p className="text-muted-foreground text-xs">Number of days after which training expires (0 = no expiry)</p>
          </div>

          {type === "LMS" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Completion Score</label>
              <Input
                type="number"
                placeholder="90"
                value={completanceScore}
                onValueChange={setCompletanceScore}
                min="0"
              />
              <p className="text-muted-foreground text-xs">Minimum score required to complete the training</p>
            </div>
          )}

          <div className="text-destructive text-sm empty:hidden">{error}</div>
        </div>

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
