import { Dispatch, SetStateAction, useRef, useState } from "react";

import { APIError, DRFError } from "@/api/common";

function formatDRFError(data: DRFError | undefined, key: string) {
  if (!data) return undefined;
  const value = data[key];
  if (!value) return undefined;
  if (!Array.isArray(value)) return undefined;
  return value[0]; // first error only
}

function transformDRFError(err: APIError) {
  const fallbackError = err.error;
  if (!err.data) return fallbackError;

  const nonFieldError = formatDRFError(err.data, "non_field_errors");
  if (nonFieldError) return nonFieldError;

  for (const field in err.data) {
    const fieldError = formatDRFError(err.data, field);
    if (fieldError) return `${field}: ${fieldError}`;
  }

  return fallbackError;
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
