"use client";

import { useEffect, useMemo, useState } from "react";

import AppPagination from "@/components/common/pager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Training = {
  id: number;
  code: string;
  title: string;
  description: string;
  active: boolean;
  expiry_mode: "none" | "fixed_days" | "per_record";
  default_expiry_days?: number | null;
};

type ApiList<T> = T[]; // Simple list for now

export default function Trainings() {
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<Training | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((t) => {
      if (onlyActive && !t.active) return false;
      if (!ql) return true;
      return (
        t.code.toLowerCase().includes(ql) ||
        t.title.toLowerCase().includes(ql) ||
        (t.description || "").toLowerCase().includes(ql)
      );
    });
  }, [items, q, onlyActive]);

  async function fetchItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trainings", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load trainings (${res.status})`);
      const data: ApiList<Training> = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load trainings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  function ResetButton() {
    if (!q && !onlyActive) return null;
    return (
      <button
        onClick={() => {
          setQ("");
          setOnlyActive(false);
        }}
        className="rounded border px-3 py-1"
      >
        Reset
      </button>
    );
  }

  const totalItems = filtered.length;
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Training Management</h1>
        <p className="text-muted-foreground">Manage trainings, expiry, and activity</p>
      </div>

      <div className="bg-background overflow-hidden rounded-lg shadow">
        <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center">
          <Input placeholder="Search code/title/description" value={q} onChange={(e) => setQ(e.target.value)} />

          <div className="flex items-center gap-2">
            <Checkbox checked={onlyActive} onCheckedChange={(v) => setOnlyActive(Boolean(v))} />
            <span className="text-muted-foreground text-sm">Active only</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="default" onClick={() => setCreating(true)}>
              New Training
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setOnlyActive(false);
                setCurrentPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <table
          className={cn(
            "h-92 [&_tbody_tr]:h-16 [&_thead_tr]:h-12",
            "flex flex-col overflow-x-auto overflow-y-hidden",
            "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto",
            "border-y [&_tbody]:mb-[-1px] [&_tr]:border-b",
            "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8",
            "[&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2",
            "[&_th,td]:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:flex-1",
          )}
        >
          {loading ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2">
              Loading Data...
            </div>
          ) : error ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2">{error}</div>
          ) : paged.length === 0 ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2">
              Nothing is Found
            </div>
          ) : (
            <>
              <thead>
                <tr>
                  <th>
                    <div className="text-xs font-bold">Code</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Title</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Active</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Expiry</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Action</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-mono text-sm">{t.code}</div>
                    </td>
                    <td>
                      <div className="text-sm">{t.title}</div>
                    </td>
                    <td>
                      <div className="text-sm">{t.active ? "Yes" : "No"}</div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {t.expiry_mode === "none"
                          ? "No expiry"
                          : t.expiry_mode === "fixed_days"
                            ? `${t.default_expiry_days ?? "-"} days`
                            : "Per record"}
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
                          Edit
                        </Button>
                        <DeleteButton id={t.id} code={t.code} onDone={fetchItems} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>

        <div className="px-4 py-3">
          <AppPagination
            totalItems={totalItems}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {creating && (
        <EditDrawer
          title="Create Training"
          initial={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            fetchItems();
          }}
        />
      )}

      {editing && (
        <EditDrawer
          title={`Edit ${editing.code}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchItems();
          }}
        />
      )}
    </>
  );
}

function DeleteButton({ id, code, onDone }: { id: number; code: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      disabled={busy}
      size="sm"
      variant="destructive"
      onClick={async () => {
        if (!confirm(`Delete training ${code}?`)) return;
        setBusy(true);
        try {
          const res = await fetch(`/api/trainings/${id}/`, { method: "DELETE", credentials: "include" });
          if (!res.ok) throw new Error("Delete failed");
          onDone();
        } catch (e) {
          alert((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      Delete
    </Button>
  );
}

function EditDrawer({
  title,
  initial,
  onClose,
  onSaved,
}: {
  title: string;
  initial: Training | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Training>>(
    initial ?? {
      code: "",
      title: "",
      description: "",
      active: true,
      expiry_mode: "none",
      default_expiry_days: null,
    },
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof Training>(key: K, value: Training[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const isCreate = !initial;
      const res = await fetch(isCreate ? "/api/trainings/" : `/api/trainings/${initial!.id}/`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Save failed");
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex bg-black/30">
      <div className="ml-auto h-full w-full max-w-xl space-y-4 overflow-y-auto bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="px-2 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm">Code</label>
            <input
              value={form.code || ""}
              onChange={(e) => set("code", e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="HSW-FIRE-101"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Title</label>
            <input
              value={form.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Fire Safety 101"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[90px] w-full rounded border px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Active</label>
            <input type="checkbox" checked={!!form.active} onChange={(e) => set("active", e.target.checked)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Expiry Mode</label>
            <select
              value={form.expiry_mode || "none"}
              onChange={(e) => set("expiry_mode", e.target.value as Training["expiry_mode"])}
              className="w-full rounded border px-3 py-2"
            >
              <option value="none">No expiry</option>
              <option value="fixed_days">Fixed days from completion</option>
              <option value="per_record">Per record</option>
            </select>
          </div>

          {form.expiry_mode === "fixed_days" && (
            <div className="space-y-1">
              <label className="text-sm">Default Expiry Days</label>
              <input
                type="number"
                value={form.default_expiry_days ?? ""}
                onChange={(e) => set("default_expiry_days", e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded border px-3 py-2"
                placeholder="365"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <button
            disabled={saving}
            onClick={save}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button disabled={saving} onClick={onClose} className="rounded border px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
