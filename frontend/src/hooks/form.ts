import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

import { APIError } from "@/api/common";

function extractDRFErrorFromObject(data: any): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const err = extractDRFErrorFromObject(item);
      if (err) return err;
    }
    return undefined;
  }

  const messages = data.non_field_errors;
  if (Array.isArray(messages) && messages[0]) {
    return messages[0];
  }

  for (const field in data) {
    const messages = data[field];
    if (Array.isArray(messages) && messages[0]) {
      return `${field}: ${messages[0]}`;
    }

    if (typeof messages === "object") {
      // list field, has key "0", "1", ... etc
      const data = messages;
      const err = extractDRFErrorFromObject(data);
      if (err) return err;
    }
  }

  return undefined;
}

function transformDRFError({ error, data }: APIError): string {
  const err = extractDRFErrorFromObject(data);
  return err || error;
}

type FormState = {
  values: any[];
  initials: any[];
  error: string;
  working: boolean;
};

export function useForm() {
  const stateRef = useRef<FormState>({
    values: [],
    initials: [],
    error: "",
    working: false,
  });

  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  let counter = 0;

  function useField<T>(initial: T): [T, Dispatch<SetStateAction<T>>] {
    const index = counter++; // relies on the order of hook call

    const setField: Dispatch<SetStateAction<T>> = (value) => {
      const state = stateRef.current;
      if (state.working) return;

      const prev = state.values[index];
      state.values[index] = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;

      state.error = "";
      rerender();
    };

    const state = stateRef.current;
    if (state.values.length <= index) {
      state.values.push(initial);
      state.initials.push(initial);
      rerender();
      return [initial, setField];
    } else {
      return [state.values[index], setField];
    }
  }

  function reset() {
    const state = stateRef.current;
    if (state.working) return;
    state.values = [...state.initials];
    state.error = "";
    rerender();
  }

  function submit(callback: () => Promise<void> | void) {
    return async () => {
      const state = stateRef.current;
      if (state.working) return;

      state.working = true;
      state.error = "";
      rerender();

      try {
        await callback();
        toast.success("Success");
      } catch (e: any) {
        let err = transformDRFError(e);
        if (!err) err = String(e);
        state.error = err;
      } finally {
        state.working = false;
        rerender();
      }
    };
  }

  return {
    useField,
    get error() {
      return stateRef.current.error;
    },
    get working() {
      return stateRef.current.working;
    },
    reset,
    submit,
  } as const;
}
