import { BubblesIcon, CircleXIcon, LoaderCircleIcon } from "lucide-react";

import { APIError } from "@/api/common";

export default function TableErrorDisplay({
  colSpan,
  isLoading,
  error,
}: {
  colSpan: number;
  isLoading: boolean;
  error: APIError | undefined;
}) {
  return (
    <tr className="p-0! not-first:hidden [&,&>*]:size-full!">
      <td colSpan={colSpan} className="text-muted-foreground justify-center">
        {isLoading ? (
          <>
            <LoaderCircleIcon className="animate-spin" />
            <span className="text-sm">Loading Data...</span>
          </>
        ) : error ? (
          <>
            <CircleXIcon />
            <span className="text-sm">{error.error}</span>
          </>
        ) : (
          <>
            <BubblesIcon />
            <span className="text-sm">Nothing is Found</span>
          </>
        )}
      </td>
    </tr>
  );
}
