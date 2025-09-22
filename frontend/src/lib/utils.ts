import cn from "mxcn";

import { pickFile } from "./pick-file";

export { cn };

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export { pickFile };

export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

export function kwMatch(str: string, keyword: string): boolean {
  const strcased = str.toLowerCase();
  const words = keyword.split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (strcased.indexOf(word.toLowerCase()) < 0) return false;
  }
  return true;
}
