import * as React from "react";

import { cn } from "@/lib/utils";

function InputOriginal({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

type InputProps = React.ComponentProps<"input"> & {
  onValueChange?: (value: string) => void;
};

function Input({ onChange, onValueChange, ...props }: InputProps) {
  return (
    <InputOriginal
      {...props}
      onChange={(e) => {
        if (onValueChange) {
          onValueChange(e.target.value);
        }
        if (onChange) {
          onChange(e);
        }
      }}
    />
  );
}

function NumberInput({ value, onValueChange }: { value: number; onValueChange: (value: number) => void }) {
  return (
    <InputOriginal
      type="number"
      value={String(value)}
      onChange={(e) => {
        let value = e.target.valueAsNumber;
        if (Number.isNaN(value)) value = 0;
        onValueChange(value);
      }}
    />
  );
}

export { Input, NumberInput };
