"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import React from "react";

interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
}

export default function Table<T>({ data, columns }: TableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onEnd", // resize updates immediately
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed border-collapse">
        <thead className="text-xs">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="[&>*]:border-y [&>*]:px-4 [&>*]:py-4 [&>*]:text-left [&>*:first-child]:pl-8 [&>*:last-child]:pr-8 [&>*:last-child]:text-right"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    width: header.getSize(),
                  }}
                  className="relative truncate overflow-hidden whitespace-nowrap uppercase"
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center justify-between">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none"
                        />
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="bg-card text-card-foreground text-sm">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="[&>*]:border-b [&>*]:px-4 [&>*]:py-4 [&>*]:text-left [&>*:first-child]:pl-8 [&>*:last-child]:pr-8 [&>*:last-child]:text-right"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className="truncate overflow-hidden whitespace-nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
