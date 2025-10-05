import { useMemo, useState } from "react";

export interface ReactiveSet<T> {
  /** Set-like interfaces */
  add: (...items: T[]) => void;
  remove: (...items: T[]) => void;
  has: (...items: T[]) => boolean;
  clear: () => void;
  /** Array-like interfaces */
  length: number;
  values: () => T[];
  map: <R>(callback: (item: T, index: number) => R) => R[];
}

export function useSet<T>(initialItems: T[] = []): ReactiveSet<T> {
  const set = useMemo(() => new Set<T>(initialItems), []);

  const [, setVersion] = useState(0);
  const forceUpdate = () => setVersion((v) => v + 1);

  return {
    add(...items: T[]) {
      let changed = false;
      items.forEach((item) => {
        if (!set.has(item)) {
          set.add(item);
          changed = true;
        }
      });
      if (changed) forceUpdate();
    },

    remove(...items: T[]) {
      let changed = false;
      items.forEach((item) => {
        if (set.has(item)) {
          set.delete(item);
          changed = true;
        }
      });
      if (changed) forceUpdate();
    },

    has(...items: T[]) {
      return items.length > 0 && items.every((item) => set.has(item));
    },

    clear() {
      if (set.size > 0) {
        set.clear();
        forceUpdate();
      }
    },

    get length() {
      return set.size;
    },

    values() {
      return Array.from(set.values());
    },

    map<R>(callback: (item: T, index: number) => R) {
      return Array.from(set.values()).map(callback);
    },
  };
}
