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
  const strLower = str.toLowerCase().trim();
  const words = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  return words.every((word) => strLower.includes(word));
}
