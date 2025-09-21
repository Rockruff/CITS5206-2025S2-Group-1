//For Delete Button in Groups Page
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

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

//For Delete Button in Groups Page

export default function DeleteGroupButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    setError(null);
    setSubmitting(true);
    try {
      const resp = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
        // include cookies/session if your backend uses SessionAuthentication
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        let detail = "";
        try {
          const j = await resp.json();
          detail = (j?.detail || j?.error || JSON.stringify(j)) ?? "";
        } catch {}
        throw new Error(`Delete failed (${resp.status}) ${detail}`);
      }

      setOpen(false);
      router.refresh(); // re-fetch server component so the row disappears
    } catch (err: any) {
      setError(err.message ?? "Failed to delete group");
    } finally {
      setSubmitting(false);
    }
  }

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

        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={submitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={onDelete} disabled={submitting}>
            {submitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
