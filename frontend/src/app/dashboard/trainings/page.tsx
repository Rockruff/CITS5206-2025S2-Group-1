"use client";

import { useEffect, useState } from "react";

import { Training, listTrainings } from "@/api/trainings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Trainings() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTrainings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTrainings();
      setTrainings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load trainings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const filteredTrainings = trainings.filter(
    (training) =>
      training.name.toLowerCase().includes(search.toLowerCase()) ||
      training.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Training Management</h1>
        <p className="text-muted-foreground">Manage training courses and their configurations</p>
      </div>

      <div className="bg-background overflow-hidden rounded-lg shadow">
        <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainings..."
          />
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => {}}>New Training</Button>
          </div>
        </div>

        <div className="contents [&>*]:h-92 [&>*]:border-y">
          {loading ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <span className="text-sm">Loading Data...</span>
            </div>
          ) : error ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <span className="text-sm">{error}</span>
            </div>
          ) : filteredTrainings.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <span className="text-sm">No trainings found</span>
            </div>
          ) : (
            <table
              className={cn(
                "[&_tbody_tr]:h-16 [&_thead_tr]:h-12",
                "flex flex-col overflow-x-auto overflow-y-hidden",
                "[&_tbody]:flex-1 [&_tbody]:overflow-y-auto",
                "[&_tbody]:mb-[-1px] [&_tr]:border-b",
                "[&_tr]:flex [&_tr]:items-stretch [&_tr]:gap-8 [&_tr]:px-8",
                "[&_th,td]:flex [&_th,td]:items-center [&_th,td]:gap-2",
                "[&_th,td]:w-20 [&_th,td]:nth-1:w-4 [&_th,td]:nth-2:flex-1",
              )}
            >
              <thead>
                <tr>
                  <th>
                    <div className="text-xs font-bold">Name</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Type</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Expiry</div>
                  </th>
                  <th>
                    <div className="text-xs font-bold">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainings.map((training) => (
                  <tr key={training.id}>
                    <td>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">{training.name}</div>
                        <div className="text-muted-foreground max-w-xs truncate text-xs">{training.description}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{training.type}</div>
                    </td>
                    <td>
                      <div className="text-sm">{training.expiry === 0 ? "No expiry" : `${training.expiry} days`}</div>
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
