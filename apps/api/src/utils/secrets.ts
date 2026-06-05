import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function matchesSecret(provided: string | undefined, expected: string) {
  if (!provided) {
    return false;
  }

  return timingSafeEqual(digest(provided), digest(expected));
}
