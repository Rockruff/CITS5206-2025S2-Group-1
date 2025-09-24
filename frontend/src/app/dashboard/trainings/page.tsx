"use client";

import * as React from "react";
import { useState } from "react";

import { CreateTrainingDialog } from "./create_dialog";
import DeleteTrainingButton from "./delete_button";
import { UpdateTrainingDialog } from "./update_dialog";
import { listTrainings } from "@/api/trainings";
import TableHeader from "@/components/common/orderby";
import AppPagination from "@/components/common/pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Trainings() {
  const { data: trainings } = listTrainings();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState("name");

  const filteredTrainings = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = trainings;

    // Filter by search term
    if (term) {
      filtered = filtered.filter(
        (training) =>
          (training.name || "").toLowerCase().includes(term) ||
          (training.description || "").toLowerCase().includes(term),
      );
    }

    // Filter by type
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((training) => training.type === typeFilter);
    }

    // Sort by orderBy
    filtered.sort((a, b) => {
      const isDescending = orderBy.startsWith("-");
      const field = isDescending ? orderBy.slice(1) : orderBy;
      const multiplier = isDescending ? -1 : 1;

      let aValue: any;
      let bValue: any;

      switch (field) {
        case "name":
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          break;
        case "expiry":
          aValue = a.expiry || 0;
          bValue = b.expiry || 0;
          break;
        case "created":
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });

    return filtered;
  }, [search, typeFilter, orderBy, trainings]);

  // Calculate pagination
  const totalItems = filteredTrainings.length;
  const _totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTrainings = filteredTrainings.slice(startIndex, endIndex);

  // Reset to first page when filters or sorting change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, orderBy]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Training Management</h1>
        <p className="text-muted-foreground">Manage training courses and their configurations</p>
      </div>

      <div className="bg-background overflow-hidden rounded-lg shadow">
        <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center">
          <Input type="text" value={search} onValueChange={setSearch} placeholder="Search trainings..." />

          <div className="flex items-center gap-2">
            <label className="text-muted-foreground text-sm">Type:</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Any Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Type</SelectItem>
                <SelectItem value="LMS">LMS</SelectItem>
                <SelectItem value="TRYBOOKING">TryBooking</SelectItem>
                <SelectItem value="EXTERNAL">External</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <CreateTrainingDialog>
              <Button>New Training</Button>
            </CreateTrainingDialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          {totalItems === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8">
              <span className="text-sm">No trainings found</span>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2">
                    <TableHeader orderBy={orderBy} setOrderBy={setOrderBy} columns={["Name"]} />
                  </th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">
                    <TableHeader orderBy={orderBy} setOrderBy={setOrderBy} columns={["Expiry"]} />
                  </th>
                  <th className="px-3 py-2">
                    <TableHeader orderBy={orderBy} setOrderBy={setOrderBy} columns={["Created"]} />
                  </th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrainings.map((training) => (
                  <tr key={training.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{training.name}</td>
                    <td className="px-3 py-2">{training.description?.trim() ? training.description : "—"}</td>
                    <td className="px-3 py-2">{training.type}</td>
                    <td className="px-3 py-2">{training.expiry === 0 ? "No expiry" : `${training.expiry} days`}</td>
                    <td className="px-3 py-2">{new Date(training.timestamp).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <UpdateTrainingDialog training={training}>
                          <Button size="sm">Edit</Button>
                        </UpdateTrainingDialog>
                        <DeleteTrainingButton id={training.id} name={training.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalItems > 0 && (
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
        )}
      </div>
    </>
  );
}
