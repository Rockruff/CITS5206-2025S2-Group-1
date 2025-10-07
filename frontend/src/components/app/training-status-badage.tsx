import cn from "mxcn";

export function StatusBadge({ status }: { status: string }) {
  return (
    <div
      className={cn("rounded-full px-2 py-1 text-[.66rem]", {
        "bg-blue-100 text-blue-800": status === "PENDING",
        "bg-red-100 text-red-800": status === "FAILED",
        "bg-yellow-100 text-yellow-800": status === "EXPIRED",
        "bg-green-100 text-green-800": status === "PASSED",
      })}
    >
      {status}
    </div>
  );
}
