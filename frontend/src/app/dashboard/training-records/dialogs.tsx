"use client";

import React, { useState } from "react";
import { useSWRConfig } from "swr";

import {
  TrainingRecord,
  TrainingRecordBatchCreateRequest,
  TrainingRecordCreateRequest,
  TrainingRecordUpdateRequest,
  batchCreateTrainingRecords,
  batchDeleteTrainingRecords,
  createTrainingRecord,
  deleteTrainingRecord,
  updateTrainingRecord,
} from "@/api/training-records";
import { listTrainings } from "@/api/trainings";
import { listUsers } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSet } from "@/hooks/reactive-set";

// Create Training Record Dialog
export function CreateTrainingRecordDialog({
  children,
  selection,
}: {
  children: React.ReactNode;
  selection: ReturnType<typeof useSet<string>>;
}) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("single");
  const [addToSelection, setAddToSelection] = useState(true);
  const [loading, setLoading] = useState(false);

  // Single mode form data
  const [singleFormData, setSingleFormData] = useState<TrainingRecordCreateRequest>({
    user: "",
    training: "",
    details: {},
  });

  // Batch mode form data
  const [batchFormData, setBatchFormData] = useState<TrainingRecordBatchCreateRequest>({
    user_ids: [],
    training_id: "",
    details: {},
  });

  const usersReq = listUsers({ page_size: 1000 });
  const trainingsReq = listTrainings();

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const record = await createTrainingRecord(singleFormData);
      mutate(
        (key) =>
          (typeof key === "string" && key.startsWith("/api/training-records")) ||
          (Array.isArray(key) && key[0] === "/api/training-records"),
        undefined,
        { revalidate: true },
      );
      setOpen(false);
      if (addToSelection) selection.add(record.id);
      setSingleFormData({ user: "", training: "", details: {} });
    } catch (error) {
      console.error("Failed to create training record:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await batchCreateTrainingRecords(batchFormData);
      mutate(
        (key) =>
          (typeof key === "string" && key.startsWith("/api/training-records")) ||
          (Array.isArray(key) && key[0] === "/api/training-records"),
        undefined,
        { revalidate: true },
      );
      setOpen(false);
      setBatchFormData({ user_ids: [], training_id: "", details: {} });
    } catch (error) {
      console.error("Failed to batch create training records:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Training Record</DialogTitle>
          <DialogDescription>
            Create training records by assigning users to trainings, or batch assign multiple users to a single
            training.
          </DialogDescription>
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
              Batch mode allows you to assign multiple users to a single training at once.
            </div>
          )}
        </div>

        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
                <label className="text-muted-foreground text-sm">User</label>
                <Select
                  value={singleFormData.user}
                  onValueChange={(value) => setSingleFormData({ ...singleFormData, user: value })}
                >
                  <SelectTrigger className="w-64 max-md:w-full">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersReq.data?.items.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <img className="size-6 rounded-full" src={user.avatar} />
                          <span>
                            {user.name} ({user.id})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
                <label className="text-muted-foreground text-sm">Training</label>
                <Select
                  value={singleFormData.training}
                  onValueChange={(value) => setSingleFormData({ ...singleFormData, training: value })}
                >
                  <SelectTrigger className="w-64 max-md:w-full">
                    <SelectValue placeholder="Select training" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingsReq.data?.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        {training.name} ({training.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-start">
                <label className="text-muted-foreground pt-2 text-sm">Details</label>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='Additional details (JSON format, e.g., {"score": 85, "certificate": "ABC123"})'
                  value={
                    singleFormData.details && Object.keys(singleFormData.details).length > 0
                      ? JSON.stringify(singleFormData.details, null, 2)
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === "") {
                      setSingleFormData({ ...singleFormData, details: {} });
                    } else {
                      try {
                        const parsed = JSON.parse(value);
                        setSingleFormData({ ...singleFormData, details: parsed });
                      } catch {
                        // Invalid JSON, keep the text but don't update details
                      }
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading || !singleFormData.user || !singleFormData.training}>
                {loading ? "Creating..." : "Create Record"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleBatchSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-start">
                <label className="text-muted-foreground pt-2 text-sm">Users</label>
                <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                  {usersReq.data?.items.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={user.id}
                        checked={batchFormData.user_ids.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBatchFormData({
                              ...batchFormData,
                              user_ids: [...batchFormData.user_ids, user.id],
                            });
                          } else {
                            setBatchFormData({
                              ...batchFormData,
                              user_ids: batchFormData.user_ids.filter((id) => id !== user.id),
                            });
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <img className="size-6 rounded-full" src={user.avatar} />
                        <label htmlFor={user.id} className="cursor-pointer text-sm">
                          {user.name} ({user.id})
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
                <label className="text-muted-foreground text-sm">Training</label>
                <Select
                  value={batchFormData.training_id}
                  onValueChange={(value) => setBatchFormData({ ...batchFormData, training_id: value })}
                >
                  <SelectTrigger className="w-64 max-md:w-full">
                    <SelectValue placeholder="Select training" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingsReq.data?.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        {training.name} ({training.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-start">
                <label className="text-muted-foreground pt-2 text-sm">Details</label>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='Additional details (JSON format, e.g., {"score": 85, "certificate": "ABC123"})'
                  value={
                    batchFormData.details && Object.keys(batchFormData.details).length > 0
                      ? JSON.stringify(batchFormData.details, null, 2)
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === "") {
                      setBatchFormData({ ...batchFormData, details: {} });
                    } else {
                      try {
                        const parsed = JSON.parse(value);
                        setBatchFormData({ ...batchFormData, details: parsed });
                      } catch {
                        // Invalid JSON, keep the text but don't update details
                      }
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={loading || !batchFormData.training_id || batchFormData.user_ids.length === 0}
              >
                {loading ? "Creating..." : `Create ${batchFormData.user_ids.length} Records`}
              </Button>
            </DialogFooter>
          </form>
        )}

        <div className="flex items-center gap-2">
          <Checkbox checked={addToSelection} onCheckedChange={(checked) => setAddToSelection(checked === true)} />
          <label className="text-sm">Add to current selection</label>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Training Record Dialog
export function EditTrainingRecordDialog({
  open,
  onOpenChange,
  record,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: TrainingRecord | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TrainingRecordUpdateRequest>({
    details: {},
  });
  const [detailsText, setDetailsText] = useState("");

  React.useEffect(() => {
    if (record) {
      setFormData({ details: record.details || {} });
      setDetailsText(
        record.details && Object.keys(record.details).length > 0 ? JSON.stringify(record.details, null, 2) : "",
      );
    }
  }, [record?.id]); // Only update when record ID changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    // Parse JSON only when submitting
    let details = {};
    if (detailsText.trim()) {
      try {
        details = JSON.parse(detailsText);
      } catch (error) {
        alert("Invalid JSON format in details field");
        return;
      }
    }

    setLoading(true);
    try {
      await updateTrainingRecord(record.id, { details });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update training record:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Training Record</DialogTitle>
          <DialogDescription>Update training record details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="details" className="text-right text-sm">
                Details
              </label>
              <textarea
                id="details"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring col-span-3 min-h-[100px] rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional details (JSON format)"
                value={detailsText}
                onChange={(e) => setDetailsText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Record"}
            </Button>
          </DialogFooter>
        </form>
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
            <strong>Completed:</strong> {new Date(record.timestamp).toLocaleDateString()}
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

// Batch Assign Training Dialog
export function BatchAssignTrainingDialog({
  children,
  selection,
}: {
  children: React.ReactNode;
  selection: ReturnType<typeof useSet<string>>;
}) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TrainingRecordBatchCreateRequest>({
    user_ids: [],
    training_id: "",
    details: {},
  });

  const usersReq = listUsers({ page_size: 1000 });
  const trainingsReq = listTrainings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await batchCreateTrainingRecords(formData);
      mutate(
        (key) =>
          (typeof key === "string" && key.startsWith("/api/training-records")) ||
          (Array.isArray(key) && key[0] === "/api/training-records"),
        undefined,
        { revalidate: true },
      );
      setOpen(false);
      setFormData({ user_ids: [], training_id: "", details: {} });
    } catch (error) {
      console.error("Failed to batch create training records:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Batch Assign Training</DialogTitle>
          <DialogDescription>Assign multiple users to a training at once.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="training" className="text-right text-sm">
                Training
              </label>
              <Select
                value={formData.training_id}
                onValueChange={(value) => setFormData({ ...formData, training_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select training" />
                </SelectTrigger>
                <SelectContent>
                  {trainingsReq.data?.map((training) => (
                    <SelectItem key={training.id} value={training.id}>
                      {training.name} ({training.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="pt-2 text-right text-sm">Users</label>
              <div className="col-span-3 max-h-48 overflow-y-auto rounded-md border p-2">
                {usersReq.data?.items.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={user.id}
                      checked={formData.user_ids.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            user_ids: [...formData.user_ids, user.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            user_ids: formData.user_ids.filter((id) => id !== user.id),
                          });
                        }
                      }}
                    />
                    <label htmlFor={user.id} className="text-sm">
                      {user.name} ({user.id})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="details" className="text-right text-sm">
                Details
              </label>
              <textarea
                id="details"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring col-span-3 min-h-[100px] rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional details (JSON format)"
                value={JSON.stringify(formData.details, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, details: parsed });
                  } catch {
                    // Invalid JSON, keep the text
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !formData.training_id || formData.user_ids.length === 0}>
              {loading ? "Creating..." : `Create ${formData.user_ids.length} Records`}
            </Button>
          </DialogFooter>
        </form>
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
