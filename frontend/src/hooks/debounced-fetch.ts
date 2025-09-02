import { useEffect, useRef, useState } from "react";

export function useDebouncedFetch<T>(
  fetchFn: () => Promise<T>, // response promise, with optional abort()
  deps: any[] = [],
  delay: number = 500,
): [T | null, boolean] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const lastRequestRef = useRef<{ abort?: () => void } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstFetch = useRef(true);

  useEffect(() => {
    setLoading(true);

    // cancel previous debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const executeFetch = () => {
      // abort previous request if any
      if (lastRequestRef.current?.abort) {
        lastRequestRef.current.abort();
      }

      const request = fetchFn();
      lastRequestRef.current = request as any;

      request.then((res) => setData(res)).finally(() => setLoading(false));
    };

    if (isFirstFetch.current) {
      executeFetch();
      isFirstFetch.current = false;
    } else {
      timeoutRef.current = setTimeout(executeFetch, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (lastRequestRef.current?.abort) lastRequestRef.current.abort();
    };
  }, deps);

  return [data, loading];
}
