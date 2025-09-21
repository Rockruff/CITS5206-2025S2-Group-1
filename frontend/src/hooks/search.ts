"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function parseValue(encoded: string | null, init: any) {
  if (encoded === null) return init;
  if (typeof init === "string") return encoded;
  try {
    const value = JSON.parse(encoded);
    return typeof value === typeof init ? value : init;
  } catch {
    return init;
  }
}

function serializeValue(value: any) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function useQueryParamsState<T extends Record<string, any>>(defaults: T) {
  const searchParams = useSearchParams();
  const getValuesFromUrl = () => {
    const result: any = {};
    for (const key in defaults) {
      const init = defaults[key];
      const encoded = searchParams.get(key);
      result[key] = parseValue(encoded, init);
    }
    return result as T;
  };

  const [state, setState] = useState<T>(getValuesFromUrl);
  const updateState = (updates: Partial<T>) => {
    setState((prevState) => {
      const newState = { ...prevState, ...updates };
      return newState;
    });
  };

  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const params = new URLSearchParams();
    for (const key in defaults) {
      const init = defaults[key];
      const value = state[key];
      if (value === undefined || value === null || value === init) {
        continue;
      }
      params.set(key, serializeValue(value));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [state]);

  return [state, updateState] as const;
}
