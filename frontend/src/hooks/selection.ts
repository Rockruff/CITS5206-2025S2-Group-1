import { useMemo, useState } from "react";

export interface Selection<T extends { id: string }> {
  /** Map-like interfaces */
  add: (...items: T[]) => void;
  remove: (...items: T[]) => void;
  has: (...items: T[]) => boolean;
  clear: () => void;
  /** Array-like interfaces */
  length: number;
  map: <R>(callback: (item: T, index: number) => R) => R[];
}

export function useSelection<T extends { id: string }>(initialSelected: T[] = []): Selection<T> {
  const map = useMemo(() => {
    const m = new Map<string, T>();
    initialSelected.forEach((item) => m.set(item.id, item));
    return m;
  }, []);

  const [, setVersion] = useState(0);
  const forceUpdate = () => setVersion((v) => v + 1);

  return {
    add(...items: T[]) {
      let changed = false;
      items.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
          changed = true;
        }
      });
      if (changed) forceUpdate();
    },

    remove(...items: T[]) {
      let changed = false;
      items.forEach((item) => {
        if (map.has(item.id)) {
          map.delete(item.id);
          changed = true;
        }
      });
      if (changed) forceUpdate();
    },

    has(...items: T[]) {
      return items.every((item) => map.has(item.id));
    },

    clear() {
      if (map.size > 0) {
        map.clear();
        forceUpdate();
      }
    },

    get length() {
      return map.size;
    },

    map<R>(callback: (item: T, index: number) => R) {
      return Array.from(map.values()).map(callback);
    },
  };
}
