"use client";

import { FileIcon } from "lucide-react";
import prettyBytes from "pretty-bytes";
import React, { useState } from "react";
import { useSWRConfig } from "swr";

import { patch, post, revalidatePath } from "@/api/common";
import { TrainingRecord, batchDeleteTrainingRecords, deleteTrainingRecord } from "@/api/training-records";
import { getTraining } from "@/api/trainings";
import { TrainingSingleSelect } from "@/components/app/training-select";
import { UserSelect } from "@/components/app/user-select";
import { DatePicker } from "@/components/common/date-picker";
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
import { NumberInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@/hooks/form";
import { useSet } from "@/hooks/reactive-set";
import { pickFile } from "@/lib/pick-file";
import { formatDate } from "@/lib/utils";

export function CreateTrainingRecordDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("single");

  const { useField, error, working, submit } = useForm();

  const [training, setTraining] = useField("");
  const [users, setUsers] = useField<string[]>([]);
  const [timestamp, setTimestamp] = useField<string>("");
  const [score, setScore] = useField<number>(100);
  const [file, setFile] = useField<File | null>(null);

  const { data: trainingObj } = getTraining(training);

  const handleSingleCreate = submit(async () => {
    if (users.length !== 1) {
      throw new Error("Please select exactly one user.");
    }
    const user = users[0];
    const payload = { training, user, timestamp, details: {} };
    if (trainingObj?.type === "LMS") {
      payload.details = { score };
    }
    await post("/api/training-records", payload);
    revalidatePath("/api/training-records");
    setOpen(false); // close after success
  });

  const handleBatchCreate = submit(async () => {
    const formData = new FormData();
    formData.append("training", training);
    formData.append("file", file!); // let backend handle null here
    await post("/api/training-records/batch", formData);
    revalidatePath("/api/training-records");
    setOpen(false); // close after success
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Record</DialogTitle>
          <DialogDescription>Create training record mannually, or upload a file.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm">Mode</label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
            </SelectContent>
          </Select>
          {mode !== "single" && (
            <div className="text-muted-foreground text-sm">
              During batch operations, if the user already has a record in that training, record will be updated if the
              record is older than the record from the uploaded file, or remain untouched if not.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm">Training</label>
          <TrainingSingleSelect className="w-full" value={training} onValueChange={setTraining} />
        </div>

        {mode === "single" ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm">User</label>
              <UserSelect className="w-full" value={users} onValueChange={setUsers} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">
                Record Date{" "}
                {trainingObj && (trainingObj.expiry ? `(Valid For ${trainingObj.expiry} Days)` : "(No Expiry)")}
              </label>
              <DatePicker className="w-full" value={timestamp} onValueChange={setTimestamp} />
            </div>

            {trainingObj?.type === "LMS" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm">Score ({trainingObj.config.completance_score} to pass)</label>
                <NumberInput value={score} onValueChange={setScore} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-sm">File (Accept CSV and XLSX)</label>
            {file && (
              <>
                <FileIcon className="mx-auto" />
                <div className="text-center text-xs">
                  {file.name} ({prettyBytes(file.size)})
                </div>
              </>
            )}
            <Button
              onClick={async () => {
                const file = await pickFile(".csv");
                if (file) setFile(file);
              }}
            >
              {!file ? "Select File" : "Pick Another File"}
            </Button>
          </div>
        )}

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={working} variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton disabled={working} onClick={mode === "single" ? handleSingleCreate : handleBatchCreate}>
            Create
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditTrainingRecordDialog({ children, record }: { children: React.ReactNode; record: TrainingRecord }) {
  const [open, setOpen] = useState(false);
  const { useField, error, working, submit } = useForm();

  const [timestamp, setTimestamp] = useField<string>(record.timestamp);

  const [score, setScore] = useField<number>(Number.isSafeInteger(record.details.score) ? record.details.score : 100);
  const { data: trainingObj } = getTraining(record.training);

  const handler = submit(async () => {
    const payload = { timestamp, details: {} };
    if (trainingObj?.type === "LMS") {
      payload.details = { score };
    }
    await patch(`/api/training-records/${record.id}`, payload);
    revalidatePath("/api/training-records");
    setOpen(false); // close after success
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Record</DialogTitle>
          <DialogDescription>Update training completion info.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm">
            Record Date {trainingObj && (trainingObj.expiry ? `(Valid For ${trainingObj.expiry} Days)` : "(No Expiry)")}
          </label>
          <DatePicker className="w-full" value={timestamp} onValueChange={setTimestamp} />
        </div>

        {trainingObj?.type === "LMS" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm">Score ({trainingObj.config.completance_score} to pass)</label>
            <NumberInput value={score} onValueChange={setScore} />
          </div>
        )}

        <div className="text-destructive text-sm empty:hidden">{error}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={working} variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton disabled={working} onClick={handler}>
            Update
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Training Record Dialog
export function DeleteTrainingRecordDialog({
  record,
  children,
  selection,
}: {
  record: TrainingRecord;
  children: React.ReactNode;
  selection: ReturnType<typeof useSet<string>>;
}) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTrainingRecord(record.id);
      selection.remove(record.id);
      mutate(
        (key) =>
          (typeof key === "string" && key.startsWith("/api/training-records")) ||
          (Array.isArray(key) && key[0] === "/api/training-records"),
        undefined,
        { revalidate: true },
      );
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete training record:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Training Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this training record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            <strong>User:</strong> {record.user}
            <br />
            <strong>Training:</strong> {record.training}
            <br />
            <strong>Completed:</strong> {formatDate(record.timestamp)}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Batch Delete Training Records Dialog
export function BatchDeleteTrainingRecordsDialog({
  children,
  selection,
}: {
  children: React.ReactNode;
  selection: ReturnType<typeof useSet<string>>;
}) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await batchDeleteTrainingRecords(selection.values());
      selection.clear();
      mutate(
        (key) =>
          (typeof key === "string" && key.startsWith("/api/training-records")) ||
          (Array.isArray(key) && key[0] === "/api/training-records"),
        undefined,
        { revalidate: true },
      );
      setOpen(false);
    } catch (error) {
      console.error("Failed to batch delete training records:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Training Records</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selection.length} training records? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : `Delete ${selection.length} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
