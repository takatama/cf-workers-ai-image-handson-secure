const MAX_LENGTH = 2048;

export function sanitize(input) {
  const sanitized = input
    .replace(/[^\p{L}\p{N}\s,.!?'"-]/gu, "")
    .slice(0, MAX_LENGTH);
  return sanitized;
}
