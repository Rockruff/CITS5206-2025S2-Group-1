//For creating a new group
//used in groups_client.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

//For creating a new group
//used in groups_client.tsx

//For creating a new group

export default function CreateGroupDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }

    setSubmitting(true);
    try {
      // Your Next proxy at /api/* forwards to Django /groups
      const resp = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      if (!resp.ok) {
        let detail = "";
        try {
          const j = await resp.json();
          detail = (j?.detail || j?.error || JSON.stringify(j)) ?? "";
        } catch {}
        throw new Error(`Create failed (${resp.status}) ${detail}`);
      }

      // reset form & close
      setName("");
      setDescription("");
      setOpen(false);

      // revalidate the server component and show the new row
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Create Group</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new group</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              placeholder="e.g., Permanent Staff"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              placeholder="Short summary of who is in this group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
