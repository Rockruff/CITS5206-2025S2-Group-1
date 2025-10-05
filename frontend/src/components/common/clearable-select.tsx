import * as React from "react";

import { Select, SelectItem } from "@/components/ui/select";

// workaround for <Select> not accepting empty string
const NULL = "__NULL__";

/**
 * ClearableSelect - wraps shadcn's <Select> but supports clearing.
 * Accepts the same props as <Select>.
 */
export function ClearableSelect({ onValueChange, ...props }: React.ComponentProps<typeof Select>) {
  const handleChange = (val: string) => {
    if (!onValueChange) return;
    onValueChange(val === NULL ? "" : val);
  };

  return <Select {...props} onValueChange={handleChange} />;
}

/**
 * SelectClear - special <SelectItem> that clears the selection.
 * Does not accept a `value` prop in its argument.
 */
export function SelectClear(props: Omit<React.ComponentProps<typeof SelectItem>, "value">) {
  return <SelectItem {...props} value={NULL} />;
}
